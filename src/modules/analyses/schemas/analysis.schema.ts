import { z } from 'zod'

// multipart envia campo vazio como ""; z.coerce.number("") vira 0
const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value)

const LatitudeSchema = z.preprocess(emptyToUndefined, z.coerce.number().min(-90).max(90).optional())
const LongitudeSchema = z.preprocess(emptyToUndefined, z.coerce.number().min(-180).max(180).optional())

const CreateAnalysisBodySchema = z
    .object({ latitude: LatitudeSchema, longitude: LongitudeSchema })
    .refine((data) => (data.latitude === undefined) === (data.longitude === undefined), {
        message: 'Envie latitude e longitude juntas',
        path: ['latitude']
    })

const AnalysisIdParamsSchema = z.object({ id: z.uuid('ID inválido') })

const ListAnalysesQuerySchema = z
    .object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(20),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional()
    })
    .refine((query) => (query.from === undefined) === (query.to === undefined), {
        message: 'Envie from e to juntos',
        path: ['from']
    })
    .refine((query) => !query.from || !query.to || query.from <= query.to, {
        message: 'from deve ser anterior a to',
        path: ['from']
    })

export { CreateAnalysisBodySchema, AnalysisIdParamsSchema, ListAnalysesQuerySchema }