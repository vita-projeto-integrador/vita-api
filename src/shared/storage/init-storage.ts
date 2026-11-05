import storage from '../config/storage.config.js'
import { env } from '../config/env.config.js'

// prepara o storage no boot: cria pastas, limpa tmp/ e testa gravação
async function initStorage(): Promise<void> {
    await storage.init()
    console.log(`>> [Storage] Storage ${env.storage.driver} pronto em ${env.storage.root}`)
}

export { initStorage }