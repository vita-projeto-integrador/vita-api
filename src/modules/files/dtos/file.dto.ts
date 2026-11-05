import type { z } from 'zod'
import type { FileKeyParamsSchema, SignedUrlQuerySchema } from '../schemas/file.schema.js'

/*
======================================
    Tipagens para entradas do módulo de arquivos
======================================
*/

export type FileKeyParamsDTO = z.infer<typeof FileKeyParamsSchema>

export type SignedUrlQueryDTO = z.infer<typeof SignedUrlQuerySchema>