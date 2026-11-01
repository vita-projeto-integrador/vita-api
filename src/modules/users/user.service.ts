import { Usuario } from '../../shared/models/index.model.js'
import AppError from '../../shared/errors/app-error.js'
import { randomUUID } from 'node:crypto'
import { hashPassword, comparePassword } from '../../shared/utils/hash.js';
import storage from '../../shared/config/storage.config.js'
import type {
    SignUpBodyDTO,
    LoginBodyDTO,
    UpdateMeBodyDTO,
    UserIdParamsDTO
} from './dtos/user.dto.js'
import type { MulterFile } from '../../shared/types/multer.types.js'
import { mimeToFormat } from '../../shared/config/formats.config.js'
import { profilePhotoKey } from '../../shared/storage/keys.js'

class UserService {
    async create(data: SignUpBodyDTO) {
        // verifica se já existe
        const exists = await Usuario.findOne({
            where: { email: data.email }
        })

        if (exists) {
            throw new AppError(409, 'Já existe uma conta com esse endereço de e-mail')
        }

        // hasheia senha
        const senha_hash = await hashPassword(data.senha)

        // tenta cadastrar
        const user = await Usuario.create({
            ...data,
            senha_hash
        })
        return {
            id: user.id,
            nome: user.nome,
            email: user.email,
            perfil: user.perfil,
            criado_em: user.createdAt
        }
    }

    async login(data: LoginBodyDTO) {
        const user = await Usuario.findOne({
            where: { email: data.email }
        })

        if (!user) {
            throw new AppError(401, 'E-mail ou senha inválidos')
        }

        const passwordMatch = await comparePassword(data.senha, user.senha_hash)

        if (!passwordMatch) {
            throw new AppError(401, 'E-mail ou senha inválidos')
        }

        return {
            id: user.id,
            nome: user.nome,
            email: user.email,
            perfil: user.perfil
        }
    }

    async get(id: UserIdParamsDTO) {
        const user = await Usuario.findByPk(id, {
            attributes: {
                exclude: ['senha_hash']
            }
        })

        if (!user) {
            throw new AppError(404, 'Usuário não encontrado')
        }

        return {
            id: user.id,
            nome: user.nome,
            email: user.email,
            perfil: user.perfil,
            telefone: user.telefone,
            endereco: user.endereco,
            data_nascimento: user.data_nascimento,
            cnpj: user.cnpj,
            faculdade: user.faculdade,
            curso: user.curso,
            foto_perfil: user.foto_perfil,
            criado_em: user.createdAt,
            alterado_em: user.updatedAt
        }
    }

    async update(id: UserIdParamsDTO, data: UpdateMeBodyDTO) {

        const user = await Usuario.findByPk(id)

        if (!user) {
            throw new AppError(404, 'Usuário não encontrado')
        }

        const { senha, ...rest } = data

        const changes = senha ? { ...rest, senha_hash: await hashPassword(senha) } : rest

        await user.update(changes)

        return {
            id: user.id,
            nome: user.nome,
            email: user.email,
            perfil: user.perfil,
            alterado_em: user.updatedAt
        }
    }

    async updatePhoto(id: UserIdParamsDTO, file: MulterFile) {
        const format = mimeToFormat(file.mimetype)
        if (!format) throw new AppError(415, 'Formato de arquivo inválido')

        // 1. garante que o usuário existe antes de qualquer efeito colateral
        const user = await Usuario.findByPk(id)
        if (!user) throw new AppError(404, 'Usuário não encontrado')

        // 2. guarda a chave antiga para remoção posterior
        const oldKey = user.foto_perfil

        // 3. salva o novo arquivo
        const newKey = profilePhotoKey(randomUUID(), format)
        await storage.save(newKey, file.buffer)

        // 4. atualiza o banco; se falhar, desfaz o efeito no storage e relança
        try {
            await user.update({ foto_perfil: newKey })
        } catch (error) {
            await storage.delete(newKey).catch((cleanupError) => {
                console.error('>> [Storage] Falha ao remover arquivo órfão:', newKey, cleanupError)
            })
            throw error
        }

        // 5. remove a foto antiga (best effort: a troca já foi efetivada)
        if (oldKey) {
            await storage.delete(oldKey).catch((cleanupError) => {
                console.warn('>> [Storage] Falha ao remover foto antiga:', oldKey, cleanupError)
            })
        }

        return { foto_perfil: newKey }
    }

    async delete(id: UserIdParamsDTO) {
        const user = await Usuario.findByPk(id)

        if (!user) {
            throw new AppError(404, 'Usuário não encontrado', { detail: 'Usuário já desativado ou inexistente' })
        }

        await user.destroy()
    }
}

export default new UserService()