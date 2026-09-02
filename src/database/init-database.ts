import { Sequelize } from 'sequelize'
import connection from '../config/sequelize-config.js'

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

// async function syncTables(): Promise<void>{
//     try {
//     } catch (error) {
//     }
// }

async function initDatabase(): Promise<void> {
    try {
        await connection.authenticate()
        console.log(`>> [Sequelize] Banco de dados conectado com sucesso`)
    } catch (error: any) {
        // se o banco não foi encontrado
        if(error.original && error.original.errno === 1049){
            console.log(`>> [Sequelize] Banco de dados não encontrado`)
            await createDatabaseIfNotExists()
            // await syncTables(){}
            await connection.authenticate()
            console.log(`>> [Sequelize] Banco de dados conectado com sucesso`)
        } else {
            console.error(`>> [Sequelize] Erro fatal ao iniciar o banco: ${error.message}`)
            process.exit(1)
        }
    }
}

export { initDatabase }