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
import type { Usuario } from './usuario.model.js'
import type { Imagem } from './imagem.model.js'
import type { Classificacao } from './classificacao.model.js'
import { type Ponto } from '../types/model.types.js'
import { ANALYSIS_STATUSES, type AnalysisStatus, type Timestamps } from './enums.js'

export class Analise extends Model<
    InferAttributes<Analise, { omit: Timestamps }>,
    InferCreationAttributes<Analise, {omit: Timestamps}>
> {
    declare id: CreationOptional<string>
    declare id_usuario: string
    declare status: CreationOptional<AnalysisStatus>
    declare coordenadas: CreationOptional<Ponto | null>
    declare createdAt: Date
    declare updatedAt: Date
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
            defaultValue: literal('gen_random_uuid()')
        },
        id_usuario: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'usuarios',
                key: 'id'
            },
            onDelete: 'RESTRICT'
        },
        status: {
            type: DataTypes.ENUM(...ANALYSIS_STATUSES),
            defaultValue: 'em_espera',
            allowNull: false
        },
        coordenadas: {
            type: DataTypes.GEOGRAPHY('POINT', 4326),
            allowNull: true
        }
    },
    {
        sequelize: connection,
        modelName: 'Analise',
        tableName: 'analises',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                // índice único de otimização
                name: 'analises_id_usuario_idx',
                fields: ['id_usuario']
            },
            {
                // índice único  otimização para tipo POSTGIS
                name: 'analises_coordenadas_gix',
                fields: ['coordenadas'],
                using: 'GIST'
            }
        ]
    }
)

export default Analise