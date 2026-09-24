import { ApiResponse } from "../types/http.types.js"
import { Response } from 'express'

// classe HTTP para respostas bem-sucedidas
export class AppResponse<T = unknown> implements ApiResponse<T> {
    public readonly success: boolean
    public readonly statusCode: number
    public readonly message: string
    public readonly data?: T // recebe vários tipos de dados

    constructor(statusCode: number, message: string, data?: T) {
        this.success = statusCode >= 200 && statusCode < 300 // se estiver no intervalo, ganha true
        this.statusCode = statusCode
        this.message = message
        this.data = data
    }

    // método para enviar response de sucesso
    public static send<T>(res: Response, status: number, message: string, data?: T): Response {
        // instancia classe - usa desestruturação p/ não imprimir statusCode
        const { statusCode, ...response } = new AppResponse(status, message, data)
        // retorna response
        return res.status(statusCode).json(response)
    }
}