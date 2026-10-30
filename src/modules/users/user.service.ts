import { Usuario } from '../../shared/models/index.model.js'
import AppError from '../../shared/errors/app-error.js'
import { hashPassword, comparePassword } from '../../shared/utils/hash.js';
import type {
    SignUpBodyDTO,
    LoginBodyDTO,
    UpdateMeBodyDTO,
    UserIdParamsDTO
} from './dtos/user.dto.js'


class UserService {
    async create(data: SignUpBodyDTO) {
        // verifica se já existe
        const exists = await Usuario.findOne({
            where: { email: data.email }
        })

        if (exists) {
            throw new AppError(401, 'Já existe uma conta com esse endereço de e-mail')
        }

        const user = await Usuario.create(data)

        return
    }
}