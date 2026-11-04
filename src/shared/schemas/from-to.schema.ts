import { z } from 'zod';

// parâmetros de datação (de x até y)
export const fromToSchema = z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional()
});