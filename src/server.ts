import app from './app.js'
import { Server } from 'node:http'
import { initDatabase } from './database/init-database.js'
import { startMainClient } from './database/init-redis.js'
import { getDbErrorMessage } from './errors/map-db-error.js'

const PORT: number = Number(process.env.PORT) || 4040

async function startServer(): Promise<void> {
    // start mysql
    try {
        await initDatabase()
    } catch (error) {
        console.error(`>> [Boot] Falha ao conectar no MySQL: ${getDbErrorMessage(error)}`)
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