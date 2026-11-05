import { Queue } from 'bullmq'
import type { Redis } from 'ioredis'
import { createRedisConnection } from '../../../shared/config/redis.config.js'
import { Analise } from '../../../shared/models/index.model.js'

export const ANALYSIS_QUEUE = 'analysis'
const JOB_NAME = 'classify'

export interface AnalysisJobData {
    analysisId: string
}

let connection: Redis | null = null
let queue: Queue<AnalysisJobData> | null = null

export function startAnalysisQueue(): Queue<AnalysisJobData> {
    if (queue) return queue

    connection = createRedisConnection({ connectionName: 'analysis-queue', enableOfflineQueue: false })
    queue = new Queue<AnalysisJobData>(ANALYSIS_QUEUE, {
        connection,
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 3000 }, // número, não string
            removeOnComplete: 50,
            removeOnFail: 20
        }
    })

    // a cada (re)conexão, recupera análises que ficaram sem job
    connection.on('ready', () => {
        requeuePendingAnalyses().catch((error) => {
            console.error('>> [BullMQ] Falha ao re-enfileirar análises pendentes:', error)
        })
    })

    return queue
}

// (best effort) Redis offline -> análise continua 'em_espera'
export async function enqueueAnalysis(analysisId: string): Promise<boolean> {
    const q = startAnalysisQueue()
    if (connection?.status !== 'ready') return false // não segura a requisição esperando o Redis

    try {
        await q.add(JOB_NAME, { analysisId }, { jobId: analysisId })
        return true
    } catch (error) {
        console.warn('>> [BullMQ] Análise não enfileirada, fica em_espera:', analysisId, error)
        return false
    }
}

async function requeuePendingAnalyses(): Promise<void> {
    const pending = await Analise.findAll({ where: { status: 'em_espera' }, attributes: ['id'] })
    if (pending.length === 0) return

    await startAnalysisQueue().addBulk(pending.map(({ id }) => ({
        name: JOB_NAME,
        data: { analysisId: id },
        opts: { jobId: id }
    })))
    console.log(`>> [BullMQ] ${pending.length} análise(s) re-enfileirada(s)`)
}

export async function closeAnalysisQueue(): Promise<void> {
    await queue?.close()
    queue = null
    connection = null
}