import connection from "../config/sequelize-config.js"
import { createDatabaseIfNotExists } from "./createDB.js"
import { syncTables } from "./syncTB.js"

export async function initDatabase() {
    try {
        await connection.authenticate()
        console.log('>> [Sequelize] Banco de dados conectado com sucesso')
    } catch (error) {
        // verifica se o banco não foi encontrado (1049 = Unknown database)
        if (error.original && error.original.errno === 1049) {
            await createDatabaseIfNotExists()
            await syncTables()
            await connection.authenticate()
            console.log('>> [Sequelize] Banco de dados conectado com sucesso')
        } else {
            console.error('>> [Sequelize] Erro ao iniciar o banco: ', error)
            process.exit(1)
        }
    }
}