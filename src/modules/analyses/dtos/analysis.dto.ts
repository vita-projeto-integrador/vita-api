import z from 'zod'
import {
    CreateAnalysisBodySchema,
    AnalysisIdParamsSchema,
    ListAnalysesQuerySchema
} from '../schemas/analysis.schema.js'

export type CreateAnalysisBodyDTO = z.infer<typeof CreateAnalysisBodySchema>
export type AnalysisIdParamsDTO = z.infer<typeof AnalysisIdParamsSchema>
export type ListAnalysesQueryDTO = z.infer<typeof ListAnalysesQuerySchema>