import { Request, Response, NextFunction, RequestHandler } from 'express'
import AppError from '../errors/app-error.js'

export const notFoundHandler: RequestHandler = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    next(new AppError(404, 'Rota não encontrada', { detail: `${req.method} ${req.originalUrl}` }))
}