import { z } from 'zod';
import { onlyDigits } from '../../../shared/schemas/only-digits.schema.js';

// validações para campos comuns
const NomeSchema = z
    .string({
        error: 'Nome inválido'
    })
    .trim()
    .min(3)
    .max(150)

const EmailSchema = z
    .string({
        error: 'Endereço de e-mail inválido'
    })
    .trim()
    .toLowerCase()
    .max(250)
    .pipe(z.email())

const SenhaSchema = z
    .string({
        error: 'Senha inválida'
    })
    .min(8)
    .regex(/[A-Z]/, 'Senha deve ter ao menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve ter ao menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve ter ao menos um número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve ter ao menos um caractere especial')

// validações para operações com usuários
const CreateUserSchema = z.object({
    nome: NomeSchema,
    email: EmailSchema,
    senha: SenhaSchema,
    telefone: onlyDigits.min(10).max(15).optional(),
    data_nascimento: z.coerce.date({
        error: 'Data de nascimento inválida'
    }).max(new Date(), 'Data de nascimento não pode ser no futuro'),
    
})

export { CreateUserSchema }