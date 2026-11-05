import express from 'express'
import FileController from './file.controller.js'
import { validateParams, validateQuery } from '../../shared/middlewares/validate.middlware.js'
import { FileKeyParamsSchema, SignedUrlQuerySchema } from './schemas/file.schema.js'

const fileRoutes = express.Router()

// sem authenticate: a assinatura da URL é a autorização (<img> não envia header)
fileRoutes.get('/*key', validateParams(FileKeyParamsSchema), validateQuery(SignedUrlQuerySchema), FileController.read)

export default fileRoutes
