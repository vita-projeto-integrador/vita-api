import connection from "../config/sequelize-config.js"
import { getRedisState } from "../utils/redis-state.js"
import { getMainClient } from "../config/redis-config.js"
import { withTimeout } from "../utils/with-timeout.js"
import AppError from "../errors/app-error.js"

class HealthService {
    public async checkDatabase(): Promise<Boolean> {
        try {
            await connection.authenticate()
            return true
        } catch (error) {
            console.error(error)
            return false
        }
    }
    public async checkRedis(): Promise<Boolean> {
        try {
            const redisStatus = getRedisState()
            const mainClient = getMainClient()

            // casos do cliente geral não existir ou não estiver conectado
            if(redisStatus !== 'ready') return false
            if(!mainClient) return false

            // confirma estado com comando PING
            const reply = await withTimeout(mainClient.ping(), 1000) // evita PING pendurado por config padrão do IORedis
            return reply === 'PONG'
        } catch (error) {
            console.error(error)
            return false
        }
    }
}

export default new HealthService()