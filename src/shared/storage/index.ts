import { env } from '../config/env.config.js'
import type { StorageProvider } from './storage-provider.js'
import { LocalStorageProvider } from './local-storage-provider.js'

/**
 * index.ts
 *
 * Ponto de entrada do módulo de storage.
 *
 * Responsabilidades:
 *   1. Escolher o adaptador de acordo com STORAGE_DRIVER (factory).
 *   2. Criar a instância única usada pela aplicação.
 *   3. Reexportar o que o resto do projeto precisa, para que ninguém
 *      importe arquivos internos do módulo diretamente.
 *
 * Uso no resto do projeto:
 *   import { storage, analysisKey, StorageError } from '../storage/index.js'
 *
 * Importante: criar a instância NÃO acessa o disco. A preparação das pastas
 * acontece em `storage.init()`, chamado no `server.ts` durante o boot.
 */

// ===========================================================================
// Factory
// ===========================================================================

/** Opções necessárias para criar um adaptador de storage. */
export interface StorageFactoryOptions {
    /** Qual adaptador usar (valor de STORAGE_DRIVER). */
    driver: string

    /** Raiz absoluta do storage (usada pelo adaptador local). */
    root: string
}

/**
 * Cria o adaptador de storage correspondente ao driver informado.
 *
 * Este é o ÚNICO lugar do projeto que conhece as classes concretas
 * de adaptador. Para adicionar um novo (ex.: R2), basta um novo `case`.
 */
export function createStorage(options: StorageFactoryOptions): StorageProvider {
    switch (options.driver) {
        case 'local':
            return new LocalStorageProvider(options.root)

        // case 'r2':
        //     return new R2StorageProvider(...)

        default:
            throw new Error(`STORAGE_DRIVER desconhecido: ${options.driver}`)
    }
}

// ===========================================================================
// Instância da aplicação
// ===========================================================================

/**
 * Instância única de storage usada por services, worker e scripts.
 *
 * Services devem recebê-la pelo construtor, com esta instância como padrão,
 * para que testes possam passar outro adaptador:
 *   constructor(private readonly storage: StorageProvider = defaultStorage) {}
 */
export const storage: StorageProvider = createStorage({
    driver: env.storage.driver,
    root: env.storage.root,
})

// ===========================================================================
// Reexportações
// ===========================================================================

// Contrato e tipos
export type { StorageProvider, StoredObjectInfo, StoredObjectStream } from './storage-provider.js'

// Erros
export { StorageError } from '../errors/storage-error.js'
export type { StorageErrorCode } from '../errors/storage-error.js'

// Keys
export {
    analysisKey,
    analysisPrefix,
    userPrefix,
    isValidKey,
    assertValidKey,
    isImageVariant,
    extensionFromMime,
    contentTypeFromKey,
} from './keys.js'
export type { FileExtension, ImageVariant } from './keys.js'