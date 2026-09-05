import { Request, Response, NextFunction } from 'express'
import { AppResponse } from '../utils/app-response.js'
import HealthService from '../services/health-service.js'

class HealthController {
    public async healthCheck(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await HealthService.healthCheck()
            return AppResponse.send(res, 200, 'API disponível', data)
        } catch (error: unknown) {
            next(error)
        }
    }
}

export default new HealthController()