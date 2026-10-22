import type { Response } from 'express'
import type { SuccessResponse } from '../types/http.types.js'

// status de sucesso aceitos (204 não tem corpo, então não usa esta classe)
type SuccessStatus = 200 | 201 | 202

// classe HTTP para respostas bem-sucedidas
export class AppResponse<T = unknown> implements SuccessResponse<T> {
    public readonly success = true
    public readonly message: string
    public readonly data?: T // recebe vários tipos de dados

    constructor(message: string, data?: T) {
        this.message = message
        this.data = data
    }

    // envia response de sucesso
    public static send<T>(res: Response, statusCode: SuccessStatus, message: string, data?: T): Response {
        return res.status(statusCode).json(new AppResponse(message, data))
    }
}