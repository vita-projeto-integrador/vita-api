import app from './app.js'
import { initDatabase } from './src/database/initDB.js'
import { initStorage } from './src/utils/storage/init.js'
import { startMainClient } from './src/config/redis-config.js'

const port = process.env.PORT || 4040

async function startServer() {
    try {

        await initDatabase() // inicia banco de dados

        await initStorage() // inicia storage

        // inicia servidor 
        const server = app.listen(port, () => {
            console.log(`>> [Node] Aplicação iniciada ... Servidor rodando em http://localhost:${port}`)
        })

        // inicia Redis
        try {
            console.log('>> [Node] Iniciando cliente principal do Redis...')
            startMainClient()
        } catch (error) {
            console.error('>> [Node] Erro ao iniciar serviços assíncronos: ', error)
        }

        // tratamento de erros
        // erro conhecido
        server.on('error', (err) => {
            console.error(`>> [Node] Erro ao iniciar o servidor: ${err}`)
            process.exit(1)
        })

        // sem try catch
        server.on('uncaughtException', (err) => {
            console.error(`>> [Node] Exceção não capturada: ${err}`)
            process.exit(1)
        })

        // promise rejeitada
        process.on('unhandledRejection', (reason) => {
            console.error('>> [Node] Rejeição não tratada:', reason);
            process.exit(1);
        });

        // grateful shutdown
        process.on('SIGTERM', async () => {
            console.log('>> [Node] Encerrando servidor...');

            await sequelize.close()

            server.close(() => {
                console.log('>> [Node] Servidor encerrado corretamente');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('>> [Node] Falha ao iniciar a aplicação: ', error)
        process.exit(1)
    }
}

startServer()