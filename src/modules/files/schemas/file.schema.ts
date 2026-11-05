import { z } from 'zod'

/*
======================================
    Validações para operações
======================================
*/

// Express 5: o curinga '*key' chega como array de segmentos -> volta a ser a key
const FileKeyParamsSchema = z.object({
    key: z
        .array(z.string())
        .min(1)
        .transform((segments) => segments.join('/'))
})

// parâmetros da URL assinada (transporte: inglês, snake_case)
const SignedUrlQuerySchema = z.object({
    expires: z.coerce.number({ error: 'Parâmetro expires inválido' }).int().positive(),
    signature: z.string({ error: 'Parâmetro signature inválido' }).min(1).max(128)
})

export { FileKeyParamsSchema, SignedUrlQuerySchema }