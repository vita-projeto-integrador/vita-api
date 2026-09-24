import connection from "../config/sequelize-config.js"
import { getMainClient } from "../database/init-redis.js"
import { withTimeout } from "../utils/with-timeout.js"
import { getDbErrorMessage } from "../errors/map-db-error.js"

class HealthService {
    public async checkDatabase(): Promise<boolean> {
        try {
            await withTimeout(connection.authenticate(), 2000)
            return true
        } catch (error) {
            console.error(`>> [MySQL] ${getDbErrorMessage(error)}`)
            return false
        }
    }
    public async checkRedis(): Promise<boolean> {
        try {
            const mainClient = getMainClient()

            // cliente geral não existe ainda
            if (!mainClient) return false

            // cliente geral não conectado
            if (mainClient?.status !== 'ready') return false
            
            // confirma com comando PING
            const reply = await withTimeout(mainClient.ping(), 1000) // evita PING pendurado por config padrão do IORedis
            return reply === 'PONG'
        } catch (error: unknown) {
            console.error(`[Redis] Erro inesperado ao conectar Redis: ${error}`)
            return false
        }
    }
}

export default new HealthService()