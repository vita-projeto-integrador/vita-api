import { z } from 'zod'
import { onlyDigits } from '../../../shared/schemas/only-digits.schema.js'
import { USER_PROFILES } from '../../../shared/models/enums.js'
import { optionalField, clearableField } from '../../../shared/schemas/optional-field.schema.js'

/*
======================================
    Validações para campos comuns
======================================
*/
const NameSchema = z
    .string({
        error: 'Nome inválido',
    })
    .trim()
    .min(3, 'Nome muito pequeno')
    .max(150, 'Nome muito grande')

const EmailSchema = z
    .string({
        error: 'Endereço de e-mail inválido',
    })
    .trim()
    .toLowerCase()
    .min(1, 'E-mail muito pequeno')
    .max(100, 'E-mail muito grande')
    .pipe(z.email())

const PasswordSchema = z
    .string({
        error: 'Senha inválida',
    })
    .min(8, 'Senha deve ter ao menos 8 caracteres')
    .refine((val) => Buffer.byteLength(val) <= 72, 'Senha muito grande')
    .regex(/[A-Z]/, 'Senha deve ter ao menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve ter ao menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve ter ao menos um número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve ter ao menos um caractere especial')

const AddressSchema = z.string().trim().min(1, 'Endereço é obrigatório').max(255, 'Endereço muito grande')

const PhoneSchema = onlyDigits
    .min(10, 'Telefone deve ter ao menos 10 dígitos')
    .max(15, 'Telefone deve ter no máximo 15 dígitos')

const BirthDateSchema = z.iso
    .date('Data de nascimento inválida (use AAAA-MM-DD)')
    .refine((val) => new Date(val) <= new Date(), 'Data de nascimento no futuro')

/*  
    const CpfSchema = onlyDigits.length(11, 'CPF deve ter 11 dígitos')
*/

const CnpjSchema = onlyDigits.length(14, 'CNPJ deve ter 14 dígitos')

const ProfileSchema = z.enum(USER_PROFILES)

const SchoolSchema = z
    .string()
    .trim()
    .min(3, 'Nome da escola é muito pequeno')
    .max(100, 'Nome da escola é muito grande')

const CourseSchema = z.string().trim().max(100, 'Nome do curso é muito grande')

/*
======================================
    Validações para operações
======================================
*/
const UserIdParamSchema = z.uuid('ID inválido')

const SignUpBodySchema = z.object({
    nome: NameSchema,
    email: EmailSchema,
    senha: PasswordSchema,
    telefone: optionalField(PhoneSchema),
    endereco: optionalField(AddressSchema),
    data_nascimento: optionalField(BirthDateSchema),
    cnpj: optionalField(CnpjSchema),
    perfil: ProfileSchema.optional(),
    faculdade: optionalField(SchoolSchema),
    curso: optionalField(CourseSchema),
})

const LoginBodySchema = z.object({
    email: EmailSchema,
    senha: z.string({ error: 'Senha inválida' }).min(1, 'Senha é obrigatória'),
})

const UpdateMeBodySchema = z
    .object({
        nome: NameSchema,
        senha: PasswordSchema,
        telefone: clearableField(PhoneSchema),
        endereco: clearableField(AddressSchema),
        data_nascimento: clearableField(BirthDateSchema),
        cnpj: clearableField(CnpjSchema),
        perfil: ProfileSchema.optional(),
        faculdade: clearableField(SchoolSchema),
        curso: clearableField(CourseSchema),
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'Informe ao menos um campo para atualizar',
    })

export { SignUpBodySchema, LoginBodySchema, UpdateMeBodySchema, UserIdParamSchema }
