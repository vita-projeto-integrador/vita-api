import { UnrecoverableError, type Job } from 'bullmq'
import { Op } from 'sequelize'
import { connection, Analise, Imagem } from '../../../shared/models/index.model.js'
import storage from '../../../shared/config/storage.config.js'
import { StorageError } from '../../../shared/errors/storage-error.js'
import { analysisImageKey } from '../../../shared/storage/keys.js'
import type { ImageFormat } from '../../../shared/config/formats.config.js'
import { preprocess } from '../../../shared/image/pipelines.js'
import ClassificationService from '../../classifications/classification.service.js'
import ProcessedService from '../../processed/processed.service.js'
import type { AnalysisJobData } from './analysis.queue.js'

interface ProcessedImage {
    image: Imagem;
    buffer: Buffer;
    key: string;
}

const processed: ProcessedImage[] = [];

// formato que o preprocess() gera (e default de processadas.tipo_mime)
const PROCESSED_FORMAT: ImageFormat = 'webp'

// códigos de StorageError que não mudam numa nova tentativa
const PERMANENT_STORAGE_ERRORS = ['NOT_FOUND', 'INVALID_KEY']

const processedKey = (userId: string, analysisId: string, imageId: string) =>
    analysisImageKey(userId, analysisId, imageId, 'processed', PROCESSED_FORMAT)

// traduz erros do domínio para o BullMQ
function toJobError(error: unknown): unknown {
    if (error instanceof StorageError && PERMANENT_STORAGE_ERRORS.includes(error.code)) {
        return new UnrecoverableError(`${error.message} (${error.code})`)
    }
    return error
}

// função registrada no Worker
export async function processAnalysis(job: Job<AnalysisJobData>): Promise<void> {
    try {
        await run(job.data.analysisId)
    } catch (error) {
        throw toJobError(error)
    }
}

async function run(analysisId: string): Promise<void> {
    const analysis = await Analise.findByPk(analysisId, {
        include: [{ model: Imagem, as: 'imagens', attributes: ['id', 'nome', 'caminho'] }]
    })

    // excluída no meio do caminho, ou já concluída por uma tentativa anterior
    if (!analysis || analysis.status === 'finalizada') return

    const images = analysis.imagens ?? []
    if (images.length === 0) {
        throw new UnrecoverableError(`Análise ${analysisId} sem imagens`)
    }

    await analysis.update({ status: 'processando' })

    // 1. pré-processa e salva (key determinística + save atômico: retry sobrescreve)

    for (const image of images) {
        const original = await storage.read(image.caminho) // caminho já é a key da original
        const buffer = await preprocess(original)
        const key = processedKey(analysis.id_usuario, analysisId, image.id)
        await storage.save(key, buffer)
        processed.push({ image, buffer, key })
    }

    // 2. classifica
    const result = await ClassificationService.run(processed.map(({ buffer }) => buffer))

    // 3. grava tudo ou nada
    await connection.transaction(async (transaction) => {
        await ProcessedService.createMany(processed.map(({ image, buffer, key }) => ({
            id_imagem: image.id,
            nome: image.nome ?? `${image.id}.${PROCESSED_FORMAT}`, // processadas.nome é NOT NULL
            caminho: key,
            tipo_mime: PROCESSED_FORMAT,
            tamanho: buffer.length
        })), transaction)

        await ClassificationService.create(analysisId, result, transaction)
        await analysis.update({ status: 'finalizada' }, { transaction })
    })
}

// chamada pelo worker depois da última tentativa; nunca lança
export async function markAsFailed(analysisId: string): Promise<void> {
    try {
        const [affected] = await Analise.update(
            { status: 'falhou' },
            { where: { id: analysisId, status: { [Op.ne]: 'finalizada' } } }
        )
        if (affected === 0) return // excluída ou já finalizada: não mexe em nada

        await discardProcessed(analysisId)
    } catch (error) {
        console.error(`>> [BullMQ] Falha ao encerrar a análise ${analysisId}:`, error)
    }
}

// remove processadas órfãs (a transação não chegou a gravar as linhas)
async function discardProcessed(analysisId: string): Promise<void> {
    const analysis = await Analise.findByPk(analysisId, {
        attributes: ['id', 'id_usuario'],
        include: [{ model: Imagem, as: 'imagens', attributes: ['id'] }]
    })
    if (!analysis) return

    await Promise.all((analysis.imagens ?? []).map((image) =>
        storage.delete(processedKey(analysis.id_usuario, analysisId, image.id))
    ))
}