import type { ErrorDetail } from '../types/http.types.js'
import type { FieldError } from '../types/http.types.js'

interface AppErrorOptions {
    detail?: ErrorDetail
    cause?: unknown
    errors?: FieldError[]
}

// classe personalizada de erros
class AppError extends Error {
    public readonly statusCode: number
    public readonly detail?: ErrorDetail
    public readonly errors?: FieldError[]

    constructor(statusCode: number, message: string, options: AppErrorOptions = {}) {
        super(message, { cause: options.cause }) // chama construtor da classe error
        this.name = 'AppError'
        this.statusCode = statusCode
        this.detail = options.detail
        this.errors = options?.errors
    }
}

export default AppError
