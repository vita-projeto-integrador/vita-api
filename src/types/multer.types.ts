import { allowedImageFormats, allowedDocumentFormats } from "../config/formats.config.js"
import { Options } from 'multer'

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