import { z } from 'zod';

export const optionalText = (min: number, max: number, campo: string) =>
    z.string().trim().min(min, `${campo} deve ter ao menos ${min} caracteres`).max(max, `${campo} deve ter no máximo ${max} caracteres`).optional()