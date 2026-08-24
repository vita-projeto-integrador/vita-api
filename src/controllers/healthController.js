import healthService from "../services/healthService.js"
import APIResponse from "../utils/apiResponse.js"
import AppError from "../utils/appError.js"

class HealthController {
    async healthCheck(req, res, next) {
        try {
            const result = await healthService.test()

            if (!result) {
                throw new AppError('API indisponível', 503)
            }
            else if(result.services.redis == 'degraded'){
                return new APIResponse(res, 'API operacional, processamento de imagens temporariamente indisponível', 503, result)
            }
            else {
                return new APIResponse(res, 'API disponível', 200, result)
            }
            
        } catch (error) {
            next(error)
        }
    }
}

export default new HealthController()