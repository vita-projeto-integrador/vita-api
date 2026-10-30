import { env } from './env.config.js'
import type { StorageProvider } from '../types/storage.types.js'
import { LocalStorageProvider } from '../storage/local-storage-provider.js'

const { storage: storageEnv } = env

// factory: escolhe o adaptador conforme STORAGE_DRIVER
function createStorage(): StorageProvider {
    switch (storageEnv.driver) {
        case 'local':
            return new LocalStorageProvider(storageEnv.root, storageEnv.tmpTtlMs)
        default:
            throw new Error(`STORAGE_DRIVER desconhecido: ${storageEnv.driver}`)
    }
}

// instância única
const storage: StorageProvider = createStorage()

export default storage