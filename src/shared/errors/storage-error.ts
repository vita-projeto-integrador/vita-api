import AppError from "./app-error.js"

// códigos de erro do storage
export type StorageErrorCode =
    | 'NOT_FOUND'      // key não existe
    | 'INVALID_KEY'    // key fora do formato
    | 'UNAVAILABLE'    // sem permissão, disco cheio, somente leitura
    | 'FAILURE'        // outros erros de E/S (default)

export interface StorageErrorOptions {
    key?: string // apenas pra log, nunca em resposta HTTP
    cause?: unknown // erro original do 'fs'
}

interface StorageErrorInfo {
    message: string,
    status: number
}

// erro lançado pelos adaptadores de storage
export class StorageError extends Error {
    readonly code: StorageErrorCode
    readonly key?: string

    constructor(code: StorageErrorCode, message: string, options: StorageErrorOptions = {}) {
        super(message, { cause: options.cause })
        this.name = 'StorageError'
        this.code = code
        this.key = options.key
    }
}

// tradução para HTTP
const STORAGE_ERRORS = {
    INVALID_KEY: {
        message: 'Erro interno ao acessar arquivo',
        status: 500
    },
    NOT_FOUND: {
        message: 'Arquivo não encontrado no servidor',
        status: 500
    },
    UNAVAILABLE: {
        message: 'Armazenamento de arquivos indisponível',
        status: 503
    },
    FAILURE: {
        message: 'Erro interno ao acessar arquivo',
        status: 500
    }
} as const satisfies Record<StorageErrorCode, StorageErrorInfo>

// traduz StorageError em AppError
export function mapStorageError(error: unknown): AppError | null {
    if (!(error instanceof StorageError)) return null

    const { status, message } = STORAGE_ERRORS[error.code]

    // key e erro original seguem no cause, só para o log
    return new AppError(status, message, { cause: error })
}