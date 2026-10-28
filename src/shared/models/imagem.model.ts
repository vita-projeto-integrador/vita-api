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
import type { Processada } from './processada.model.js'
import { TIPOS_MIME, type Ponto, type TipoMime } from './tipo.model.js'

export class Imagem extends Model<InferAttributes<Imagem>, InferCreationAttributes<Imagem>> {
    declare id: CreationOptional<string>
    declare id_analise: string
    declare nome: string
    declare caminho: string
    declare coordenadas: Ponto | null
    declare tipo_mime: TipoMime
    declare tamanho: number
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>
    declare deletedAt: Date | null

    // associações (preenchidas só quando usadas no include)
    declare analise?: NonAttribute<Analise>
    declare processadas?: NonAttribute<Processada[]>
}

Imagem.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        id_analise: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'analises',
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
        coordenadas: {
            // SRID 4326 = WGS 84, o sistema do GPS
            type: DataTypes.GEOMETRY('POINT', 4326)
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
        modelName: 'Imagem',
        tableName: 'imagens',
        timestamps: true,
        paranoid: true
    }
)

export default Imagem