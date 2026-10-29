import { Sequelize, Options } from 'sequelize'
import { env } from './env.config.js'

const { db, app } = env

// configura conexão
const sequelizeOptions: Options = {
    host: db.host,
    port: db.port,
    dialect: 'postgres', // dialeto fixo
    logging: app.nodeEnv === 'development' ? console.log : false,
    timezone: '+00:00',
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    // opções comuns de todas as models
    define: {
        timestamps: true,
        underscored: true,
        paranoid: true
    },
    dialectOptions: db.ssl
        ? { ssl: { rejectUnauthorized: true, ca: db.sslCa } }
        : {}
}

// instancia cliente
const connection = new Sequelize(
    // parâmetros obrigatórios
    db.name,
    db.user,
    db.password,
    // parâmetros customizáveis
    sequelizeOptions
)

export default connection
