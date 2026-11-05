import path from 'node:path'
import AppError from '../../shared/errors/app-error.js'
import storage from '../../shared/config/storage.config.js'
import { env } from '../../shared/config/env.config.js'
import { isValidSignature } from '../../shared/storage/signed-url.js'
import { extToFormat, formatToMime } from '../../shared/config/formats.config.js'

const { publicUrl } = env.storage

class FileService {
    // confere a URL assinada e abre o arquivo para envio
    async open(key: string, expires: number, signature: string) {
        // 1. assinatura antes de tudo: key ou expiração alteradas = URL inválida
        if (!isValidSignature(key, expires, signature, publicUrl)) {
            throw new AppError(403, 'URL de arquivo inválida')
        }

        // 2. expiração (o cliente pede a URL de novo à rota de origem)
        const maxAge = expires - Math.floor(Date.now() / 1000)
        if (maxAge <= 0) {
            throw new AppError(403, 'URL de arquivo expirada')
        }

        // 3. arquivo precisa existir (StorageError NOT_FOUND viraria 500)
        if (!(await storage.exists(key))) {
            throw new AppError(404, 'Arquivo não encontrado')
        }

        // 4. tipo pela extensão da key (o upload já conferiu os bytes)
        const format = extToFormat(path.extname(key).slice(1))
        const mime = format ? formatToMime(format) : 'application/octet-stream'

        const stream = await storage.readStream(key)

        return { stream, mime, maxAge }
    }
}

export default new FileService()