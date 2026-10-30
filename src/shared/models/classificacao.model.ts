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
import { CLASSIFICATION_CLASSES, type ClassificationClass, type Timestamps } from './enums.js'

export class Classificacao extends Model<
    InferAttributes<Classificacao, { omit: Timestamps }>,
    InferCreationAttributes<Classificacao, { omit: Timestamps }>
> {
    declare id: CreationOptional<string>
    declare id_analise: string
    declare tempo_execucao: number
    declare classe: ClassificationClass
    declare confianca: number
    declare modelo_cnn: string
    declare versao_modelo: string
    declare createdAt: Date
    declare updatedAt: Date
    declare deletedAt: Date | null

    // associações (preenchidas só quando usadas no include)
    declare analise?: NonAttribute<Analise>
}

Classificacao.init(
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
        tempo_execucao: {
            type: DataTypes.INTEGER,
            validate: { min: 0 },
            allowNull: false
        },
        classe: {
            type: DataTypes.ENUM(...CLASSIFICATION_CLASSES),
            allowNull: false
        },
        confianca: {
            type: DataTypes.DOUBLE,
            validate: { min: 0, max: 1 },
            allowNull: false
        },
        modelo_cnn: {
            type: DataTypes.STRING(150),
            allowNull: false
        },
        versao_modelo: {
            type: DataTypes.STRING(50),
            allowNull: false
        }
    },
    {
        sequelize: connection,
        modelName: 'Classificacao',
        tableName: 'classificacoes',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                // índice único parcial para classificações de análises não deletadas
                name: 'classificacoes_analise_ativa_uq',
                unique: true,
                fields: ['id_analise'],
                where: { deleted_at: null }
            },
            {
                // índice único de otimização
                name: 'classificacoes_id_analise_idx',
                fields: ['id_analise'],
            }
        ]
    }
)

export default Classificacao