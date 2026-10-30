import { ALL } from "node:dns"
import type { MimeType } from "../types/multer.types.js"

export const IMAGE_FORMATS = ['jpeg', 'png', 'webp'] as const
export type ImageFormat = (typeof IMAGE_FORMATS)[number]

export const DOCUMENT_FORMATS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'] as const
export type DocumentFormat = (typeof DOCUMENT_FORMATS)[number]

// formatos permitidos para arquivos de imagem
export const allowedImageFormats = {
    jpeg: { mime: 'image/jpeg', ext: 'jpg', label: 'JPEG' },
    png: { mime: 'image/png', ext: 'png', label: 'PNG' },
    webp: { mime: 'image/webp', ext: 'webp', label: 'WEBP' },
} as const satisfies Record<ImageFormat, MimeType>

// formatos permitidos para arquivos de documentos
export const allowedDocumentFormats = {
    pdf: { mime: 'application/pdf', ext: 'pdf', label: 'PDF' },
    doc: { mime: 'application/msword', ext: 'doc', label: 'DOC' },
    docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx', label: 'DOCX' },
    xls: { mime: 'application/vnd.ms-excel', ext: 'xls', label: 'PDF' },
    xlsx: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: 'xlsx', label: 'XLSX' },
    txt: { mime: 'text/plain', ext: 'txt', label: 'TXT' },
    csv: { mime: 'text/csv', ext: 'csv', label: 'CSV' }
} as const satisfies Record<DocumentFormat, MimeType>

// conversor: formato -> mime type
export function formatToMime(format: ImageFormat): ImageMimeType {
    return allowedImageFormats[format].mime
}

// conversor: mime type -> format
export function mimeToFormat(mime: string): ImageFormat | undefined {
    const entry = Object.entries(allowedImageFormats).find(
        ([, value]) => value.mime === mime
    )

    return entry ? (entry[0] as ImageFormat) : undefined
}

export const ALL_FILE_FORMATS = [...IMAGE_FORMATS, ...DOCUMENT_FORMATS]
export type FileFormat = (typeof ALL_FILE_FORMATS)[number]

// mime-types originais usados no middleware de upload
export type ImageMimeType = (typeof allowedImageFormats)[ImageFormat]['mime']
export type DocumentMimeType = (typeof allowedDocumentFormats)[DocumentFormat]['mime']