import z from 'zod'
import {
    CreateAnalysisBodySchema,
    AnalysisIdParamsSchema,
    ListAnalysesQuerySchema,
    MapQuerySchema,
} from '../schemas/analysis.schema.js'

/*
======================================
    Tipagens para entradas do módulo de análises
======================================
*/

export type CreateAnalysisBodyDTO = z.infer<typeof CreateAnalysisBodySchema>

export type AnalysisIdParamsDTO = z.infer<typeof AnalysisIdParamsSchema>

export type ListAnalysesQueryDTO = z.infer<typeof ListAnalysesQuerySchema>

export type MapQueryDTO = z.infer<typeof MapQuerySchema>

export type MetadadoDTO = NonNullable<CreateAnalysisBodyDTO['metadata']>[number]
