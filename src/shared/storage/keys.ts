import { StorageError } from '../errors/storage-error.js'

/*
    Cria e valida keys
    key = endereço lógico de um arquivo (ex.: analyses/1/0f8c2a10-.../original.jpg)
    banco guarda keys, não caminhos de disco
 */

/*
    tipos
*/
export type FileExtension = 'jpg' | 'png' | 'webp' // extensões de arquivo aceitas
export type ImageVariant = 'original' | 'processed' | 'thumbnail' // variações de uma mesma imagem

/*
    constantes
*/
// pasta raiz lógica de todas as análises
const ANALYSES_ROOT = 'analyses'

// tamanho máximo de uma key (em caracteres)
const MAX_KEY_LENGTH = 512

// caracteres permitidos em key
const KEY_ALLOWED_CHARACTERS = /^[a-z0-9/_.-]+$/

// caracteres permitidos num segmento
const SEGMENT_ALLOWED_CHARACTERS = /^[a-z0-9_-]+$/

/*
    validação de keys
*/

// retorno booleano, não lança erro
export function isValidKey(key: string): boolean {
    // verifica tamanho
    if (key.length === 0 || key.length > MAX_KEY_LENGTH) {
        return false
    }

    // verifica caracteres
    if (!KEY_ALLOWED_CHARACTERS.test(key)) {
        return false
    }

    // sem barra ou ponto no início e no fim
    const firstChar = key[0]
    const lastChar = key[key.length - 1]
    if (firstChar === '/' || firstChar === '.' || lastChar === '/' || lastChar === '.') {
        return false
    }

    // sem ".." (subir de pasta) e sem "//" (segmento vazio)
    if (key.includes('..') || key.includes('//')) {
        return false
    }

    return true
}

// garante que a key é válida - lança erro se não for
export function assertValidKey(key: string): void {
    if (!isValidKey(key)) {
        throw new StorageError('STORAGE_INVALID_KEY', 'Key fora do formato permitido', { key })
    }
}

// valida um segmento isolado da key (ex.: userId ou analysisId) e devolve o segmento em texto
function toSegment(value: string | number, label: string): string {
    const text = String(value)

    if (!SEGMENT_ALLOWED_CHARACTERS.test(text)) {
        throw new StorageError('STORAGE_INVALID_KEY', `Segmento de key inválido: ${label}`, { key: text })
    }

    return text
}

/*
    construção de keys
*/

// prefixo com todos os aruqivos por usuário
export function userPrefix(userId: string | number): string {
    const userSegment = toSegment(userId, 'userId')
    return `${ANALYSES_ROOT}/${userSegment}`
}

// prefixo com todos os arquivos por análise
export function analysisPrefix(userId: string | number, analysisId: string): string {
    const analysisSegment = toSegment(analysisId, 'analysisId')
    return `${userPrefix(userId)}/${analysisSegment}`
}

// key completa de uma imagem
export function analysisKey(
    userId: string | number,
    analysisId: string,
    variant: ImageVariant,
    extension: FileExtension,
): string {
    return `${analysisPrefix(userId, analysisId)}/${variant}.${extension}`
}

/*
    variantes e tipos de conteúdo
*/

// verifica se texto qualquer é variante válida
export function isImageVariant(value: string): value is ImageVariant {
    return value === 'original' || value === 'processed'
}

// converte MIME ne extensão da key - tipo não aceito retorna null
export function extensionFromMime(mime: string): FileExtension | null {
    switch (mime) {
        case 'image/jpeg':
            return 'jpg'
        case 'image/png':
            return 'png'
        case 'image/webp':
            return 'webp'
        default:
            return null
    }
}

// descobre content-type a partir da extensão da key
export function contentTypeFromKey(key: string): string {
    const lastDotIndex = key.lastIndexOf('.')
    if (lastDotIndex === -1) {
        return 'application/octet-stream'
    }

    const extension = key.slice(lastDotIndex + 1)

    switch (extension) {
        case 'jpg':
            return 'image/jpeg'
        case 'png':
            return 'image/png'
        case 'webp':
            return 'image/webp'
        default:
            return 'application/octet-stream'
    }
}