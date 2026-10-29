import { z } from 'zod'
import { PERFIS } from '../../shared/database/models/enums.js'

// Regras da seção 5.1 dos requisitos. Os tamanhos máximos são os das colunas.

const nome = z.string().trim().min(3, 'Nome deve ter ao menos 3 caracteres').max(150, 'Nome deve ter no máximo 150 caracteres')

// Normalizado antes da validação: o banco guarda o e-mail em minúsculas
const email = z.string().trim().toLowerCase().max(250, 'E-mail deve ter no máximo 250 caracteres').pipe(z.email('E-mail inválido'))

// 72 bytes é o limite do bcrypt: acima disso, o restante da senha é ignorado
const senha = z
    .string()
    .min(8, 'Senha deve ter ao menos 8 caracteres')
    .refine((valor) => Buffer.byteLength(valor, 'utf8') <= 72, 'Senha deve ter no máximo 72 bytes')
    .regex(/[A-Z]/, 'Senha deve ter ao menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve ter ao menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve ter ao menos um número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve ter ao menos um caractere especial')

const apenasDigitos = (quantidade: string, campo: string) =>
    z.string().trim().regex(new RegExp(`^[0-9]{${quantidade}}$`), `${campo} deve ter ${quantidade.replace(',', ' a ')} dígitos, sem pontuação`)

const textoOpcional = (min: number, max: number, campo: string) =>
    z.string().trim().min(min, `${campo} deve ter ao menos ${min} caracteres`).max(max, `${campo} deve ter no máximo ${max} caracteres`).optional()

export const createUserSchema = z.object({
    nome,
    email,
    senha,
    telefone: apenasDigitos('10,15', 'Telefone').optional(),
    data_nascimento: z.iso.date('Data de nascimento deve estar no formato AAAA-MM-DD').optional(),
    perfil: z.enum(PERFIS, 'Perfil deve ser produtor, estudante ou outro').optional(), // ausente: o banco grava 'outro'
    endereco: textoOpcional(5, 255, 'Endereço'),
    cnpj: apenasDigitos('14', 'CNPJ').optional(),
    cpf: apenasDigitos('11', 'CPF').optional(),
    faculdade: textoOpcional(3, 150, 'Faculdade'),
    curso: textoOpcional(3, 150, 'Curso')
})

// Edição: todos os campos opcionais; senha e e-mail mudam por fluxos próprios
export const updateUserSchema = createUserSchema
    .omit({ senha: true, email: true })
    .partial()
    .refine((dados) => Object.keys(dados).length > 0, 'Informe ao menos um campo para atualizar')

export const loginSchema = z.object({
    email,
    senha: z.string().min(1, 'Informe a senha') // no login, só se a senha confere
})

export const userIdParamSchema = z.object({
    id: z.uuid('Id de usuário inválido')
})