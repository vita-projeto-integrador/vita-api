import { Sequelize, Options, Dialect } from 'sequelize'

type Environment = 'development' | 'production' | 'test'

const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_DIALECT, DB_PORT, DB_SSL, DB_SSL_CA, NODE_ENV } = process.env

if (!DB_NAME || !DB_USER || !DB_HOST) {
    throw new Error('>> [Sequelize] Variáveis de ambiente do banco de dados não foram definidas')
}

// variáveis de conexão
const dbName = DB_NAME as string
const dbUser = DB_USER as string
const dbPassword = DB_PASSWORD || ''
const dbHost = DB_HOST || 'localhost'
const dbDriver = (DB_DIALECT as Dialect) || 'postgres'
const dbPort = parseInt(DB_PORT as string) || 5432
const isSSL = DB_SSL === 'true'
const nodeEnv = (NODE_ENV as Environment) || 'development'

// configura conexão
const sequelizeOptions: Options = {
    host: dbHost,
    port: dbPort,
    dialect: dbDriver,
    logging: nodeEnv === 'development' ? console.log : false,
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
    dbName,
    dbUser,
    dbPassword,
    // parâmetros customizáveis
    sequelizeOptions
)

export default connection
