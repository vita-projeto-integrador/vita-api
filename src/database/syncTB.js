import { connection } from '../models/index.js' // importa a model principal

export async function syncTables() {
    try {
        await connection.sync()
        console.log('>> [Sequelize] Tabelas criadas com sucesso')
    } catch (error) {
        console.error('>> [Sequelize] Erro ao criar as tabelas: ', error)
    }
}