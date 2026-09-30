import { ImageUploadPolicy } from "../types/multer.types.js";

// constantes para tamanhos de arquivos
const KB = 1024
const MB = 1024 * KB

// cria política para Análises
const analysisImagePolicy = {
    id: 'analysis-policy',
    field: 'images',
    minFiles: 1,
    maxFiles: 4,
    maxFileBytes: 5 * MB,
    kind: 'image',
    formats: ['jpeg', 'png', 'webp'],
    maxPixels: 50_000_000,
    minShortSide: 512
} as const satisfies ImageUploadPolicy