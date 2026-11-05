import storage from '../config/storage.config.js'

// key do banco (ou null) -> URL temporária de leitura (ou null)
// as respostas da API nunca expõem a key: ela é endereço interno do storage
export async function toFileUrl(key: string | null | undefined): Promise<string | null> {
    return key ? storage.getUrl(key) : null
}