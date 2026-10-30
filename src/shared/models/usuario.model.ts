import {
    DataTypes,
    Model,
    literal,
    type CreationOptional,
    type InferAttributes,
    type InferCreationAttributes,
    type NonAttribute
} from 'sequelize'
import connection from '../config/sequelize.config.js'
import type { Analise } from './analise.model.js'
import { USER_PROFILES, type UserProfile } from './enums.js'

export class Usuario extends Model<InferAttributes<Usuario>, InferCreationAttributes<Usuario>> {
    declare id: CreationOptional<string>
    declare nome: string
    declare email: string
    declare senha_hash: string
    declare telefone: string | null
    declare data_nascimento: string | null
    declare perfil: CreationOptional<UserProfile>
    declare endereco: string | null
    declare cpf: string | null
    declare cnpj: string | null
    declare faculdade: string | null
    declare curso: string | null
    declare foto_perfil: string | null
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>
    declare deletedAt: Date | null

    // associações (preenchidas só quando usadas no include)
    declare analises?: NonAttribute<Analise[]>
}

Usuario.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: literal('gen_random_uuid()')
        },
        nome: {
            type: DataTypes.STRING(150),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(250),
            allowNull: false
        },
        senha_hash: {
            type: DataTypes.STRING,
            allowNull: false
        },
        telefone: {
            type: DataTypes.STRING(15)
        },
        data_nascimento: {
            type: DataTypes.DATEONLY
        },
        perfil: {
            type: DataTypes.ENUM(...USER_PROFILES),
            defaultValue: 'outro',
            allowNull: false
        },
        endereco: {
            type: DataTypes.STRING(255)
        },
        cpf: {
            type: DataTypes.STRING(11),
            allowNull: true
        },
        cnpj: {
            type: DataTypes.STRING(14),
            allowNull: true
        },
        faculdade: {
            type: DataTypes.STRING(150)
        },
        curso: {
            type: DataTypes.STRING(150)
        },
        foto_perfil: {
            type: DataTypes.STRING(2048),
            allowNull: true
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        deletedAt: DataTypes.DATE
    },
    {
        sequelize: connection,
        modelName: 'Usuario',
        tableName: 'usuarios',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                // índice único parcial para usuários não deletados
                // permite recadastrar email depois de soft delete
                name: 'usuarios_email_ativo_uq',
                unique: true,
                fields: ['email'],
                where: { deleted_at: null }
            }
        ]
    }
)

export default Usuario