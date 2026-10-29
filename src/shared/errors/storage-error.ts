
// códigos de erro do storage
export type StorageErrorCode =
    | 'STORAGE_NOT_FOUND'      // key não existe
    | 'STORAGE_INVALID_KEY'    // key fora do formato
    | 'STORAGE_UNAVAILABLE'    // sem permissão, disco cheio, somente leitura
    | 'STORAGE_FAILURE'        // outros erros de E/S (default)

export interface StorageErrorOptions {
    key?: string // apenas pra log, nunca em resposta HTTP
    cause?: unknown // erro original do 'fs'
}

// erro de storage
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