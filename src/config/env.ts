import { z } from 'zod';
import path from 'node:path';
import { deepFreeze } from '../utils/deep-freeze.js';
import { MB, HOUR } from '../utils/units.js';
import { emptyToUndefined } from '../utils/indefinite.js';

const vars = process.env;

const DatabaseEnvironmentSchema = z.object({
    DB_NAME: z.string().min(1),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(4),
    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().positive().max(65535).default(5432),
    DB_DIALECT: z.literal('postgres'),
    DB_SSL: z.stringbool().default(false),
    DB_SSL_CA: z.string().optional(),
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

const CORSEnvironmentSchema = z.object({
    URL_WEB: z.url()
})

const StorageEnvironmentSchema = z.object({
    STORAGE_DRIVER: z.enum(['local']).default('local'),
    STORAGE_ROOT: z.string().min(1).transform(
        (value) => path.resolve(value),
    ),
    STORAGE_MAX_UPLOAD_MB: z.coerce.number().positive().max(15).default(10),
    STORAGE_TMP_TTL_HOURS: z.coerce.number().positive().max(72).default(24),
    STORAGE_ORIGINAL_RETENTION_DAYS: z.coerce.number().int().positive().max(3650).optional(),
    STORAGE_PURGE_DELETED_AFTER_DAYS: z.coerce.number().int().positive().max(3650).optional(),
})

// transforma variáveis de ambiente vazias em undefined para zod tratar
const normalizeEnv = (env: NodeJS.ProcessEnv) =>
    Object.fromEntries(
        Object.entries(env).map(([key, value]) => [
            key,
            emptyToUndefined(value),
        ]),
    )

// agrega todas as validações
const RawEnvSchema = z.object({
    ...NodeEnvironmentSchema.shape,
    ...DatabaseEnvironmentSchema.shape,
    ...RedisEnvironmentSchema.shape,
    ...JWTEnvironmentSchema.shape,
    ...CORSEnvironmentSchema.shape,
    ...StorageEnvironmentSchema.shape
})

// divide validações por tipo
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
        webUrl: e.URL_WEB
    },
    storage: {
        driver: e.STORAGE_DRIVER,
        root: e.STORAGE_ROOT,
        maxUploadBytes: e.STORAGE_MAX_UPLOAD_MB * MB,
        tmpTtlMs: e.STORAGE_TMP_TTL_HOURS * HOUR,
        originalRetentionDays: e.STORAGE_ORIGINAL_RETENTION_DAYS,
        purgeDeletedAfterDays: e.STORAGE_PURGE_DELETED_AFTER_DAYS,
    },
}))

// executa todas as validações agregando todos os erros
const result = EnvSchema.safeParse(normalizeEnv(vars))

if (!result.success) {
    throw new Error(`Variáveis de ambiente inválidas:\n${z.prettifyError(result.error)}`)
}

// congela (readonly) todos os campos do objeto final
export const env = deepFreeze(result.data)
export type Env = typeof env

