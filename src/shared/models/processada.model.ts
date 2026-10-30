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
import type { Imagem } from './imagem.model.js'
import type { Ponto } from '../types/model.types.js'
import { ALL_FILE_FORMATS, type FileFormat } from './enums.js'

export class Processada extends Model<InferAttributes<Processada>, InferCreationAttributes<Processada>> {
    declare id: CreationOptional<string>
    declare id_imagem: string
    declare nome: string
    declare caminho: string
    declare tipo_mime: FileFormat
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
            defaultValue: literal('gen_random_uuid()')
        },
        id_imagem: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'imagens',
                key: 'id'
            },
            onDelete: 'RESTRICT'
        },
        nome: {
            type: DataTypes.STRING,
            allowNull: false
        },
        caminho: {
            type: DataTypes.STRING(2048),
            allowNull: false
        },
        tipo_mime: {
            type: DataTypes.ENUM(...ALL_FILE_FORMATS),
            defaultValue: 'webp',
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
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        deletedAt: DataTypes.DATE
    },
    {
        sequelize: connection,
        modelName: 'Processada',
        tableName: 'processadas',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                // índice único de otimização
                name: 'processadas_id_imagem_idx',
                fields: ['id_imagem']
            }
        ]
    }
)

export default Processada