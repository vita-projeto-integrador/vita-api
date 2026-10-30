import app from './app.js'
import { Server } from 'node:http'
import { initDatabase } from './shared/database/init-database.js'
import { startMainClient } from './shared/database/init-redis.js'
import { getDbErrorMessage } from './shared/errors/db-error.js'
import { env } from './shared/config/env.config.js'
import { initStorage } from './shared/storage/init-storage.js'

const PORT: number = env.app.port

async function startServer(): Promise<void> {
    // start postgres
    try {
        await initDatabase() // conecta ao banco
    } catch (error) {
        console.error(`>> [Boot] Falha ao conectar banco de dados: ${getDbErrorMessage(error)}`)
        process.exit(1)
    }
    // start storage
    try {
        await initStorage() // cria pastas, limpa tmp/ e testa gravação
    } catch (error) {
        console.error(`>> [Boot] Falha ao preparar storage: ${error}`)
        process.exit(1)
    }
    // start redis
    try {
        await startMainClient()
    } catch (error) {
        console.error(`>> [Boot] Falha ao conectar no Redis: ${error}`)
    }
    // start node
    try {
        // start do servidor node
        const server: Server = app.listen(PORT, () => {
            console.log(`>> [Node] Servidor Node rodando em http://localhost:${PORT}`)
        })

        // erros http
        server.on('error', (error: Error) => {
            console.error(`>> [Node] Erro ao iniciar servidor: ${error.message}`)
            process.exit(1)
        })

        // sem try catch
        process.on('uncaughtException', (error: Error) => {
            console.error(`>> [Node] Exceção não capturada: ${error}`)
            process.exit(1)
        })

        // promise rejeitada
        process.on('unhandledRejection', (reason: unknown) => {
            console.error('>> [Node] Rejeição não tratada:', reason)
            process.exit(1);
        })

        // ctrl+c, encerramento de container/processo
        const gracefulShutdown = (signal: string) => {
            console.log(`>> [Node] Sinal ${signal} recebido. Encerrando servidor...`)
            server.close(() => {
                console.log('>> [Node] Servidor encerrado corretamente')
                process.exit(0);
            })
        }
        process.on('SIGINT', () => gracefulShutdown('SIGINT')) // sinal do usuário
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM')) // sinal do sistema

    } catch (error) {
        console.error(`>> [Boot] Falha ao iniciar aplicação: ${error}`)
        process.exit(1)
    }
}

startServer()