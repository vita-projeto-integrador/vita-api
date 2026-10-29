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
import type { Processada } from './processada.model.js'
import { TIPOS_MIME, type Ponto, type TipoMime } from '../types/model.types.js'

export class Imagem extends Model<InferAttributes<Imagem>, InferCreationAttributes<Imagem>> {
    declare id: CreationOptional<string>
    declare id_analise: string
    declare nome: string | null
    declare caminho: string
    declare coordenadas: CreationOptional<Ponto | null>
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
            defaultValue: literal('gen_random_uuid()')
        },
        id_analise: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'analises',
                key: 'id'
            },
            onDelete: 'RESTRICT'
        },
        nome: {
            type: DataTypes.STRING(150),
            allowNull: true
        },
        caminho: {
            type: DataTypes.STRING(2048),
            allowNull: false
        },
        coordenadas: {
            // SRID 4326 = WGS 84, o sistema do GPS
            type: DataTypes.GEOGRAPHY('POINT', 4326)
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
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        deletedAt: DataTypes.DATE
    },
    {
        sequelize: connection,
        modelName: 'Imagem',
        tableName: 'imagens',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                // índice único de otimização
                name: 'imagens_id_analise_idx',
                fields: ['id_analise']
            },
            {
                // índice único  otimização para tipo POSTGIS
                name: 'imagens_coordenadas_gix',
                fields: ['coordenadas'],
                using: 'GIST'
            }
        ]
    }
)

export default Imagem