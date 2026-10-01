import { Request, Response, NextFunction, ErrorRequestHandler } from 'express'
import AppError from '../errors/app-error.js'
import { MulterError } from 'multer'
import { mapMulterError } from '../errors/multer-error.js'

export const errorHandler: ErrorRequestHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // erros esperados
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message
        })
        return
    } else if (err instanceof MulterError){
        const mapped = mapMulterError(err)
        res.status(mapped.status).json(mapped.payload)
    }
    // bugs
    console.error(`>> [Bug]: ${err.message}`)
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
    })
}