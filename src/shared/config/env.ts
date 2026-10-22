import { z } from 'zod';
import path from 'node:path';
import { deepFreeze } from '../utils/deep-freeze.js';
import { HOUR } from '../utils/units.js';
import { emptyToUndefined } from '../utils/indefinite.js';
import fs from 'node:fs'

// variáveis de ambiente originais
const vars = process.env;

/*
    Schemas de validação
*/

// caminho do arquivo da CA; o env expõe o conteúdo já lido
const sslCaSchema = z
    .string()
    .transform((value, ctx) => {
        const caPath = path.resolve(value)
        try {
            const content = fs.readFileSync(caPath, 'utf8')
            if (content.trim() === '') {
                ctx.issues.push({
                    code: 'custom',
                    message: `Arquivo de CA vazio: ${caPath}`,
                    input: value,
                })
                return z.NEVER
            }
            return content
        } catch {
            ctx.issues.push({
                code: 'custom',
                message: `Arquivo de CA não encontrado: ${caPath}`,
                input: value,
            })
            return z.NEVER
        }
    })
    .optional()

const DatabaseEnvironmentSchema = z.object({
    DB_NAME: z.string().min(1),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(4),
    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().positive().max(65535).default(5432),
    DB_DIALECT: z.literal('postgres'),
    DB_SSL: z.stringbool().default(false),
    DB_SSL_CA: sslCaSchema,
})

const RedisEnvironmentSchema = z.object({
    REDIS_HOST: z.string().min(1),
    REDIS_PORT: z.coerce.number().int().positive().max(65535).default(6379),
    REDIS_USERNAME: z.string().min(1).optional(),
    REDIS_PASSWORD: z.string().min(4).optional(),
    REDIS_DB: z.coerce.number().int().min(0).max(15).optional(),
})

const NodeEnvironmentSchema = z.object({
    PORT: z.coerce.number().int().positive().max(65535).default(8080),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

const JWTEnvironmentSchema = z.object({
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().regex(/^\d+(s|m|h|d|w)$/, 'JWT_EXPIRES_IN inválido').default('1h'),
})

// normaliza origem HTTP(S)
// ex.: "http://localhost:3000/" -> "http://localhost:3000"
const originSchema = z
    .url({ protocol: /^https?$/ })
    .transform((value) => new URL(value).origin)

const CORSEnvironmentSchema = z.object({
    URL_WEB: originSchema,
    URL_EXPO: originSchema.optional()
})

const StorageEnvironmentSchema = z.object({
    STORAGE_DRIVER: z.enum(['local']).default('local'),
    STORAGE_ROOT: z.string().min(1).transform(
        (value) => path.resolve(value),
    ),
    STORAGE_TMP_TTL_HOURS: z.coerce.number().positive().max(72).default(24),
})

// helper - transforma variáveis vazias em undefined para zod tratar
const normalizeEnv = (env: NodeJS.ProcessEnv) =>
    Object.fromEntries(
        Object.entries(env).map(([key, value]) => [
            key,
            emptyToUndefined(value),
        ]),
    )

// helper - agrega todas as validações zod 
const RawEnvSchema = z.object({
    ...NodeEnvironmentSchema.shape,
    ...DatabaseEnvironmentSchema.shape,
    ...RedisEnvironmentSchema.shape,
    ...JWTEnvironmentSchema.shape,
    ...CORSEnvironmentSchema.shape,
    ...StorageEnvironmentSchema.shape
}).superRefine((e, ctx) => {
    if (e.DB_SSL_CA && !e.DB_SSL) {
        ctx.addIssue({
            code: 'custom',
            path: ['DB_SSL_CA'],
            message: 'DB_SSL_CA informado com DB_SSL=false: o certificado seria ignorado',
        })
    }
})

// helper - valida variáveis e classifica por tipo
const EnvSchema = RawEnvSchema.transform(e => ({
    app: {
        port: e.PORT,
        nodeEnv: e.NODE_ENV
    },
    db: {
        name: e.DB_NAME,
        user: e.DB_USER,
        password: e.DB_PASSWORD,
        host: e.DB_HOST,
        port: e.DB_PORT,
        dialect: e.DB_DIALECT,
        ssl: e.DB_SSL,
        sslCa: e.DB_SSL_CA,
    },
    redis: {
        host: e.REDIS_HOST,
        port: e.REDIS_PORT,
        user: e.REDIS_USERNAME,
        password: e.REDIS_PASSWORD,
        db: e.REDIS_DB
    },
    auth: {
        secret: e.JWT_SECRET,
        expiresIn: e.JWT_EXPIRES_IN
    },
    cors: {
        webUrl: e.URL_WEB,
        expoUrl: e.URL_EXPO
    },
    storage: {
        driver: e.STORAGE_DRIVER,
        root: e.STORAGE_ROOT,
        tmpTtlMs: e.STORAGE_TMP_TTL_HOURS * HOUR,
    },
}))

const result = EnvSchema.safeParse(normalizeEnv(vars))

if (!result.success) {
    throw new Error(`Variáveis de ambiente inválidas:\n${z.prettifyError(result.error)}`)
}

// helper - congela (readonly) todos os campos do objeto final
export const env = deepFreeze(result.data)
export type Env = typeof env

