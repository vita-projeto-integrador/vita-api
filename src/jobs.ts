import { startAnalysisQueue, closeAnalysisQueue } from './modules/analyses/jobs/analysis.queue.js'
import { startAnalysisWorker, stopAnalysisWorker } from './modules/analyses/jobs/analysis.worker.js'

export function startJobs(): void {
    startAnalysisQueue()
    startAnalysisWorker()
}

export async function stopJobs(): Promise<void> {
    await stopAnalysisWorker() // primeiro termina o que está em andamento
    await closeAnalysisQueue()
}