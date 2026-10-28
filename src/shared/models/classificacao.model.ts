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

export class Classificacao extends Model<InferAttributes<Classificacao>, InferCreationAttributes<Classificacao>> {
    declare id: CreationOptional<string>
    declare id_analise: string
    declare tempo_execucao: number | null
    declare classe: number
    declare confianca: number
    declare modelo_cnn: string
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>
    declare deletedAt: Date | null

    // associações (preenchidas só quando usadas no include)
    declare analise?: NonAttribute<Analise>
}

Classificacao.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        id_analise: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true, // garante o 1-1 no banco, não só no código
            references: {
                model: 'analises',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        tempo_execucao: {
            type: DataTypes.INTEGER
        },
        classe: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        confianca: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        modelo_cnn: {
            type: DataTypes.STRING,
            allowNull: false
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
        modelName: 'Classificacao',
        tableName: 'classificacoes',
        timestamps: true,
        paranoid: true
    }
)

export default Classificacao