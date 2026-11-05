import { ZodError } from 'zod'
import AppError from './app-error.js'

export function mapZodError(err: unknown): AppError | undefined {
    if (!(err instanceof ZodError)) return undefined

    return new AppError(400, 'Dados inválidos', {
        errors: err.issues.map((issue) => ({
            field: issue.path.length ? issue.path.map(String).join('.') : null,
            message: issue.message,
        })),
    })
}
