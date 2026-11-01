import { Router } from 'express'
import { healthRoutes } from "../modules/health/health.routes.js"
import userRoutes from '../modules/users/user.routes.js'
import analysisRoutes from '../modules/analyses/analysis.routes.js'

const router = Router()

// registro de rotas /api/...
router.use('/health', healthRoutes)
router.use('/user', userRoutes)
router.use('/analysis', analysisRoutes)

export { router as appRoutes }