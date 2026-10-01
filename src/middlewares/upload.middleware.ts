import { Request, Response, NextFunction, RequestHandler } from "express"
import multer, { Options } from "multer"
import { MulterError } from "multer"
import { UploadPolicy } from "../types/multer.types.js"
import { imageFormats, resolveAcceptedFormats } from "../config/formats.config.js"

// factory de handlers 
export const createUploadMiddleware = (policy: UploadPolicy): RequestHandler => {
    // configura handler de acordo com a política
    const handler = multer({
        storage: multer.memoryStorage(),
        limits: toMulterLimits(policy),
        fileFilter: createFileFilter(policy)
    }).array(policy.field, policy.maxFiles)
    // retorna arquivo verificado ou erro
    return async (req: Request, res: Response, next: NextFunction) => {
        // verifica tipo de formulário
        if (!req.is('multipart/form-data')) throw new Error('NOT_MULTIPART')
        // executa handler
        await runMulter(handler, req, res).catch((error: unknown) => {
            throw error
        })
    }
}

// converte limites da política para limites do multer
function toMulterLimits(policy: UploadPolicy): NonNullable<Options['limits']> {
    return {
        files: policy.maxFiles,
        fileSize: policy.maxFileBytes,
        fieldNameSize: 100,
        parts: policy.maxFiles + policy.text.maxFields // bloqueia requisições c/ partes demais
    }
}

// cria filtro do multer com base nos tipos válidos da política
function createFileFilter(policy: UploadPolicy): NonNullable<Options['fileFilter']> {
    // rejeição barata baseada no mimetype declarado pelo cliente
    const acceptedMimes = resolveAcceptedFormats(policy).map((format) => format.mime)
    // retorno típico do multer
    return (_req, file, cb) => {
        if (acceptedMimes.includes(file.mimetype.toLocaleLowerCase())) {
            cb(null, true)
        } else {
            cb(new Error('INVALID_MIME_TYPE'))
        }
    }
}

// passa arquivos da requisição pelo handler criado
function runMulter(handler: RequestHandler, req: Request, res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
        void handler(req, res, (err?: unknown) => (err ? reject(err) : resolve()))
    })
}