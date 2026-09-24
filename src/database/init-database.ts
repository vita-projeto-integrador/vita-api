import { Sequelize, ConnectionError, DatabaseError } from 'sequelize'
import connection from '../config/sequelize-config.js'
import { getDbErrorMessage, getMysqlErrorCode } from '../errors/map-db-error.js'

async function createDatabaseIfNotExists(): Promise<void> {
    const dbName = process.env.DB_NAME as string
    // reaproveita connection original
    const { username, password, host, port } = connection.config
    // conecta mysql sem especificar nome do banco
    const tempConnection = new Sequelize('', username as string, password as string,
        {
            host,
            port: Number(port) || 3306,
            dialect: 'mysql',
            logging: false,
            dialectOptions: connection.config.dialectOptions
        })
    // cria banco
    try {
        await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`)
        console.log('>> [Sequelize] Banco de dados criado com sucesso')
    } catch (error) {
        console.error(`>> [Sequelize] Erro ao criar o banco: ${error}`)
        throw error
    } finally {
        await tempConnection.close()
    }
}

async function initDatabase(): Promise<void> {
    try {
        await connection.authenticate()
    } catch (error: unknown) {
        // se erro é banco inexistente, recria; se não, lança erro
        if (getMysqlErrorCode(error) !== 'ER_BAD_DB_ERROR') throw error
        console.warn(`[MySQL] ${getDbErrorMessage(error)}. Criando banco...`)
        await createDatabaseIfNotExists()
        await connection.authenticate()
    }
    console.log(`>> [Sequelize] Banco de dados conectado com sucesso`)
}

export { initDatabase }