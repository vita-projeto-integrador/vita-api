import { z } from 'zod';
import { onlyDigits } from '../../../shared/schemas/only-digits.schema.js';
import { MB } from '../../../shared/utils/units.js';
import { profilePhotoPolicy } from '../../../shared/config/multer.config.js';
import { formatToMime } from '../../../shared/config/formats.config.js';
import { USER_PROFILES } from '../../../shared/models/enums.js'

// validações para campos comuns
const NameSchema = z
    .string({
        error: 'Nome inválido'
    })
    .trim()
    .min(3, 'Nome muito pequeno')
    .max(150, 'Nome muito grande')

const EmailSchema = z
    .string({
        error: 'Endereço de e-mail inválido'
    })
    .trim()
    .toLowerCase()
    .min(1, 'E-mail muito pequeno')
    .max(100, 'E-mail muito grande')
    .pipe(z.email())

const PasswordSchema = z
    .string({
        error: 'Senha inválida'
    })
    .min(8)
    .regex(/[A-Z]/, 'Senha deve ter ao menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve ter ao menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve ter ao menos um número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve ter ao menos um caractere especial')

const AddressSchema = z
    .string()
    .min(1, "Endereço é obrigatório")
    .max(255, "Endereço muito grande")

const PhoneSchema = onlyDigits
    .min(10, 'Telefone deve ter ao menos 10 dígitos')
    .max(15, 'Telefone deve ter no máximo 15 dígitos')

const BirthDateSchema = z
    .string()
    .min(1, "Data de nascimento é obrigatória")
    .refine(val => /^\d{2}\/\d{2}\/\d{4}$/.test(val), "Formato Inválido")
    .transform(val => {
        const [dia, mes, ano] = val.split("/");
        return `${ano}-${mes}-${dia}`; // Converte para formato ISO (AAAA-MM-DD)
    })
    .pipe(
        z.string().refine(val => {
            const date = new Date(val);
            // Verifica se é uma data válida e se não é no futuro
            return !isNaN(date.getTime()) && date <= new Date();
        }, "Data inválida ou no futuro")
    )

/*  
    const CpfSchema = onlyDigits.length(11, 'CPF deve ter 11 dígitos')
*/

const CnpjSchema = onlyDigits.length(14, 'CNPJ deve ter 14 dígitos')

const ProfileSchema = z
    .enum(USER_PROFILES)

const SchoolSchema = z
    .string()
    .min(3, 'Nome da escola é muito pequeno')
    .max(100, "Nome da escola é muito grande")
    .trim()
    .or(z.literal(""))

const CourseSchema = z
    .string()
    .max(100, "Nome do curso é muito grande")
    .trim()
    .or(z.literal(""))

// usa valores da política de upload para fotos de perfil
const FileSize = profilePhotoPolicy.limits?.fileSize || (5 * MB)
const FileTypes: string[] = profilePhotoPolicy.formats.map(formatToMime) || ['image/png', 'image/jpeg', 'image/webp']

const ProfilePhotoSchema = z
    .custom<File>((val) => val instanceof File)
    .refine((file) => file.size <= FileSize, {
        message: `Tamanho máximo de 5 MB`,
    })
    .refine((file) => FileTypes.includes(file.type), {
        message: 'Apenas formatos .jpg, .jpeg, .png e .webp são aceitos',
    })

// validações para operações com usuários
const UserIdParamSchema = z.object({
    id: z.uuid('ID inválido')
});

const SignUpBodySchema = z.object({
    name: NameSchema,
    email: EmailSchema,
    password: PasswordSchema,
    phone: PhoneSchema,
    address: AddressSchema.nullable(),
    birthDate: BirthDateSchema.nullable(),
    cnpj: CnpjSchema.nullable(),
    profile: ProfileSchema.nullable(),
    school: SchoolSchema.nullable(),
    course: CourseSchema.nullable(),
    profilePhoto: ProfilePhotoSchema.nullable()
})

const LoginBodySchema = z.object({
    email: EmailSchema,
    password: PasswordSchema
})

const UpdateMeBodySchema = z.object({
    name: NameSchema,
    password: PasswordSchema,
    phone: PhoneSchema,
    address: AddressSchema.nullable(),
    birthDate: BirthDateSchema.nullable(),
    cnpj: CnpjSchema.nullable(),
    profile: ProfileSchema.nullable(),
    school: SchoolSchema.nullable(),
    course: CourseSchema.nullable(),
    profilePhoto: ProfilePhotoSchema.nullable()
}).refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
});

export { SignUpBodySchema, LoginBodySchema, UpdateMeBodySchema, UserIdParamSchema }