import { randomUUID } from 'node:crypto'
import { Op, literal } from 'sequelize'
import { connection, Analise, Imagem, Processada, Classificacao } from '../../shared/models/index.model.js'
import AppError from '../../shared/errors/app-error.js'
import storage from '../../shared/config/storage.config.js'
import { mimeToFormat } from '../../shared/config/formats.config.js'
import { detectFormat } from '../../shared/image/pipelines.js'
import { analysisImageKey } from '../../shared/storage/keys.js'
import { toPonto, fromPonto } from '../../shared/utils/geo.js'
import ImageService from '../images/image.service.js'
import ClassificationService from '../classifications/classification.service.js'
import { enqueueAnalysis } from './jobs/analysis.queue.js'
import type { MulterFile } from '../../shared/types/multer.types.js'
import type { CreateAnalysisBodyDTO, ListAnalysesQueryDTO } from './dtos/analysis.dto.js'
import type { FileFormat } from '../../shared/config/formats.config.js'

const images: { id: string, file: MulterFile, format: string, key: string }[] = []

// subqueries correlacionadas; "Analise" é o alias que o Sequelize dá à tabela principal (modelName)
const IMAGES_COUNT_SQL = `(
    SELECT COUNT(*)::int FROM imagens AS img
    WHERE img.id_analise = "Analise"."id" AND img.deleted_at IS NULL
)`
const THUMBNAIL_SQL = `(
    SELECT img.caminho FROM imagens AS img
    WHERE img.id_analise = "Analise"."id" AND img.deleted_at IS NULL
    ORDER BY img.created_at ASC LIMIT 1
)`

class AnalysisService {
    async create(userId: string, files: MulterFile[], data: CreateAnalysisBodyDTO) {
        const analysisId = randomUUID()

        // 1. confere o conteúdo real antes de qualquer efeito colateral
        for (const file of files) {
            const declared = mimeToFormat(file.mimetype)
            const detected = await detectFormat(file.buffer)
            if (!declared || detected !== declared) {
                throw new AppError(415, 'Formato de arquivo inválido', { detail: file.originalname })
            }
            const id = randomUUID()
            images.push({ id, file, format: declared, key: analysisImageKey(userId, analysisId, id, 'original', declared) })
        }

        const coordenadas = data.latitude !== undefined && data.longitude !== undefined
            ? toPonto(data.latitude, data.longitude)
            : null

        // 2. storage + banco; se algo falhar, desfaz o que foi salvo
        try {
            for (const image of images) {
                await storage.save(image.key, image.file.buffer)
            }
            await connection.transaction(async (transaction) => {
                await Analise.create({ id: analysisId, id_usuario: userId, coordenadas }, { transaction })
                await ImageService.createMany(images.map(({ id, file, format, key }) => ({
                    id,
                    id_analise: analysisId,
                    nome: file.originalname.slice(0, 150), // imagens.nome é STRING(150)
                    caminho: key,
                    tipo_mime: mimeToFormat(file.mimetype) as FileFormat,
                    tamanho: file.size
                })), transaction)
            })
        } catch (error) {
            await Promise.all(images.map((image) => storage.delete(image.key).catch((cleanupError) => {
                console.error('>> [Storage] Falha ao remover arquivo órfão:', image.key, cleanupError)
            })))
            throw error
        }

        // 3. enfileira; se o Redis estiver fora, o requeue cuida depois
        const queued = await enqueueAnalysis(analysisId)

        return { id: analysisId, status: 'em_espera' as const, queued }
    }

    async list(userId: string, query: ListAnalysesQueryDTO) {
        const { page, limit, from, to } = query

        const { rows, count } = await Analise.findAndCountAll({
            where: {
                id_usuario: userId,
                ...(from && to ? { createdAt: { [Op.between]: [from, to] } } : {})
            },
            attributes: [
                'id',
                'status',
                'createdAt',
                [literal(IMAGES_COUNT_SQL), 'total_imagens'],
                [literal(THUMBNAIL_SQL), 'miniatura']
            ],
            include: [{ model: Classificacao, as: 'classificacao', attributes: ['classe', 'confianca'] }],
            order: [['createdAt', 'DESC']],
            limit,
            offset: (page - 1) * limit
        })

        return {
            items: rows.map((analysis) => {
                const thumbnail = analysis.get('miniatura')
                return {
                    id: analysis.id,
                    status: analysis.status,
                    criado_em: analysis.createdAt,
                    total_imagens: Number(analysis.get('total_imagens')),
                    miniatura: typeof thumbnail === 'string' ? thumbnail : null,
                    classificacao: analysis.classificacao
                        ? { classe: analysis.classificacao.classe, confianca: analysis.classificacao.confianca }
                        : null
                }
            }),
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
        }
    }

    async getDetails(userId: string, analysisId: string) {
        const analysis = await Analise.findOne({
            where: { id: analysisId, id_usuario: userId },
            include: [
                {
                    model: Imagem,
                    as: 'imagens',
                    attributes: ['id', 'nome', 'caminho', 'tipo_mime', 'tamanho'],
                    include: [{ model: Processada, as: 'processadas', attributes: ['caminho'] }]
                },
                { model: Classificacao, as: 'classificacao' }
            ],
            order: [[{ model: Imagem, as: 'imagens' }, 'createdAt', 'ASC']]
        })

        if (!analysis) throw new AppError(404, 'Análise não encontrada')

        return {
            id: analysis.id,
            status: analysis.status,
            coordenadas: fromPonto(analysis.coordenadas),
            criado_em: analysis.createdAt,
            imagens: (analysis.imagens ?? []).map((imagem) => ({
                id: imagem.id,
                nome: imagem.nome,
                caminho: imagem.caminho,
                tipo_mime: imagem.tipo_mime,
                tamanho: imagem.tamanho,
                processada: imagem.processadas?.[0]?.caminho ?? null
            })),
            classificacao: analysis.classificacao
                ? ClassificationService.toResponse(analysis.classificacao)
                : null
        }
    }

    async getStatus(userId: string, analysisId: string) {
        const analysis = await Analise.findOne({
            where: { id: analysisId, id_usuario: userId },
            attributes: ['id', 'status'],
            include: [{ model: Classificacao, as: 'classificacao', attributes: ['classe', 'confianca'] }]
        })

        if (!analysis) throw new AppError(404, 'Análise não encontrada')

        return {
            id: analysis.id,
            status: analysis.status,
            classificacao: analysis.classificacao
                ? { classe: analysis.classificacao.classe, confianca: analysis.classificacao.confianca }
                : null
        }
    }
}

export default new AnalysisService()