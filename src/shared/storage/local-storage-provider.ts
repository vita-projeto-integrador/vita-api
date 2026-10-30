import fs from 'node:fs/promises'
import { createReadStream, type Dirent } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { Readable } from 'node:stream'
import type { StorageProvider } from '../types/storage.types.js'
import { StorageError } from '../errors/storage-error.js'
import { assertValidKey } from './keys.js'

// códigos de erro do sistema
const UNAVAILABLE_CODES = ['EACCES', 'EPERM', 'EROFS', 'ENOSPC', 'EDQUOT', 'EMFILE'] // storage inutilizável
const MISSING_CODES = ['ENOENT', 'ENOTDIR'] // recurso não existe

/*
    Adaptador de storage em disco local
    STORAGE_ROOT/
        files/ -> um arquivo por key
        tmp/   -> gravações em andamento (.part)
    tmp/ fica na mesma raiz para que o rename final seja atômico (mesmo disco)

    padrão dos métodos:
    1. converte a key em caminho (toPath já valida a key)
    2. executa a operação de disco no try
    3. traduz o erro do sistema no catch (toStorageError)
*/
export class LocalStorageProvider implements StorageProvider {
    private readonly filesDir: string
    private readonly tmpDir: string
    private readonly tmpTtlMs: number

    // root já chega absoluto do .env
    constructor(root: string, tmpTtlMs: number) {
        this.filesDir = path.join(root, 'files')
        this.tmpDir = path.join(root, 'tmp')
        this.tmpTtlMs = tmpTtlMs
    }

    /*
        ciclo de vida
    */

    // cria pastas, limpa sobras de tmp/ e testa gravação
    async init(): Promise<void> {
        try {
            await fs.mkdir(this.filesDir, { recursive: true })
            await fs.mkdir(this.tmpDir, { recursive: true })
        } catch (error) {
            throw this.toStorageError(error)
        }

        await this.cleanTmp()
        await this.healthCheck()
    }

    // grava e apaga um arquivo de teste (mkdir sozinho não detecta falta de permissão)
    async healthCheck(): Promise<void> {
        const testFile = path.join(this.tmpDir, `teste-${randomUUID()}`)

        try {
            await fs.writeFile(testFile, '')
            await fs.rm(testFile, { force: true })
        } catch (error) {
            throw new StorageError('UNAVAILABLE', 'Storage sem permissão de escrita', { cause: error })
        }
    }

    /*
        escrita
    */

    // grava primeiro em tmp/ e depois move: quem lê nunca vê o arquivo pela metade
    async save(key: string, data: Buffer): Promise<void> {
        const filePath = this.toPath(key)
        const tmpPath = path.join(this.tmpDir, `${randomUUID()}.part`)

        try {
            await fs.mkdir(path.dirname(filePath), { recursive: true })
            await fs.writeFile(tmpPath, data)
            await fs.rename(tmpPath, filePath) // troca atômica; sobrescreve se já existir
        } catch (error) {
            // remove o temporário; se falhar, cleanTmp apaga no próximo boot
            await fs.rm(tmpPath, { force: true }).catch(() => {})
            throw this.toStorageError(error, key)
        }
    }

    /*
        leitura
    */

    // lê o arquivo inteiro (sem encoding = binário)
    async read(key: string): Promise<Buffer> {
        const filePath = this.toPath(key)

        try {
            return await fs.readFile(filePath)
        } catch (error) {
            throw this.toStorageError(error, key)
        }
    }

    // confere a existência antes de abrir o stream:
    // assim o erro acontece antes de a resposta HTTP começar
    async readStream(key: string): Promise<Readable> {
        const found = await this.exists(key)

        if (!found) {
            throw new StorageError('NOT_FOUND', 'Arquivo não encontrado', { key })
        }

        return createReadStream(this.toPath(key))
    }

    async exists(key: string): Promise<boolean> {
        const filePath = this.toPath(key)

        try {
            const stats = await fs.stat(filePath)
            return stats.isFile() // pasta com o mesmo nome não conta
        } catch (error) {
            if (this.isMissing(error)) return false
            throw this.toStorageError(error, key)
        }
    }

    // percorre a pasta do prefixo (e subpastas) e devolve só os arquivos
    async list(prefix: string): Promise<string[]> {
        const folderPath = this.toPath(prefix)
        let entries: Dirent[]

        try {
            entries = await fs.readdir(folderPath, { recursive: true, withFileTypes: true })
        } catch (error) {
            if (this.isMissing(error)) return [] // prefixo inexistente = lista vazia
            throw this.toStorageError(error, prefix)
        }

        const keys: string[] = []
        for (const entry of entries) {
            if (!entry.isFile()) continue
            const filePath = path.join(entry.parentPath, entry.name)
            keys.push(this.toKey(filePath))
        }
        return keys
    }

    /*
        deleção
    */

    // force: true -> não falha se o arquivo não existir (seguro para retries)
    async delete(key: string): Promise<void> {
        const filePath = this.toPath(key)

        try {
            await fs.rm(filePath, { force: true })
        } catch (error) {
            throw this.toStorageError(error, key)
        }
    }

    async deleteByPrefix(prefix: string): Promise<void> {
        // trava: exige ao menos 2 segmentos ("analises" sozinho apagaria tudo)
        if (prefix.split('/').length < 2) {
            throw new StorageError('INVALID_KEY', 'Prefixo amplo demais para deleção', { key: prefix })
        }

        const folderPath = this.toPath(prefix)

        try {
            await fs.rm(folderPath, { recursive: true, force: true })
        } catch (error) {
            throw this.toStorageError(error, prefix)
        }
    }

    /*
        auxiliares
    */

    // key -> caminho absoluto dentro de files/
    private toPath(key: string): string {
        assertValidKey(key)

        // separar por '/' e juntar com path.join garante o separador certo no Windows
        const filePath = path.join(this.filesDir, ...key.split('/'))

        // defesa extra: o caminho final precisa continuar dentro de files/
        if (!filePath.startsWith(this.filesDir + path.sep)) {
            throw new StorageError('INVALID_KEY', 'Key aponta para fora do storage', { key })
        }

        return filePath
    }

    // caminho absoluto -> key (sempre com '/', inclusive no Windows)
    private toKey(filePath: string): string {
        const relativePath = path.relative(this.filesDir, filePath)
        return relativePath.split(path.sep).join('/')
    }

    // apaga arquivos de tmp/ mais antigos que STORAGE_TMP_TTL_HOURS
    // (sobras de gravações interrompidas por crash)
    private async cleanTmp(): Promise<void> {
        const limit = Date.now() - this.tmpTtlMs

        try {
            const names = await fs.readdir(this.tmpDir)

            for (const name of names) {
                const tmpPath = path.join(this.tmpDir, name)
                const stats = await fs.stat(tmpPath)

                if (stats.mtimeMs < limit) {
                    await fs.rm(tmpPath, { force: true })
                }
            }
        } catch (error) {
            // limpeza não impede o boot; tenta de novo no próximo
            console.warn(`>> [Storage] Falha ao limpar tmp/: ${error}`)
        }
    }

    /*
        tratamento de erros
    */

    // extrai o código do erro do sistema (ex.: 'ENOENT')
    private getErrorCode(error: unknown): string | undefined {
        if (error instanceof Error && 'code' in error && typeof error.code === 'string') {
            return error.code
        }
        return undefined
    }

    private isMissing(error: unknown): boolean {
        const code = this.getErrorCode(error)
        return code !== undefined && MISSING_CODES.includes(code)
    }

    // traduz erro do sistema em StorageError
    private toStorageError(error: unknown, key?: string): StorageError {
        // erro já traduzido (ex.: key inválida) segue como está
        if (error instanceof StorageError) return error

        const code = this.getErrorCode(error)

        if (code === 'ENOENT') {
            return new StorageError('NOT_FOUND', 'Arquivo não encontrado', { key, cause: error })
        }
        if (code !== undefined && UNAVAILABLE_CODES.includes(code)) {
            return new StorageError('UNAVAILABLE', `Storage indisponível (${code})`, { key, cause: error })
        }
        return new StorageError('FAILURE', `Falha de leitura/escrita (${code})`, { key, cause: error })
    }
}