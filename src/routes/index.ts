import { Router } from 'express'
import { healthRoutes } from "../modules/health/health.routes.js"
import userRoutes from '../modules/users/user.routes.js'

const router = Router()

// registro de rotas /api/...
router.use('/health', healthRoutes)
router.use('/user', userRoutes)

export { router as appRoutes }