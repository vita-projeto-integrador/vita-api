import { Router } from 'express'
import { healthRoutes } from "./health-routes.js"

const router = Router()

// registro de rotas /api/...
router.use('/health', healthRoutes)

export { router as appRoutes }