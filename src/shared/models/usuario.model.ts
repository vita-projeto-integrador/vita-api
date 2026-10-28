import {
    DataTypes,
    Model,
    type CreationOptional,
    type InferAttributes,
    type InferCreationAttributes,
    type NonAttribute
} from 'sequelize'
import connection from '../config/sequelize.config.js'
import type { Analise } from './analise.model.js'

export class Usuario extends Model<InferAttributes<Usuario>, InferCreationAttributes<Usuario>> {
    declare id: CreationOptional<string>
    declare nome: string
    declare email: string
    declare senha: string
    declare telefone: string | null
    declare data_nascimento: string | null
    declare tipo_acesso: CreationOptional<'produtor' | 'estudante'>
    declare endereco: string | null
    declare cnpj: string | null
    declare faculdade: string | null
    declare curso: string | null
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
            defaultValue: DataTypes.UUIDV4
        },
        nome: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        senha: {
            type: DataTypes.STRING,
            allowNull: false
        },
        telefone: {
            type: DataTypes.STRING
        },
        data_nascimento: {
            type: DataTypes.DATEONLY
        },
        tipo_acesso: {
            type: DataTypes.ENUM('produtor', 'estudante'),
            defaultValue: 'produtor',
            allowNull: false
        },
        endereco: {
            type: DataTypes.STRING
        },
        cnpj: {
            type: DataTypes.STRING
        },
        faculdade: {
            type: DataTypes.STRING
        },
        curso: {
            type: DataTypes.STRING
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
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
                name: 'usuarios_email_ativo_unique',
                unique: true,
                fields: ['email'],
                where: { deleted_at: null }
            }
        ]
    }
)

export default Usuario