import { ApiResponse } from "../types/http.js"
import { Response } from 'express'
/**
    Classe de resposta HTTP bem-sucedida
    @description Aplica o contrato HTTP ApiResponse e retorna respostas formatadas
*/
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

    /**
     * Método de resposta HTTP
     * @description retorna uma resposta HTTP formatada
     * @param {Response} res objeto de resposta
     * @param {number} statusCode código de status HTTP 
     * @param message mensagem que acompanha a resposta
     * @param data payload de dados de quaisquer tipos
     */
    public static send<T>(res: Response, statusCode: number, message: string, data?: T): Response {
        // instancia classe
        const response = new AppResponse(statusCode, message, data)
        // retorna response
        return res.status(statusCode).json(response)
    }
}