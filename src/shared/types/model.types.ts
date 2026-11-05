// tipos compartilhados entre models

// ponto GeoJSON [longitude, latitude].
export interface Ponto {
    type: 'Point'
    coordinates: [number, number]
    crs?: { type: 'name'; properties: { name: 'EPSG:4326' } }
}