import { Queue } from 'bullmq'
import { createRedisConnection } from '../config/redis-config.js'
import * as services from '../services/index.js'

let imageQueue = null
let lastErrorCode = null
let errorCount = 0

function startImageQueue() {
    // se já foi iniciada
    if (imageQueue) {
        console.log(`>> [BullMQ] ImageQueue rodando`)
        return imageQueue
    }

    // se não, cria conexão Redis exclusiva
    const queueConnection = createRedisConnection({
        maxRetriesPerRequest: null,
        connectionName: 'ImageQueue'
    })
    // instancia uma nova fila do bullmq passando conexão criada
    imageQueue = new Queue('analysis-queue', {
        connection: queueConnection,
    })

    // erro de conexão do bullmq
    imageQueue.on('error', (error) => {
        if (lastErrorCode != error.code) {
            lastErrorCode = error.code
            console.error('>> [BullMQ] Erro de conexão do ImageQueue com Redis: ', error.code)
        } else if (lastErrorCode == error.code && errorCount >= 10) {
            console.error(`>> [BullMQ] Múltiplos erros de conexão do ImageQueue com Redis: ${error.code} x${errorCount}`)
        }
        errorCount++
    })

    // job enfileirado
    imageQueue.on('added', async (job) => {
        try {
            const { analysisId } = job.data
            const queuedAnalysis = await services.analysisService.update(analysisId, {
                status: 'em_fila'
            })
        } catch (error) {
            console.error(`>> [BullMQ] Erro ao atualizar progresso da análise ${analysisId}: ${error}`)
        }
    })

    return imageQueue
}

export default startImageQueue