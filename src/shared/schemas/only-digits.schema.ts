import { z } from 'zod';

// valida se uma entrada possui apenas dígitos numéricos
export const onlyDigits = z.
    string()
    .trim()
    .regex(/^\d+$/, {
        message: "A entrada deve conter apenas dígitos (0-9)"
    })