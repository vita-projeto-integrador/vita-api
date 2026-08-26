import { Request, Response, NextFunction } from 'express'
import HealthService from '../services/health-service.js'

class HealthController {
    public async healthCheck(req: Request, res: Response): Promise<Response> {
        try {
            const data = await HealthService.healthCheck()
            return res.status(200).json({success: true, message: "API disponível", data})
        } catch (error: any) {
            console.error(error)
            return res.status(500).json({success: false, message: "API indisponível"})
        }
    }
}

export default new HealthController()