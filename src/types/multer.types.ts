import type { Options } from 'multer'
import type { allowedImageFormats, allowedDocumentFormats } from "../config/formats.config.js"

export interface MimeType {
    mime: string,
    ext: string,
    label: string
}

export type MimeTypesList = Record<string, MimeType>

export type ImageFormat = keyof typeof allowedImageFormats
export type DocumentFormats = keyof typeof allowedDocumentFormats

export interface UploadPolicyConfig {
    name: string,
    field: string,
    formats: ImageFormat[],
    limits: Options['limits'],
}