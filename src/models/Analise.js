import connection from '../config/sequelize-config.js'
import { DataTypes } from 'sequelize'

const Analise = connection.define('analises', {
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
        }
    },
    status: {
        type: DataTypes.ENUM('finalizada', 'pendente', 'em_fila', 'classificando', 'cancelada'),
        defaultValue: 'pendente',
        allowNull: false
    },
},
    {
        tableName: 'analises',
        timestamps: true,
        paranoid: true
    }
)

export default Analise