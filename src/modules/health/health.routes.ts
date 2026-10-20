import { Router } from 'express'
import HealthController from './health.controller.js'

const router = Router()

router.get('/', HealthController.healthCheck)

export { router as healthRoutes }