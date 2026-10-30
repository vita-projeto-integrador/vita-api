import { createReadStream } from 'node:fs'
import type { Dirent, Stats } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { Readable } from 'node:stream'
import type { StorageProvider, StoredObjectInfo } from '../types/storage.types.js'
import { StorageError } from '../errors/storage-error.js'
import { assertValidKey, contentTypeFromKey } from './keys.js'

/*
    códigos de erro do sistema
*/
const UNAVAILABLE_ERROR_CODES = ['EACCES', 'EPERM', 'EROFS', 'ENOSPC', 'EDQUOT', 'EMFILE'] // storage inutilizável
const MISSING_ERROR_CODES = ['ENOENT', 'ENOTDIR'] // arquivo ou pasta não existe

/* 
    Adaptador que armazena arquivos no disco local
    objects/ -> 1 arquivo por key
    tmp/ -> `.part` ainda sendo gravados
    1. converter a key em caminho
    2. executar a operação de disco no try
    3. traduzir erro no catch
*/
export class LocalStorageProvider implements StorageProvider {
    private readonly objectsDir: string
    private readonly tmpDir: string

    // root: caminho absoluto da raiz do storage (do .env)
    constructor(root: string) {
        if (!path.isAbsolute(root)) {
            throw new Error(`>> [Storage] STORAGE_ROOT deve ser um caminho absoluto: ${root}`)
        }

        this.objectsDir = path.join(root, 'objects')
        this.tmpDir = path.join(root, 'tmp')
    }

    /*
        CICLO DE VIDA DO STORAGE
    */

    // cria pastas e testa gravação
    async init(): Promise<void> {
        try {
            await fs.mkdir(this.objectsDir, { recursive: true })
            await fs.mkdir(this.tmpDir, { recursive: true })
        } catch (error) {
            throw this.mapFsError(error)
        }

        await this.healthCheck()
    }

    // grava e apaga arquivo de teste
    async healthCheck(): Promise<void> {
        const probeFile = path.join(this.tmpDir, `.probe-${randomUUID()}`)

        try {
            await fs.writeFile(probeFile, '')
            await fs.rm(probeFile, { force: true })
        } catch (error) {
            throw new StorageError('STORAGE_UNAVAILABLE', 'Storage sem permissão de escrita', {
                cause: error,
            })
        }
    }

    /*
        ESCRITA NO STORAGE
    */

    // grava o arquivo de forma atômica - se key já existe, sobrescreve
    async put(key: string, data: Buffer): Promise<StoredObjectInfo> {
        const targetFile = this.toPath(key)
        const tmpFile = path.join(this.tmpDir, `${randomUUID()}.part`)

        try {
            // garante que destino existe
            await fs.mkdir(path.dirname(targetFile), { recursive: true })

            // grava primeiro no temporário
            await fs.writeFile(tmpFile, data, { flag: 'wx' }) // flag 'wx' = falha se o arquivo já existir

            // move do temporário pro final
            await fs.rename(tmpFile, targetFile)

            // lê metadados
            const stats = await fs.stat(targetFile)
            return this.toInfo(key, stats)
        } catch (error) {
            // se falhou, apaga temporário tmmb
            await this.removeQuietly(tmpFile)
            throw this.mapFsError(error, key)
        }
    }

    /*
        LEITURA NO STORAGE
    */

    // lê o arquivo inteiro na memória
    async getBuffer(key: string): Promise<Buffer> {
        const filePath = this.toPath(key)

        try {
            // sem encoding: lê como binário
            return await fs.readFile(filePath)
        } catch (error) {
            throw this.mapFsError(error, key)
        }
    }

    // abre  como stream para enviar na resposta HTTP sem carregar tudo na memória
    async getStream(key: string): Promise<{ stream: Readable; info: StoredObjectInfo }> {
        // confere se o arquivo existe antes de abrir o stream
        const info = await this.stat(key)

        if (info === null) {
            throw new StorageError('STORAGE_NOT_FOUND', 'Objeto não encontrado', { key })
        }

        // abre stream de leitura
        const filePath = this.toPath(key)
        const stream = createReadStream(filePath)

        return { stream, info }
    }

    // retorna metadados ou null
    async stat(key: string): Promise<StoredObjectInfo | null> {
        const filePath = this.toPath(key)

        try {
            const stats = await fs.stat(filePath)

            // pasta com o mesmo nome não conta como arquivo
            if (!stats.isFile()) {
                return null
            }

            return this.toInfo(key, stats)
        } catch (error) {
            if (this.isMissingError(error)) {
                return null
            }
            throw this.mapFsError(error, key)
        }
    }

    /*
        DELEÇÃO NO STORAGE
    */

    // apaga arquivo
    async delete(key: string): Promise<void> {
        const filePath = this.toPath(key)

        try {
            // force: true -> não lança erro se o arquivo não existir
            await fs.rm(filePath, { force: true })
        } catch (error) {
            throw this.mapFsError(error, key)
        }

        await this.removeEmptyParentDirs(path.dirname(filePath))
    }

    // apaga todos os arquivos sob o prefixo e retorna quantos foram apagados
    async deletePrefix(prefix: string): Promise<number> {
        // trava de segurança: exige pelo menos 2 segmentos
        const segments = prefix.split('/')
        if (segments.length < 2) {
            throw new StorageError('STORAGE_INVALID_KEY', 'Prefixo amplo demais para deleção', {
                key: prefix,
            })
        }

        const dirPath = this.toPath(prefix)

        // conta antes de apagar
        let deletedCount = 0
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const item of this.list(prefix)) {
            deletedCount++
        }

        // apaga a pasta inteira
        try {
            await fs.rm(dirPath, { recursive: true, force: true })
        } catch (error) {
            throw this.mapFsError(error, prefix)
        }

        await this.removeEmptyParentDirs(path.dirname(dirPath))

        return deletedCount
    }

    /*
        LISTAGEM
        Percorre todos os arquivos sob o prefixo
        Async * cria um gerador assíncrono para evitar lista enorme na memória
    */
    async *list(prefix: string): AsyncIterable<StoredObjectInfo> {
        const dirPath = this.toPath(prefix)

        // lê todas as entradas da pasta, incluindo subpastas
        let entries: Dirent[]
        try {
            entries = await fs.readdir(dirPath, { recursive: true, withFileTypes: true })
        } catch (error) {
            // prefixo não existe -> lista vazia
            if (this.isMissingError(error)) {
                return
            }
            throw this.mapFsError(error, prefix)
        }

        // entrega apenas os arquivos
        for (const entry of entries) {
            if (!entry.isFile()) {
                continue
            }

            const fullPath = path.join(entry.parentPath, entry.name)

            try {
                const stats = await fs.stat(fullPath)
                const key = this.toKey(fullPath)
                yield this.toInfo(key, stats)
            } catch (error) {
                // o arquivo pode ter sido apagado durante a listagem
                if (this.isMissingError(error)) {
                    continue
                }
                throw this.mapFsError(error)
            }
        }
    }

    /*
        CONVERSÕES KEY -> CAMINHO
        Converte key em caminho absoluto para objects/
    */

    private toPath(key: string): string {
        // valida o formato da key
        assertValidKey(key)

        // monta caminho garantindo separador correto
        const keyParts = key.split('/')
        const fullPath = path.join(this.objectsDir, ...keyParts)

        // defesa extra: caminho deve continuar dentro de objects/
        const relativePath = path.relative(this.objectsDir, fullPath)
        const isOutside =
            relativePath === '' || relativePath.startsWith('..') || path.isAbsolute(relativePath)

        if (isOutside) {
            throw new StorageError('STORAGE_INVALID_KEY', 'Key resolve para fora do storage', { key })
        }

        return fullPath
    }

    // converte caminho absoluto em key usando '/'. */
    private toKey(fullPath: string): string {
        const relativePath = path.relative(this.objectsDir, fullPath)
        const parts = relativePath.split(path.sep)
        return parts.join('/')
    }

    // monta objeto de metadados
    private toInfo(key: string, stats: Stats): StoredObjectInfo {
        return {
            key: key,
            size: stats.size,
            contentType: contentTypeFromKey(key),
            updatedAt: stats.mtime,
        }
    }

    /*
        Auxiliares
    */

    // tenta apagar um arquivo e ignora qualquer erro (limpezas)
    private async removeQuietly(filePath: string): Promise<void> {
        try {
            await fs.rm(filePath, { force: true })
        } catch {
            // Ignorado - manutenção apaga sobras de tmp/ depois
        }
    }

    // remove pastas vazias subindo até objects/
    private async removeEmptyParentDirs(startDir: string): Promise<void> {
        let currentDir = startDir

        while (currentDir.startsWith(this.objectsDir + path.sep)) {
            try {
                // rmdir só funciona em pastas vazias
                await fs.rmdir(currentDir)
            } catch {
                // pasta não vazia/removida -> para de subir
                return
            }

            currentDir = path.dirname(currentDir)
        }
    }

    /*
        TRATAMENTO DE ERROS
    */

    // extrai código do sistema se existir
    private getErrorCode(error: unknown): string | undefined {
        if (error instanceof Error && 'code' in error && typeof error.code === 'string') {
            return error.code
        }
        return undefined
    }

    // verifica se o erro significa "arquivo ou pasta não existe"
    private isMissingError(error: unknown): boolean {
        const code = this.getErrorCode(error)

        if (code === undefined) {
            return false
        }

        return MISSING_ERROR_CODES.includes(code)
    }

    // traduz erros do sistema para StorageError
    private mapFsError(error: unknown, key?: string): StorageError {
        // erros já traduzidos são devolvidos do mesmo jeito
        if (error instanceof StorageError) {
            return error
        }

        const code = this.getErrorCode(error)
        const options = { key: key, cause: error }

        if (code === 'ENOENT') {
            return new StorageError('STORAGE_NOT_FOUND', 'Objeto não encontrado', options)
        }

        if (code !== undefined && UNAVAILABLE_ERROR_CODES.includes(code)) {
            return new StorageError('STORAGE_UNAVAILABLE', `Storage indisponível (${code})`, options)
        }

        return new StorageError('STORAGE_FAILURE', `Falha de E/S no storage (${code})`, options)
    }
}