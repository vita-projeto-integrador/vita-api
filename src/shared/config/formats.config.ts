import type { MimeType } from "../types/multer.types.js"

export const allowedImageFormats = {
    jpeg: { mime: 'image/jpeg', ext: 'jpg', label: 'JPEG' },
    png: { mime: 'image/png', ext: 'png', label: 'PNG' },
    webp: { mime: 'image/webp', ext: 'webp', label: 'WEBP' },
} as const satisfies Record<string, MimeType>

export const allowedDocumentFormats = {
    pdf: { mime: 'application/pdf', ext: 'pdf', label: 'PDF' },
    doc: { mime: 'application/msword', ext: 'doc', label: 'DOC' },
    docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx', label: 'DOCX' },
    xls: { mime: 'application/vnd.ms-excel', ext: 'xls', label: 'PDF' },
    xlsx: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: 'xlsx', label: 'XLSX' },
    txt: { mime: 'text/plain', ext: 'txt', label: 'TXT' },
    csv: { mime: 'text/csv', ext: 'csv', label: 'CSV' }
}