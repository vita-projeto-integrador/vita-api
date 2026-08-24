import AppError from '../utils/appError.js'
import { getRedisState } from '../config/redisState.js'

class HealthService {
    async test() {
        try {
            // captura estado do serviço Redis
            const redisAlive = getRedisState()
            // retorna dados informacionais do servidor
            return {
                api: 'up',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                services: {
                    database: 'up',
                    redis: redisAlive ? 'up' : 'degraded'
                }
            }
        } catch (error) {
            throw new AppError('Erro ao testar saúde da API', 500)
        }
    }
}

export default new HealthService()