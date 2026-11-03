import connection from '../config/sequelize-config.js';
import { getDbErrorMessage } from '../errors/db-error.js';
import { withTimeout } from '../utils/with-timeout.js';
async function initDatabase() {
    try {
        await await withTimeout(connection.authenticate(), 15000);
    }
    catch (error) {
        throw new Error(`>> [Postgres] ${getDbErrorMessage(error)}`);
    }
    console.log(`>> [Sequelize] Banco de dados conectado com sucesso`);
}
export { initDatabase };
