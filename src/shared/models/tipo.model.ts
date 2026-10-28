// tipos compartilhados entre models

// ponto GeoJSON [longitude, latitude].
export interface Ponto {
    type: 'Point'
    coordinates: [number, number]
    crs?: { type: 'name'; properties: { name: 'EPSG:4326' } }
}

export const TIPOS_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const
export type TipoMime = (typeof TIPOS_MIME)[number]