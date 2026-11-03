import { AppResponse } from '../utils/app-response.js';
import HealthService from '../services/health-service.js';
class HealthController {
    async healthCheck(req, res, next) {
        try {
            const mysql = await HealthService.checkDatabase();
            const redis = await HealthService.checkRedis();
            // resposta final
            return AppResponse.send(res, 200, 'API disponível', {
                api: 'online',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                services: {
                    mysql,
                    redis
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
export default new HealthController();
