import { z } from 'zod'
import { emptyToUndefined } from '../utils/indefinite.js'

const OptionalDateSchema = z.preprocess(emptyToUndefined, z.coerce.date().optional())

// parâmetros de datação (de x até y)
export const fromToSchema = z.object({
    from: OptionalDateSchema,
    to: OptionalDateSchema,
})

// regras de intervalo
export const refineFromTo = (query: { from?: Date | undefined; to?: Date | undefined }, ctx: z.RefinementCtx) => {
    const hasFrom = query.from !== undefined
    const hasTo = query.to !== undefined

    if (hasFrom !== hasTo) {
        ctx.addIssue({ code: 'custom', message: 'Envie from e to juntos', path: ['from'] })
        return // sem um dos dois, não faz sentido comparar
    }

    if (query.from && query.to && query.from > query.to) {
        ctx.addIssue({ code: 'custom', message: 'from deve ser anterior a to', path: ['from'] })
    }
}
