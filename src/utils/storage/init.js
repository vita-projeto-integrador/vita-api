import { mkdir } from 'fs/promises' // importa método p/ criar diretórios da versão assíncrona do pacote fs
import path from 'path'

export async function initStorage(){
    // define a raiz do diretório p/ criar a storage
    const storagePath = path.resolve('storage')
    // inclui subpastas da storage usando .map()
    const folders = ['uploads','processed','temp'].map(subFolder => path.join(storagePath, subFolder))

    try {
        // cria pastas de forma paralela (promise) e recursiva (verifica se elas já existem)
        await Promise.all(
            folders.map(dir => mkdir(dir, { recursive : true }))
        )
        console.log('>> [Storage] Storage criada com sucesso')
    } catch (error) {
        console.error('>> [Storage] Erro ao criar storage: ', error)
        process.exit(1)
    }
}