import connection from '../config/sequelize.config.js'
import { getDbErrorMessage } from '../errors/db-error.js'
import { withTimeout } from '../utils/with-timeout.js'

async function closeDatabase(): Promise<void> {
    try {
        await withTimeout(connection.close(), 15000)
    } catch (error: unknown) {
        throw new Error(getDbErrorMessage(error), { cause: error })
    }
    console.log(`>> [Sequelize] Conexão com banco de dados encerrada com sucesso`)
}

export { closeDatabase }
