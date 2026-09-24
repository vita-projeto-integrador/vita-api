import { Request, Response, NextFunction } from 'express'
import { AppResponse } from '../utils/app-response.js'
import HealthService from '../services/health-service.js'

class HealthController {
    public async healthCheck(req: Request, res: Response, next: NextFunction) {
        try {
            const mysql: boolean = await HealthService.checkDatabase()
            const redis: boolean = await HealthService.checkRedis()

            // resposta final
            return AppResponse.send(res, 200, 'API disponível', {
                api: 'online',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                services: {
                    mysql,
                    redis
                }
            })
        } catch (error: unknown) {
            next(error)
        }
    }
}

export default new HealthController()