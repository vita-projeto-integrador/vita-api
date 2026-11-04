import { z } from 'zod'
import { emptyToUndefined } from '../../../shared/utils/indefinite.js'
import { fromToSchema, refineFromTo } from '../../../shared/schemas/from-to.schema.js'
import { paginationSchema } from '../../../shared/schemas/pagination.schema.js'
import { ANALYSIS_STATUSES, CLASSIFICATION_CLASSES } from '../../../shared/models/enums.js'

/*
======================================
    Validações para campos comuns
======================================
*/

const StatusSchema = z
    .string()
    .transform((value) => value.split(','))
    .pipe(z.array(z.enum(ANALYSIS_STATUSES)))
    .optional()

const ClassSchema = z.enum(CLASSIFICATION_CLASSES).optional()

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

const ListAnalysesQuerySchema = paginationSchema
    .extend(fromToSchema.shape)
    .superRefine(refineFromTo)

const MapQuerySchema = fromToSchema
    .extend({
        status: StatusSchema,
        classe: ClassSchema
    })
    .superRefine(refineFromTo)

export { CreateAnalysisBodySchema, AnalysisIdParamsSchema, ListAnalysesQuerySchema, MapQuerySchema }