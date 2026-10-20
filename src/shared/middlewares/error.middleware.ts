import { Request, Response, NextFunction, ErrorRequestHandler } from 'express'
import AppError from '../errors/app-error.js'

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
    }
    // bugs
    console.error(`>> [Bug]: ${err.message}`)
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
    })
}