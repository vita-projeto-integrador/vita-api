// leituras com erro de precisão maior não entram no mapa
export const MAX_PRECISAO = 20

// Ponto GeoJSON -> {lat, lon}
// Sequelize -> [lon, lat]
export function toPoint(location) {
    return {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
    }
}

// Ponto GeoJSON -> {lat, lon, precisao}
export function fromPoint(point, precisao) {
    if (!point) return null
    const [longitude, latitude] = point.coordinates
    return { latitude, longitude, precisao }
}

// calcula localização da análise (até MAX_PRECISAO)
export function pickAnalysisLocation(locations) {
    const valid = locations.filter(location => location && location.precisao <= MAX_PRECISAO)
    if (valid.length === 0) return null
    return valid.reduce((best, location) => (location.precisao < best.precisao ? location : best))
}

