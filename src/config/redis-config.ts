import { Redis, ReplyError } from 'ioredis'
import RedisError from '../errors/redis-error.js'
import { getRedisState, setRedisState } from '../utils/redis-state.js'
import { customConfigInterface } from '../types/redis.types.js'

let mainClient: Redis | null = null

const { REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD, REDIS_DB } = process.env

if (!REDIS_HOST || !REDIS_PORT) {
    console.log('>> [IORedis] Variáveis de ambiente do Redis não foram definidas')
}

// variáveis de conexão
const rdHost: string = REDIS_HOST || '127.0.0.1'
const rdPort: number = Number(REDIS_PORT) || 6380
const rdUser: string = REDIS_USERNAME || ''
const rdPassword: string = REDIS_PASSWORD || ''
const rdDatabase: number = Number(REDIS_DB) || 0

// factory de clientes redis
function createRedisConnection(customConfig: customConfigInterface): Redis {
    // configs comuns
    const baseConfig = {
        host: rdHost,
        port: rdPort,
        username: rdUser,
        password: rdPassword,
        db: rdDatabase
    }
    // reconexão
    retryStrategy: (times: number) => {
        console.log(`>> [IORedis] Tentando reconectar ... Tentativa ${times}`)
        const delay = Math.min(times * 5000, 15000) // loops de 5-15s
        return delay
    }
    // mescla configs
    const finalConfig = { ...baseConfig, ...customConfig }
    // instancia conexão
    const redis: Redis = new Redis(finalConfig)
    const connName: string = finalConfig.connectionName || 'Cliente Redis Geral'

    // listeners comuns
    redis.on('connect', () => {
        console.log(`>> [IORedis] Nova conexão bem-sucedida: ${connName}`)
    })
    redis.on('end', () => {
        console.log(`>> [IORedis] Conexão encerrada: ${connName}`)
    })
    redis.on('error', (err: RedisError) => {
        // erros de rede e infra
        switch (err.code) {
            case 'ECONNREFUSED':
                console.error(`>> [IORedis] Conexão recusada em ${connName}: ${err.code}`)
                return
            case 'ETIMEDOUT':
                console.error(`>> [IORedis] Timeout de conexão em ${connName}: ${err.code}`)
                return
            case 'ENOTFOUND':
                console.error(`>> [IORedis] DNS/Host não encontrado em ${connName}: ${err.code}`)
                return
        }
        // erros Redis
        const msg = err.message
        if (msg.includes('OOM')) {
            console.error(`>> [IORedis] Limite de memória excedido em ${connName}`)
        } else if (msg.includes('READONLY')) {
            console.error(`>> [IORedis] Instância somente para leitura em ${connName}`)
        } else {
            console.error(`>> [IORedis] Erro em ${connName}: ${msg}`)
        }
    })

    return redis
}

function startMainClient(): Redis {

    if (mainClient) return mainClient

    // cliente geral
    const client = createRedisConnection({
        connectionName: 'mainClient',
        maxRetriesPerRequest: null,
    })

    // listeners exclusivos
    client.on('connect', async () => {
        setRedisState('connect')
    })
    client.on('ready', async () => {
        setRedisState('ready')
    })
    client.on('end', async () => {
        setRedisState('end')
    })
    client.on('error', () => {
        setRedisState('wait')
    })

    mainClient = client
    return mainClient
}

function getMainClient(): Redis | null {
    return mainClient
}

export { createRedisConnection, startMainClient, getMainClient }