import { Router } from 'express'
import { healthRoutes } from '../modules/health/health.routes.js'
import userRoutes from '../modules/users/user.routes.js'
import analysisRoutes from '../modules/analyses/analysis.routes.js'
import fileRoutes from '../modules/files/file.routes.js'
import { env } from '../shared/config/env.config.js'

const router = Router()

// registro de rotas /api/...
router.use('/health', healthRoutes)
router.use('/user', userRoutes)
router.use('/analysis', analysisRoutes)
if (env.storage.driver === 'local') {
    router.use('/files', fileRoutes)
}

export { router as appRoutes }
