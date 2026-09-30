// classe personalizada de erros
class AppError extends Error {
    public readonly statusCode: number
    public readonly isOperational: boolean // false = inesperado

    constructor(statusCode = 400, message: string, isOperational = true) {
        super(message) // chama construtor da classe error
        this.statusCode = statusCode
        this.isOperational = isOperational
        // garante que instanceof AppError funcione
        Object.setPrototypeOf(this, new.target.prototype)
    }
}

export default AppError