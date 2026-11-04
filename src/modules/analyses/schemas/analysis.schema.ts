import { z } from 'zod'
import { emptyToUndefined } from '../../../shared/utils/indefinite.js'
import { ANALYSIS_STATUSES, CLASSIFICATION_CLASSES } from '../../../shared/models/enums.js'

/*
======================================
    Validações para campos comuns
======================================
*/
// localização de uma foto (GPS)
const LocationSchema = z
    .object({
        latitude: z
            .number()
            .min(-90)
            .max(90),
        longitude: z
            .number()
            .min(-180)
            .max(180),
        // raio de erro em metros
        precisao: z.
            number().
            nonnegative()
    })

// metadados
const MetaSchema = z
    .object({
        capturadaEm: z
            .iso.datetime({ offset: true }).nullable(), // null na galeria
        localizacao: LocationSchema.nullable() // null na galeria ou sem GPS
    })

// metadados em JSON (chega como texto no multipart)
const MetadataSchema = z.preprocess(
    emptyToUndefined,
    z
        .string()
        .transform((texto, ctx) => {
            try {
                return JSON.parse(texto)
            } catch {
                ctx.issues.push({ code: 'custom', message: 'metadados não é um JSON válido', input: texto })
                return z.NEVER
            }
        })
        .pipe(z.array(MetaSchema).min(1).max(4))
        .optional()
)

/*
======================================
    Validações para operações
======================================
*/
const CreateAnalysisBodySchema = z.object({ metadados: MetadataSchema })

const AnalysisIdParamsSchema = z.uuid('ID inválido')

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

const MapQuerySchema = z
    .object({
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
        // "em_espera,processando" -> ['em_espera', 'processando']
        status: z
            .string()
            .transform((value) => value.split(','))
            .pipe(z.array(z.enum(ANALYSIS_STATUSES)))
            .optional(),
        classe: z.enum(CLASSIFICATION_CLASSES).optional()
    })
    .refine((query) => (query.from === undefined) === (query.to === undefined), {
        message: 'Envie from e to juntos',
        path: ['from']
    })
    .refine((query) => !query.from || !query.to || query.from <= query.to, {
        message: 'from deve ser anterior a to',
        path: ['from']
    })

export { CreateAnalysisBodySchema, AnalysisIdParamsSchema, ListAnalysesQuerySchema, MapQuerySchema }