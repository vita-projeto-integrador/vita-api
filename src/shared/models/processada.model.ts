import {
    DataTypes,
    Model,
    type CreationOptional,
    type InferAttributes,
    type InferCreationAttributes,
    type NonAttribute
} from 'sequelize'
import connection from '../config/sequelize.config.js'
import type { Imagem } from './imagem.model.js'
import { TIPOS_MIME, type TipoMime } from './tipo.model.js'

export class Processada extends Model<InferAttributes<Processada>, InferCreationAttributes<Processada>> {
    declare id: CreationOptional<string>
    declare id_imagem: string
    declare nome: string
    declare caminho: string
    declare tipo_mime: TipoMime
    declare tamanho: number
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>
    declare deletedAt: Date | null

    // associações (preenchidas só quando usadas no include)
    declare imagem?: NonAttribute<Imagem>
}

Processada.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        id_imagem: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'imagens',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        nome: {
            type: DataTypes.STRING,
            allowNull: false
        },
        caminho: {
            type: DataTypes.STRING,
            allowNull: false
        },
        tipo_mime: {
            type: DataTypes.ENUM(...TIPOS_MIME),
            allowNull: false
        },
        tamanho: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1
            }
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
        modelName: 'Processada',
        tableName: 'processadas',
        timestamps: true,
        paranoid: true
    }
)

export default Processada