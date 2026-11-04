import { z } from 'zod'
import { ANALYSIS_STATUSES, CLASSIFICATION_CLASSES } from '../../../shared/models/enums.js'

// multipart envia campo vazio como ""; tratamos como campo ausente
const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value)

// localização de uma foto (vinda do GPS do celular)
const LocalizacaoSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    precisao: z.number().nonnegative() // raio de erro em metros
})

// dados de uma foto, na mesma posição do arquivo em 'images'
const MetadadoSchema = z.object({
    capturadaEm: z.iso.datetime({ offset: true }).nullable(), // null na galeria
    localizacao: LocalizacaoSchema.nullable() // null na galeria ou sem GPS
})

// 'metadados' chega como texto no multipart: vira JSON e depois é validado
const MetadadosSchema = z.preprocess(
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
        .pipe(z.array(MetadadoSchema).min(1).max(4))
        .optional()
)

const CreateAnalysisBodySchema = z.object({ metadados: MetadadosSchema })

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

// filtros da rota do mapa (todos opcionais)
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