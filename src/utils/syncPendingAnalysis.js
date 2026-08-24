import startImageQueue from "../queues/imageQueue.js"
import storageService from "./storage/storageService.js"
import { analysisService } from "../services/index.js"

// captura análises pendentes, instancia nova fila e reenvia
async function retryPush() {
    try {
        const pendingAnalysis = await analysisService.getPending()
        // console.log(pendingAnalysis)
        for (const analysis of pendingAnalysis) {
            // lê payload.json
            const folder = analysis.id
            const rawPayload = await storageService.readFile(`storage/temp/${folder}/payload.json`)
            if (rawPayload) {
                const payload = JSON.parse(rawPayload)
                // reconstrói job (webp -> buffer)
                const reconstructedJob = {
                    analysisId: payload.analysisId,
                    userId: payload.userId,
                    images: await Promise.all(payload.images.map(async (img) => ({
                        buffer: Buffer.from(await storageService.readFile(img.imagePath)),
                        originalName: img.originalName,
                        mimeType: img.mimeType,
                        size: img.size
                    }))
                    )
                }
                // console.log(reconstructedJob)

                // tenta enfileirar novamente
                const imageQueue = startImageQueue()

                await imageQueue.add('analysis-job', reconstructedJob, {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: '3000'
                    },
                    removeOnComplete: 50,
                    removeOnFail: 20
                })
            } else {
                console.log('>> [Storage] Payload não encontrado')
            }
        }
    } catch (error) {
        console.log('>> [UTIL] Erro ao sincronizar análises pendentes: ', error)
    }
}

export default retryPush