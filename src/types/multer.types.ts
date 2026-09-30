import { ImageFormat, DocumentFormat } from "../files/formats.js"

// tipo base para políticas de upload
export interface BaseUploadPolicy {
    id: string,
    field: string,
    minFiles: number,
    maxFiles: number,
    maxFileBytes: number,
}

// tipo para políticas de imagens
export interface ImageUploadPolicy extends BaseUploadPolicy {
    kind: 'image',
    formats: readonly ImageFormat[],
    maxPixels: number,
    minShortSide: number
}