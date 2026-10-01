import { imageFormats } from "../config/formats.config.js"

export interface MimeTypes {
    mime: string,
    ext: string,
    label: string
}

export interface MimeTypesList {
    [name: string]: MimeTypes
}

// tipo base para políticas
export interface BaseUploadPolicy {
    readonly id: string,
    readonly field: string,
    readonly minFiles: number,
    readonly maxFiles: number,
    readonly maxFileBytes: number,
    readonly text: {
        readonly maxFields: number
        readonly maxFieldsBytes: number
    }
}

// tipo para políticas de imagens
export interface ImagePolicy extends BaseUploadPolicy {
    readonly kind: 'image'
    readonly formats: readonly imageFormats[]
    readonly image: {
        readonly maxPixels: number
        readonly minShortSide: number
    }
}

// expõe tipo mais abrangente para referência
export type UploadPolicy = ImagePolicy

// arquivos recebidos na requisição
export interface IncomingFile {
    readonly buffer: Buffer,
    readonly clientFileName: string, // não confiável
    readonly declaredMime: string, // não confiável
    readonly size: number
}

export interface MulterErrorJSON {
    success: boolean,
    message: string,

}