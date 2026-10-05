import type { Request, Response, NextFunction, RequestHandler } from 'express'
import multer, { type Options } from 'multer'
import type { UploadPolicyConfig } from '../types/multer.types.js'
import { allowedImageFormats } from '../config/formats.config.js'
import AppError from '../errors/app-error.js'
import { mapMulterError } from '../errors/multer-error.js'

// factory de middlewares de upload
export function createMulterPolicy(config: UploadPolicyConfig): RequestHandler {
    const { formats, limits, field } = config
    const acceptMimes: readonly string[] = formats.map((f) => allowedImageFormats[f].mime)
    const maxFiles = limits?.files || 1
    const storage: Options['storage'] = multer.memoryStorage()
    const fileFilter: Options['fileFilter'] = (_req, file, cb) => {
        // filtro barato de mimetype declarado pelo cliente
        if (acceptMimes.includes(file.mimetype.toLowerCase())) cb(null, true)
        else cb(new AppError(415, 'Formato de arquivo inválido'))
    }
    // cria handler
    const upload = multer({
        storage,
        limits,
        fileFilter
    }).array(field, maxFiles)

    return (req: Request, res: Response, next: NextFunction) => {
        upload(req, res, (error?: unknown) => {
            if (error) return next(mapMulterError(error))
            if (!Array.isArray(req.files) || req.files.length === 0) {
                return next(new AppError(400, 'Nenhum arquivo enviado no campo esperado'))
            }
            next()
        })
    }
}