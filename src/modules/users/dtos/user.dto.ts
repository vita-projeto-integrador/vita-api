import type { z } from 'zod';
import type {
    SignUpBodySchema,
    LoginBodySchema,
    UpdateMeBodySchema,
    UserIdParamSchema
} from '../schemas/user.schema.js';

// tipagens das entradas do módulo de usuários inferidas dos schemas de validação zod

export type SignUpBodyDTO = z.infer<typeof SignUpBodySchema>;

export type LoginBodyDTO = z.infer<typeof LoginBodySchema>;

export type UserIdParamsDTO = z.infer<typeof UserIdParamSchema>;

export type UpdateMeBodyDTO = z.infer<typeof UpdateMeBodySchema>;