import path, { relative } from 'path'
import fs from 'fs/promises' // importa módulo assíncrono do pacote
import { v4 as uuidv4 } from 'uuid'
import AppError from '../appError.js'

class StorageService {
    async save(buffer, folder, ext) {
        if (!Buffer.isBuffer(buffer)) {
            throw new AppError('Buffer inválido', 400)
        }
        try {
            // define caminho absoluto de destino
            const filename = uuidv4()
            const fullPath = path.resolve('storage', 'temp', folder, `${filename}${ext}`)

            // cria pasta de destino
            await fs.mkdir(path.dirname(fullPath), { recursive: true })

            // cria arquivo webp a partir do buffer
            await fs.writeFile(fullPath, buffer)

            return fullPath
        } catch (error) {
            console.error('>> [Storage] Não foi possível salvar buffer como arquivo temporário: ', error)
        }

    }
    async move(fullPath, folder, analysisId, userId) {
        try {
            // consulta data de criação do arquivo
            // const dt = new Date()
            // const month = dt.getMonth() + 1
            // const year = dt.getFullYear()
            // define caminho de destino
            const parsedPath = path.parse(fullPath)
            // caminho relativo dentro do storage
            const relativeDestination = path.posix.join(
                'storage',
                `${folder}`,
                'analysis',
                // `${year}`,
                // `${month}`,
                `${userId}`,
                `${analysisId}`,
                parsedPath.base
            )
            // caminho absoluto final
            const fullDestination = path.resolve(
                relativeDestination
            )
            // cria diretório
            await fs.mkdir(path.dirname(fullDestination), {
                recursive: true
            })
            // move arquivo
            await fs.rename(fullPath, fullDestination)

            return relativeDestination
        } catch (error) {
            console.error('>> [Storage] Não foi possível mover o arquivo temporário: ', error)
        }

    }
    async cleanTemp(folder) {
        try {
            const tempDir = path.resolve('storage', 'temp', folder)
            await fs.rm(tempDir, {
                recursive: true,
                force: true
            })
        } catch (error) {
            console.error('>> [Storage] Não foi possível limpar a pasta temporária: ', error)
        }
    }
    async savePayload(object, folder) {
        try {
            // define caminho absoluto de destino
            const fullPath = path.resolve('storage', 'temp', folder, 'payload.json')

            // cria pasta de destino
            await fs.mkdir(path.dirname(fullPath), { recursive: true })

            // cria json 
            await fs.writeFile(fullPath, JSON.stringify(object, null, 2), 'utf-8')
        } catch (error) {
            console.error('>> [Storage] Não foi possível guardar o payload da análise offline: ', error)
        }

    }
    async readFile(relativePath) {
        try {
            // se for array com pedaços do caminho ao invés de string única
            if (Array.isArray(relativePath)) {
                relativePath = path.join(...relativePath) // spread transforma array em elementos individuais
            }
            const fullPath = path.resolve(relativePath)
            const file = await fs.readFile(fullPath)
            return file
        } catch (error) {
            // ! precisa criar resposta limpa para análise perdida !
            console.error('>> [Storage] Não foi possível acessar esse arquivo: ', error)
        }
    }
}

export default new StorageService()