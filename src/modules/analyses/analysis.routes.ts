import express from 'express'
import AnalysisController from './analysis.controller.js'
import { authenticate } from '../../shared/middlewares/auth.middleware.js'
import { createMulterHandler } from '../../shared/middlewares/upload.middleware.js'
import { validateBody, validateParams, validateQuery } from '../../shared/middlewares/validate.middlware.js'
import { analysisPolicy } from '../../shared/config/multer.config.js'
import {
    CreateAnalysisBodySchema,
    AnalysisIdParamsSchema,
    ListAnalysesQuerySchema,
    MapQuerySchema
} from './schemas/analysis.schema.js'

const analysisRoutes = express.Router()

analysisRoutes.use(authenticate) // seguro: o router é montado sob /analyses

analysisRoutes.post('/', createMulterHandler(analysisPolicy), validateBody(CreateAnalysisBodySchema), AnalysisController.create)
analysisRoutes.get('/', validateQuery(ListAnalysesQuerySchema), AnalysisController.list)
analysisRoutes.get('/map', validateQuery(MapQuerySchema), AnalysisController.getMap)
analysisRoutes.get('/:id', validateParams(AnalysisIdParamsSchema), AnalysisController.getDetails)
analysisRoutes.get('/:id/status', validateParams(AnalysisIdParamsSchema), AnalysisController.getStatus)

export default analysisRoutes