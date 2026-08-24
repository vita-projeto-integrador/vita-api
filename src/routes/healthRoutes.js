import express from 'express'
import healthController from '../controllers/healthController.js'
import Authorization from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/health', /*Authorization,*/ healthController.healthCheck)

export default router

