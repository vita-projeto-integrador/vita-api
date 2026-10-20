import { Router } from 'express'
import { healthRoutes } from "../modules/health/health.routes.js"

const router = Router()

// registro de rotas /api/...
router.use('/health', healthRoutes)

export { router as appRoutes }