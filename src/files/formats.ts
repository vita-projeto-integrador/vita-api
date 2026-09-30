// formatos de imagens válidas
const IMAGE_FORMATS = {
    jpeg: { mime: 'image/jpeg', ext: 'jpg' },
    png: { mime: 'image/png', ext: 'png' },
    webp: { mime: 'image/webp', ext: 'webp' }
}

// formatos de documentos válidos
const DOCUMENT_FORMATS = {
    pdf: {
        mime: 'application/pdf',
        ext: 'pdf'
    },
    doc: {
        mime: 'application/msword',
        ext: 'doc'
    },
    docx: {
        mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ext: 'docx'
    },
    xls: {
        mime: 'application/vnd.ms-excel',
        ext: 'xls'
    },
    xlsx: {
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ext: 'xlsx'
    },
    txt: {
        mime: 'text/plain',
        ext: 'txt'
    },
    csv: {
        mime: 'text/csv',
        ext: 'csv'
    }
}

export type ImageFormat = keyof typeof IMAGE_FORMATS
export type DocumentFormat = keyof typeof DOCUMENT_FORMATS 