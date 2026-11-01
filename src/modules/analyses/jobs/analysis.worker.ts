import { Worker, UnrecoverableError } from 'bullmq'
import { createRedisConnection } from '../../../shared/config/redis.config.js'
import { ANALYSIS_QUEUE, type AnalysisJobData } from './analysis.queue.js'
import { processAnalysis, markAsFailed } from './analysis.processor.js'

let worker: Worker<AnalysisJobData> | null = null

export function startAnalysisWorker(): Worker<AnalysisJobData> {
    if (worker) return worker

    worker = new Worker<AnalysisJobData>(ANALYSIS_QUEUE, processAnalysis, {
        connection: createRedisConnection({ connectionName: 'analysis-worker', maxRetriesPerRequest: null }),
        concurrency: 1 // Sharp + simulação são CPU-bound
    })

    worker.on('active', (job) => {
        console.log(`>> [BullMQ] Análise ${job.data.analysisId}: tentativa ${job.attemptsMade + 1}`)
    })

    worker.on('completed', (job) => {
        console.log(`>> [BullMQ] Análise ${job.data.analysisId} concluída`)
    })

    worker.on('failed', (job, error) => {
        if (!job) return
        const { analysisId } = job.data

        // 'failed' dispara a cada tentativa; só a última encerra a análise
        const isFinal = error instanceof UnrecoverableError || job.attemptsMade >= (job.opts.attempts ?? 1)
        console.error(`>> [BullMQ] Análise ${analysisId} falhou (tentativa ${job.attemptsMade}${isFinal ? ', final' : ''}): ${error.message}`)

        if (isFinal) void markAsFailed(analysisId) // markAsFailed nunca lança
    })

    worker.on('error', (error) => {
        console.error('>> [BullMQ] Worker de análises:', error.message)
    })

    return worker
}

export async function stopAnalysisWorker(): Promise<void> {
    await worker?.close() // espera o job ativo terminar
    worker = null
}