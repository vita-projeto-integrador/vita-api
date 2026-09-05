import { Request, Response, NextFunction, ErrorRequestHandler } from 'express'
import AppError from '../errors/app-error.js'
/**
 * Middleware de erro global
 * @description última camada de tratamento de erros HTTP
 * @param err erro capturado em controller/service
 * @param req objeto de requisição HTTP
 * @param res objeto de resposta HTTP
 * @param next função que envia req para errorHandler
 * @returns 
 */
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
    console.error(`>> [Express Bug]: ${err.message}`)
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
    })
}