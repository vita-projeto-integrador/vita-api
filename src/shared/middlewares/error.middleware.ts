import { Request, Response, NextFunction, ErrorRequestHandler } from 'express'
import AppError from '../errors/app-error.js'
import { mapHttpError } from '../errors/http-error.js'
import type { ErrorResponse } from '../types/http.types.js'
import { StorageError } from '../errors/storage-error.js'

export const errorHandler: ErrorRequestHandler = (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // resposta já iniciada
    if (res.headersSent) {
        next(err) // handler padrão do express encerra conexão
        return
    }
    // se for erro de biblioteca, traduz pra AppError
    const appError = err instanceof AppError ? err : mapHttpError(err)
    // erros esperados
    if (appError) {
        if (appError.statusCode >= 500) {
            console.error('>> [AppError]:', appError.statusCode, req.method, req.originalUrl, appError.message, appError.cause)
        } else {
            console.warn('>> [AppError]:', appError.statusCode, req.method, req.originalUrl, appError.message)
        }
        res.status(appError.statusCode).json({
            success: false,
            message: appError.message,
            detail: appError.detail
        } satisfies ErrorResponse)
        return
    }
    // bugs
    console.error('>> [Bug]:', req.method, req.originalUrl, err)
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
    } satisfies ErrorResponse)
}