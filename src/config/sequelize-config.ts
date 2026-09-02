import { Sequelize, Options, Dialect } from 'sequelize'

type Environment = 'development' | 'production' | 'test'

const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_DIALECT, DB_PORT, DB_SSL, NODE_ENV } = process.env

if (!DB_NAME || !DB_USER || !DB_HOST) {
    console.log('>> [Sequelize] Variáveis de ambiente do banco de dados não foram definidas')
}

const dbName = DB_NAME as string
const dbUser = DB_USER as string
const dbPassword = DB_PASSWORD || ''
const dbHost = DB_HOST || 'localhost'
const dbDriver = (DB_DIALECT as Dialect) || 'mysql'
const dbPort = parseInt(DB_PORT as string) || 3306
const isSSL = DB_SSL === 'true'
const nodeEnv = (NODE_ENV as Environment) || 'development'

const sequelizeOptions: Options = {
    host: dbHost,
    port: dbPort,
    dialect: dbDriver,
    logging: nodeEnv === 'development' ? console.log : false,
    timezone: '-03:00',
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    dialectOptions: isSSL ? {
        ssl: {
            // força criptografia TLS/SSL
            required: true,
            rejectUnauthorized: false
        }
    } : {}
}

const connection = new Sequelize(
    // parâmetros obrigatórios
    dbName,
    dbUser,
    dbPassword,
    // parâmetros customizáveis
    sequelizeOptions
)

export default connection
