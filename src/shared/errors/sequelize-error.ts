import {
    BaseError,
    ConnectionError,
    ForeignKeyConstraintError,
    UniqueConstraintError,
    ValidationError,
} from 'sequelize'
import AppError from './app-error.js'

export function mapSequelizeError(err: unknown): AppError | undefined {
    if (!(err instanceof BaseError)) return undefined

    // antes de ValidationError: UniqueConstraintError herda dela
    if (err instanceof UniqueConstraintError) {
        const field = Object.keys(err.fields ?? {})
        return new AppError(409, 'Registro já existente', {
            errors: field.map((field) => ({ field, message: `${field} já está em uso` })),
            cause: err,
        })
    }

    if (err instanceof ForeignKeyConstraintError) {
        return new AppError(409, 'Operação viola relacionamento entre registros', { cause: err })
    }

    if (err instanceof ValidationError) {
        return new AppError(400, 'Dados inválidos', {
            errors: err.errors.map((item) => ({ field: item.path, message: item.message })),
            cause: err,
        })
    }

    if (err instanceof ConnectionError) {
        return new AppError(503, 'Serviço temporariamente indisponível', { cause: err })
    }

    // DatabaseError genérico (SQL inválido, coluna inexistente) é bug: deixa cair no caminho de bug
    return undefined
}
