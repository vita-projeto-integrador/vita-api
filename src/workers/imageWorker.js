import { Worker } from 'bullmq'
import { createRedisConnection } from '../config/redis-config.js'
import { performance } from 'node:perf_hooks'
import * as services from '../services/index.js'
import storageService from '../utils/storage/storageService.js'
import preProcess from '../pipelines/preProcess.js'

let imageWorker = null
let lastErrorCode = null
let errorCount = 0

function startImageWorker() {
    // já iniciado
    if (imageWorker) return imageWorker
    // se não, cria conexão Redis exclusiva
    const workerConnection = createRedisConnection({
        maxRetriesPerRequest: null,
        connectionName: 'ImageWorker'
    })
    // cria instância
    imageWorker = new Worker('analysis-queue', async (job) => {
        try {
            // dispara contador do worker
            const startWorker = performance.now()
            // extrai dados do job
            const { analysisId, userId, images } = job.data
            let analysisObject = []

            // para cada foto
            for (const image of images) {
                // converte buffer serializado para buffer puro
                const originalBuffer = Buffer.isBuffer(image.buffer) ? image.buffer : Buffer.from(image.buffer.data || image.buffer)

                if (!originalBuffer || originalBuffer.length === 0) {
                    console.error(`>> [BullMQ] Buffer da imagem ${image.originalName} está vazio ou inválido.`)
                }

                // passa buffer por pipeline de pré-processamento
                const processedBuffer = await preProcess.preProcess(originalBuffer)

                // salva buffers temporariamente
                const tempProcessedPath = await storageService.save(
                    processedBuffer,
                    `${analysisId}`,
                    '.webp'
                )

                const tempOriginalPath = await storageService.save(
                    originalBuffer,
                    `${analysisId}`,
                    '.webp'
                )

                // monta objeto para envio à CNN
                analysisObject.push({
                    original: {
                        buffer: originalBuffer,
                        metadata: {
                            tempPath: tempOriginalPath,
                            name: image.originalName,
                            mimeType: image.mimeType,
                            size: image.size
                        }
                    },
                    processed: {
                        buffer: processedBuffer,
                        metadata: {
                            tempPath: tempProcessedPath,
                            mimeType: 'image/webp',
                            size: processedBuffer.length
                        }
                    }
                })
            }

            // inicia contador da CNN
            const startCNN = performance.now()

            // aguarda inferência na CNN
            const inference = await services.cnnService.simulate(analysisId, analysisObject)
            console.log(`>> [BullMQ] Análise ${analysisId} classificada com sucesso`)

            // finaliza contador da CNN
            const endCNN = performance.now()

            // para cada conjunto de foto + versões processadas
            for (const object of analysisObject) {
                // separa imagens e versões processadas
                const processedMeta = object.processed.metadata
                const imageMeta = object.original.metadata
                // move arquivos temporários para pastas definitivas
                const processedPath = await storageService.move(processedMeta.tempPath, 'processed', analysisId, userId)
                const originalPath = await storageService.move(imageMeta.tempPath, 'uploads', analysisId, userId)
                // cadastra imagens no banco
                const image = await services.imagesService.create({
                    id_analise: analysisId,
                    nome: imageMeta.name,
                    caminho: originalPath,
                    tipo_mime: imageMeta.mimeType,
                    tamanho: imageMeta.size
                })
                const processed = await services.processedService.create({
                    id_imagem: image.id,
                    nome: imageMeta.name,
                    caminho: processedPath,
                    tipo_mime: processedMeta.mimeType,
                    tamanho: processedMeta.size
                })
            }

            // limpa pasta temporária (após o loop)
            await storageService.cleanTemp(`${analysisId}`)
            console.log(`>> [Storage] Pasta temporária limpa com sucesso`)

            // cadastra classificação no banco
            const cnnExecTime = endCNN - startCNN
            const classification = await services.classificationService.create({
                id_analise: analysisId,
                tempo_execucao: cnnExecTime,
                classe: inference.preDiagnosis,
                confianca: inference.confidence,
                modelo_cnn: inference.model
            })
            // finaliza contador de performance do job
            const endWorker = performance.now()
            const workerExecTime = endWorker - startWorker
            console.log(`>> [BullMQ] Job ${job.id} foi completado em ${workerExecTime} ms`)
        } catch (error) {
            console.error(`>> [BullMQ] Erro ao processar job ${job.id} : ${error.message}`)
            throw error // informa BullMQ que job falhou -> após todas as tentativas, chama job.on('failed')
        }
    }, { connection: workerConnection })

    // listeners
    // job finalizou
    imageWorker.on('completed', async (job) => {
        try {
            const { analysisId } = job.data
            // atualiza análise no banco
            const completeAnalysis = await services.analysisService.update(analysisId, {
                status: 'finalizada'
            })
        } catch (error) {
            console.error('>> [BullMQ] Erro ao atualizar progresso da análise: ', error)
        }
    })

    // job iniciou
    imageWorker.on('active', async (job) => {
        try {
            const { analysisId } = job.data
            const initializedAnalysis = await services.analysisService.update(analysisId, {
                status: 'classificando'
            })
            console.log(`>> [BullMQ] Classificando Análise ${analysisId} ... Tentativa ${job.attemptsMade + 1}`)
        } catch (error) {
            console.error(`>> [BullMQ] Erro ao atualizar progresso da análise ${analysisId}: ${error}`)
        }
    })

    // job falhou
    imageWorker.on('failed', async (job, err) => {
        try {
            const { analysisId } = job.data
            // atualiza análise no banco
            const cancelAnalysis = await services.analysisService.update(analysisId, {
                status: 'cancelada'
            })
        } catch (error) {
            console.error(`>> [BullMQ] Erro ao atualizar progresso da análise ${analysisId}: ${error}`)
        } finally {
            console.error(`>> [BullMQ] Job ${job.id} falhou: ${err.message}`)
        }
    })

    // erro de conexão
    imageWorker.on('error', (error) => {
        if (lastErrorCode != error.code) {
            lastErrorCode = error.code
            console.error('>> [BullMQ] Erro de conexão do ImageWorker com Redis: ', error.code)
        } else if (lastErrorCode == error.code && errorCount >= 10) {
            console.error(`>> [BullMQ] Múltiplos erros de conexão do ImageWorker com Redis: ${error.code} x${errorCount}`)
        }
        errorCount++
    })

    return imageWorker
}

async function stopImageWorker(){
    if(imageWorker){
        await imageWorker.close()
        imageWorker = null
    }
}

export {startImageWorker, stopImageWorker}