import type { Ponto } from '../types/model.types.js'

// localização no formato do contrato do mapa
export interface Localizacao {
    latitude: number
    longitude: number
    precisao: number // raio de erro do GPS, em metros
}

// leituras com erro maior que isso não entram no mapa (em metros)
export const MAX_PRECISAO = 20

export function toPonto(latitude: number, longitude: number): Ponto {
    return {
        type: 'Point',
        coordinates: [longitude, latitude], // GeoJSON: longitude primeiro
        crs: { type: 'name', properties: { name: 'EPSG:4326' } }
    }
}

export function fromPonto(ponto: Ponto | null) {
    if (!ponto) return null
    const [longitude, latitude] = ponto.coordinates
    return { latitude, longitude }
}

// ponto do banco + precisão -> localização do contrato (ou null)
export function toLocalizacao(ponto: Ponto | null, precisao: number | null): Localizacao | null {
    const coords = fromPonto(ponto)
    if (!coords || precisao === null) return null
    return { ...coords, precisao }
}

// local da análise: a leitura com menor erro, desde que até MAX_PRECISAO
export function pickAnalysisLocation(locations: (Localizacao | null)[]): Localizacao | null {
    const valid = locations.filter(
        (location): location is Localizacao => location !== null && location.precisao <= MAX_PRECISAO
    )
    if (valid.length === 0) return null
    return valid.reduce((best, location) => (location.precisao < best.precisao ? location : best))
}