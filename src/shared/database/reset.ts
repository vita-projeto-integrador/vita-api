import { connection } from '../models/index.model.js'
import { guardLocalDatabase } from './guard.js'

async function main() {
    guardLocalDatabase()

    // apaga tudo (tabelas, tipos ENUM, extensões) e recria o schema vazio
    await connection.query('DROP SCHEMA IF EXISTS public CASCADE')
    await connection.query('CREATE SCHEMA public')
    await connection.query('CREATE EXTENSION IF NOT EXISTS postgis')

    // cria as tabelas a partir das models (a fonte de verdade)
    await connection.sync()

    console.log('>> [Sequelize] Banco resetado a partir das models.')
}

main()
    .catch((erro) => {
        console.error('Falha no reset:', erro)
        process.exitCode = 1
    })
    .finally(() => connection.close())