import type { Request, Response } from 'express'
import AppError from '../../shared/errors/app-error.js'
import UserService from './user.service.js'
import type { SignUpBodyDTO, LoginBodyDTO, UpdateMeBodyDTO, UserIdParamsDTO } from './dtos/user.dto.js'
import type { MulterFile } from '../../shared/types/multer.types.js'
import { generateToken } from '../../shared/utils/jwt.js'
import { validate } from 'uuid'
import { AppResponse } from '../../shared/utils/app-response.js'

class UserController {
    register = async (req: Request, res: Response) => {
        const data = req.validated?.body as SignUpBodyDTO

        const user = await UserService.create(data)

        const { id, email, nome, perfil } = user

        const token = generateToken({ id, email, nome, perfil })

        const result = { usuario: user, token }

        return AppResponse.send(res, 201, 'Usuário criado com sucesso', result)
    }

    login = async (req: Request, res: Response) => {
        const data = req.validated?.body as LoginBodyDTO

        const user = await UserService.login(data)

        const { id, email, nome, perfil } = user

        const token = generateToken({ id, email, nome, perfil })

        const result = { usuario: user, token }

        return AppResponse.send(res, 200, 'Login realizado com sucesso', result)
    }

    getMe = async (req: Request, res: Response) => {
        const id = req.user?.id as string

        if (!req.user || !id) {
            throw new AppError(401, 'Usuário não autenticado')
        }

        if (!validate(id)) {
            throw new AppError(400, 'ID inválido')
        }

        const user = await UserService.get(id)

        return AppResponse.send(res, 200, 'Usuário encontrado', user)
    }

    updateMe = async (req: Request, res: Response) => {
        const id = req.user?.id as UserIdParamsDTO
        const data = req.validated?.body as UpdateMeBodyDTO

        if (!req.user || !id) {
            throw new AppError(401, 'Usuário não autenticado')
        }

        const user = await UserService.update(id, data)

        return AppResponse.send(res, 200, 'Perfil atualizado com sucesso', user)
    }

    updatePhoto = async (req: Request, res: Response) => {
        const id = req.user?.id as UserIdParamsDTO
        const [file] = req.validated?.files as MulterFile[]

        if (!req.user || !id) {
            throw new AppError(401, 'Usuário não autenticado')
        }

        const result = await UserService.updatePhoto(id, file)

        return AppResponse.send(res, 200, 'Foto de perfil atualizada com sucesso', result)
    }

    deleteMe = async (req: Request, res: Response) => {
        const id = req.user?.id as UserIdParamsDTO

        if (!req.user || !id) {
            throw new AppError(401, 'Usuário não autenticado')
        }

        await UserService.delete(id)

        return AppResponse.send(res, 200, 'Usuário desativado com sucesso')
    }
}

export default new UserController()
