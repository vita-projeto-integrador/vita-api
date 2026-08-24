import { Sequelize } from "sequelize"

const {DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT} = process.env

if (!DB_HOST || !DB_NAME || !DB_USER){
    console.log('>> [Sequelize] Variáveis de ambiente do banco de dados não foram definidas')
}

const connection = new Sequelize(
    // parâmetros obrigatórios
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    {
        // parâmetros customizáveis
        host: DB_HOST,
        port: DB_PORT,
        dialect: 'mysql',
        logging: false,
        timezone: '-03:00',
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
)

export default connection