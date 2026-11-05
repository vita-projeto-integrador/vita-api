import { Redis } from 'ioredis'
import { createRedisConnection } from '../config/redis.config.js'
import { setRedisState } from '../utils/redis-state.js'

let mainClient: Redis | null = null

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

export { startMainClient, getMainClient }