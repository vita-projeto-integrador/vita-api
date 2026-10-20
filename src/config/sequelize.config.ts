import { Sequelize, Options, Dialect } from 'sequelize'
import { env } from '../config/env.js'

type Environment = 'development' | 'production' | 'test'

const { db, app } = env

// configura conexão
const sequelizeOptions: Options = {
    host: db.host,
    port: db.port,
    dialect: db.dialect,
    logging: app.nodeEnv === 'development' ? console.log : false,
    timezone: '+00:00',
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
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
