import validator from 'validator'
import AppError from './appError.js'

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value)

// valida o campo 'metadados' do envio e devolve um item por imagem
export function parseMetadata(raw, filesCount) {
    // sem o campo, nenhuma foto tem localização (ex.: envio pelo web)
    if (raw === undefined || raw === '') {
        return Array.from({ length: filesCount }, () => ({ capturadaEm: null, localizacao: null }))
    }

    let list
    try {
        list = JSON.parse(raw)
    } catch {
        throw new AppError('Metadados inválidos: JSON malformado', 400)
    }

    // um item por imagem, na mesma ordem do campo 'images'
    if (!Array.isArray(list) || list.length !== filesCount) {
        throw new AppError('Metadados inválidos: envie um item por imagem', 400)
    }

    return list.map(item => ({
        capturadaEm: parseDate(item?.capturadaEm),
        localizacao: parseLocation(item?.localizacao)
    }))
}

// data ISO 8601 ou null
function parseDate(value) {
    if (value === null || value === undefined) return null
    if (typeof value !== 'string' || !validator.isISO8601(value)) {
        throw new AppError('Metadados inválidos: capturadaEm deve ser uma data ISO 8601', 400)
    }
    return new Date(value)
}

// { latitude, longitude, precisao } completo ou null
function parseLocation(value) {
    if (value === null || value === undefined) return null

    const { latitude, longitude, precisao } = value
    const isValid =
        isNumber(latitude) && latitude >= -90 && latitude <= 90 &&
        isNumber(longitude) && longitude >= -180 && longitude <= 180 &&
        isNumber(precisao) && precisao >= 0

    if (!isValid) {
        throw new AppError('Metadados inválidos: localização fora do formato', 400)
    }
    return { latitude, longitude, precisao }
}