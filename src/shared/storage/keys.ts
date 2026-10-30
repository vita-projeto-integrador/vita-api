import validator from 'validator'
import { allowedImageFormats, type ImageFormat } from '../config/formats.config.js'
import { StorageError } from '../errors/storage-error.js'

/*
    Keys do Storage
    key = endereço lógico do arquivo, salvo no banco (imagens.caminho, processada.caminho, usuario.foto_perfil)
*/

// variações de uma imagem 
export const IMAGE_VARIANTS = ['original', 'processada', 'miniatura'] as const
export type ImageVariant = (typeof IMAGE_VARIANTS)[number]

// restrições
const MAX_KEY_LENGTH = 512
const KEY_CHARACTERS = /^[a-z0-9/._-]+$/ // minúsculas, dígitos, / . _ -

// valida key
export function isValidKey(key: string): boolean {
    // tamanho
    if (key.length === 0 || key.length > MAX_KEY_LENGTH) return false
    // caracteres
    if (!KEY_CHARACTERS.test(key)) return false
    // sem barra no início ou no fim
    if (key.startsWith('/') || key.endsWith('/')) return false
    // sem ".." (subir de pasta) e sem "//" (segmento vazio)
    if (key.includes('..') || key.includes('//')) return false

    return true
}

// lança erro para key inválida
export function assertValidKey(key: string): void {
    if (!isValidKey(key)) {
        throw new StorageError('INVALID_KEY', 'Key fora do formato permitido', { key })
    }
}

// garante que o id é um UUID antes de usá-lo como segmento da key
function checkId(id: string, label: string): string {
    if (!validator.isUUID(id)) {
        throw new StorageError('INVALID_KEY', `${label} inválido para key`, { key: id })
    }
    return id
}

// constrói prefixo da key
export function analysisPrefix(userId: string, analysisId: string): string {
    const user = checkId(userId, 'idUsuario')
    const analysis = checkId(analysisId, 'idAnalise')
    return `analises/${user}/${analysis}`
}

// monta key completa para imagens de análise
export function analysisImageKey(
    userId: string,
    analysisId: string,
    imageId: string,
    variant: ImageVariant,
    format: ImageFormat
): string {
    const prefix = analysisPrefix(userId, analysisId)
    const image = checkId(imageId, 'idImagem')
    const ext = allowedImageFormats[format].ext
    return `${prefix}/${image}/${variant}.${ext}`
}

// monta key completa para imagens de foto de perfil
export function profilePhotoKey(userId: string, format: ImageFormat): string {
    const user = checkId(userId, 'idUsuario')
    const ext = allowedImageFormats[format].ext
    return `usuarios/${user}/foto-perfil.${ext}`
}