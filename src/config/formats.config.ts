import { MimeType } from "../types/multer.types.js"

export const allowedImageFormats = {
    jpeg: { mime: 'image/jpeg', ext: 'jpg', label: 'JPEG' },
    png: { mime: 'image/png', ext: 'png', label: 'PNG' },
    webp: { mime: 'image/webp', ext: 'webp', label: 'WEBP' },
} as const satisfies Record<string, MimeType>

export const allowedDocumentFormats = {
    pdf: { mime: 'application/pdf', ext: 'pdf' },
    doc: { mime: 'application/msword', ext: 'doc' },
    docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' },
    xls: { mime: 'application/vnd.ms-excel', ext: 'xls' },
    xlsx: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: 'xlsx' },
    txt: { mime: 'text/plain', ext: 'txt' },
    csv: { mime: 'text/csv', ext: 'csv' }
}