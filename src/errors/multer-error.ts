import { MulterError } from "multer"
import { UploadPolicy } from "../types/multer.types.js"

const MULTER_ERRORS = {
    LIMIT_PART_COUNT: {
        message: 'Quantidade de partes excedida',
        status: 413
    },
    LIMIT_FILE_SIZE: {
        message: 'Arquivo muito grande',
        status: 413
    },
    LIMIT_FILE_COUNT: {
        message: 'Quantidade de arquivos excedida',
        status: 413
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
        message: 'Quantidade de campos excedida',
        status: 413
    },
    LIMIT_UNEXPECTED_FILE: {
        message: 'Campo de arquivo inesperado',
        status: 400
    },
    MISSING_FIELD_NAME: {
        message: 'Nome do campo ausente',
        status: 400
    }
}

export function mapMulterError(error: MulterError) {
    const { code, field } = error
    const know = MULTER_ERRORS[code]
    if (!know) {
        return {
            status: 400,
            payload: {
                message: 'Erro de upload desconhecido',
                field: error.field
            }
        }
    }
    return {
        status: know.status,
        payload: {
            message: know.message,
            field: error.field
        }
    }
}