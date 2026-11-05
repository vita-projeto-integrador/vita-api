import multer, { MulterError } from "multer"
import AppError from "./app-error.js"

interface MulterErrorInfo {
    message: string,
    status: number
}

// códigos de erro do multer
const MULTER_ERRORS = {
    LIMIT_PART_COUNT: {
        message: 'Quantidade máxima de partes excedida',
        status: 400
    },
    LIMIT_FILE_SIZE: {
        message: 'Arquivo muito grande',
        status: 413
    },
    LIMIT_FILE_COUNT: {
        message: 'Quantidade máxima de arquivos excedida',
        status: 400
    },
    LIMIT_FIELD_KEY: {
        message: 'Nome do campo muito grande',
        status: 400
    },
    LIMIT_FIELD_VALUE: {
        message: 'Valor do campo muito grande',
        status: 413
    },
    LIMIT_FIELD_COUNT: {
        message: 'Quantidade máxima de campos excedida',
        status: 400
    },
    LIMIT_UNEXPECTED_FILE: {
        message: 'Campo de arquivo inesperado',
        status: 400
    },
    MISSING_FIELD_NAME: {
        message: 'Nome do campo ausente',
        status: 400
    }
} as const satisfies Record<multer.ErrorCode, MulterErrorInfo>

// retorno default
const FALLBACK = { message: 'Upload inválido', status: 400 }

// traduz erro do multer em AppError
export function mapMulterError(error: unknown): AppError {
    if (error instanceof AppError) return error

    if (error instanceof MulterError) {
        const { status, message } = MULTER_ERRORS[error.code] ?? FALLBACK
        return new AppError(status, message)
    }

    return new AppError(400, 'Requisição de upload malformada')
}