import express from 'express'
import UserController from "./user.controller.js"
import {
    SignUpBodySchema,
    LoginBodySchema,
    UpdateMeBodySchema
} from './schemas/user.schema.js'
import { validateBody } from '../../shared/middlewares/validate.middlware.js'
import { authenticate } from '../../shared/middlewares/auth.middleware.js'
import { createMulterHandler } from '../../shared/middlewares/upload.middleware.js'
import { profilePhotoPolicy } from '../../shared/config/multer.config.js'

const userRoutes = express.Router()
const uploadHandler = createMulterHandler(profilePhotoPolicy)

userRoutes.post('/register', validateBody(SignUpBodySchema), UserController.register)

userRoutes.post('/login', validateBody(LoginBodySchema), UserController.login)

userRoutes.use(authenticate)

userRoutes.get('/me', UserController.getMe)

userRoutes.put('/me', validateBody(UpdateMeBodySchema), UserController.updateMe)

userRoutes.put('/me/photo', uploadHandler, UserController.updatePhoto)

userRoutes.delete('/me', UserController.deleteMe)

export default userRoutes