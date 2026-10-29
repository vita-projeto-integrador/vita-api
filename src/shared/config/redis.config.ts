import { Redis } from 'ioredis'
import RedisError from '../errors/redis-error.js'
// import { getRedisState, setRedisState } from '../utils/redis-state.js'
import { customConfigInterface } from '../types/redis.types.js'
import { env } from './env.config.js'

const { redis } = env

// factory de clientes redis
function createRedisConnection(customConfig: customConfigInterface): Redis {
    // configs comuns
    const baseConfig = {
        host: redis.host,
        port: redis.port,
        username: redis.user,
        password: redis.password,
        db: redis.db,
        // reconexão
        retryStrategy: (times: number) => {
            console.log(`>> [IORedis] Tentando reconectar ... Tentativa ${times}`)
            const delay = Math.min(times * 5000, 15000) // loops de 5-15s
            return delay
        }
    }
    // mescla configs
    const finalConfig = { ...baseConfig, ...customConfig }
    // instancia conexão
    const redisConn: Redis = new Redis(finalConfig)
    const connName: string = finalConfig.connectionName || 'Cliente Redis Geral'

    // listeners comuns
    redisConn.on('connect', () => {
        console.log(`>> [IORedis] Nova conexão bem-sucedida: ${connName}`)
    })
    redisConn.on('end', () => {
        console.log(`>> [IORedis] Conexão encerrada: ${connName}`)
    })
    redisConn.on('error', (err: RedisError) => {
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

    return redisConn
}

export { createRedisConnection }