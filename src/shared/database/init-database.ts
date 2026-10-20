import connection from '../config/sequelize.config.js'
import { getDbErrorMessage, getDbErrorCode } from '../errors/db-error.js'
import { withTimeout } from '../utils/with-timeout.js'

async function initDatabase(): Promise<void> {
    try {
        await await withTimeout(connection.authenticate(), 15000)
    } catch (error: unknown) {
        throw new Error(`${getDbErrorMessage(error)}`)
    }
    console.log(`>> [Sequelize] Banco de dados conectado com sucesso`)
}

export { initDatabase }