import { Request, Response, NextFunction, RequestHandler } from "express"
import multer from "multer"
import AppError from "../errors/app-error.js"
import { BaseUploadPolicy } from "../types/multer.types.js"

// factory de handlers 
// recebe política + arquivo, cria middleware adequeado, devole arquivo verificado ou erro
export const createUploadMiddleware = (policy: BaseUploadPolicy): RequestHandler => {
    const handler = multer({
        storage: multer.memoryStorage(),
        limits: 
    })
}

// converte limites da política para limites do multer
function toMulterLimits(policy: BaseUploadPolicy): 