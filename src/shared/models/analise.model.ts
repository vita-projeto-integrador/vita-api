import {
    DataTypes,
    Model,
    type CreationOptional,
    type InferAttributes,
    type InferCreationAttributes,
    type NonAttribute
} from 'sequelize'
import connection from '../config/sequelize.config.js'
import type { Usuario } from './usuario.model.js'
import type { Imagem } from './imagem.model.js'
import type { Classificacao } from './classificacao.model.js'

export const STATUS_ANALISE = ['finalizada', 'pendente', 'em_fila', 'classificando', 'cancelada'] as const
export type StatusAnalise = (typeof STATUS_ANALISE)[number]

export class Analise extends Model<InferAttributes<Analise>, InferCreationAttributes<Analise>> {
    declare id: CreationOptional<string>
    declare id_usuario: string
    declare status: CreationOptional<StatusAnalise>
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>
    declare deletedAt: Date | null

    // associações (preenchidas só quando usadas no include)
    declare usuario?: NonAttribute<Usuario>
    declare imagens?: NonAttribute<Imagem[]>
    declare classificacao?: NonAttribute<Classificacao>
}

Analise.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        id_usuario: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'usuarios',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        status: {
            type: DataTypes.ENUM(...STATUS_ANALISE),
            defaultValue: 'pendente',
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
        modelName: 'Analise',
        tableName: 'analises',
        timestamps: true,
        paranoid: true
    }
)

export default Analise