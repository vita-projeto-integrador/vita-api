import type { Ponto } from '../types/model.types.js'

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