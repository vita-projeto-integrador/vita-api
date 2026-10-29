import { env } from '../config/env.config.js'

// trava para scripts destrutivos: só rodam em banco local
const HOSTS_LOCAIS = ['localhost', '127.0.0.1', 'db', 'postgres']

export function guardLocalDatabase(): void {
    const { db, app } = env

    if (app.nodeEnv === 'production') {
        throw new Error('Script destrutivo bloqueado: ambiente de produção')
    }

    if (!HOSTS_LOCAIS.includes(db.host)) {
        throw new Error(`Script destrutivo bloqueado: DB_HOST "${db.host}" não é local`)
    }
}