/**
 * Classe personalizada de erros
 * @param {string} message mensagem explicativa
 * @param {number} statusCode código de status HTTP
 * @param {boolean} isOperational erro operacional ou inesperado
 */
class AppError extends Error {
    public readonly statusCode: number
    public readonly isOperational: boolean

    constructor(statusCode = 400, message: string, isOperational = true) {
        super(message) // chama construtor da classe error
        this.statusCode = statusCode
        this.isOperational = isOperational
        // garante que instanceof AppError funcione
        Object.setPrototypeOf(this, new.target.prototype)
    }
}

export default AppError