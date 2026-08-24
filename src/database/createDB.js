import { Sequelize } from 'sequelize'

export async function createDatabaseIfNotExists() {

    const { DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT } = process.env

    if (!DB_HOST || !DB_NAME || !DB_USER) {
        console.log('>> [Sequelize] Variáveis de ambiente do banco de dados não foram definidas')
    }

    // objeto de conexão temporária usado apenas para criar o banco
    const sequelize = new Sequelize({
        dialect: 'mysql',
        host: DB_HOST,
        port: DB_PORT || 3306,
        username: DB_USER,
        password: DB_PASSWORD,
        logging: false,
    });

    try {
        await sequelize.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`)
        console.log('>> [Sequelize] Banco de dados criado com sucesso.')
    } catch (error) {
        console.error('>> [Sequelize] Erro ao criar o banco: ', error)
        throw error
    } finally {
        await sequelize.close()
    }

}