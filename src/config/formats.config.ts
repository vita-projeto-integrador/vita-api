import type { MimeTypesList } from "../types/multer.types.js"

const allowedImageFormats: MimeTypesList = {
    jpeg: { mime: 'image/jpeg', ext: 'jpg', label: 'JPEG' },
    png: { mime: 'image/png', ext: 'png' },
    webp: { mime: 'image/webp', ext: 'webp' },
}

const allowedDocumentFormats = {
    pdf: { mime: 'application/pdf', ext: 'pdf' },
    doc: { mime: 'application/msword', ext: 'doc' },
    docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' },
    xls: { mime: 'application/vnd.ms-excel', ext: 'xls' },
    xlsx: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: 'xlsx' },
    txt: { mime: 'text/plain', ext: 'txt' },
    csv: { mime: 'text/csv', ext: 'csv' }
}

export type imageFormats = keyof typeof allowedImageFormats
export type documentFormats = keyof typeof allowedDocumentFormats