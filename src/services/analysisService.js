// import Analise from '../models/Analise.js'
import AppError from '../utils/appError.js'
import startImageQueue from '../queues/imageQueue.js'
// import Classificacao from '../models/Classificacao.js'
// import Imagem from '../models/Imagem.js'
import { Analise, Imagem, Classificacao } from '../models/index.js'
import { getRedisState } from '../config/redisState.js'
import storageService from '../utils/storage/storageService.js'
import { fn, col, literal } from 'sequelize'
import { literal, Op } from 'sequelize'

class AnalysisService {
    // cadastra análise 'pendente'
    async create(userId, files) {
        const analysis = await Analise.create({ id_usuario: userId })

        // verifica estado do Redis
        const isRedisAlive = getRedisState()
        let queued = isRedisAlive

        // monta job
        const job = {
            analysisId: analysis.id,
            userId: userId,
            images: files.map(file => ({
                buffer: file.buffer,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size
            }))
        }
        // se Redis está online, dispara fila
        if (isRedisAlive) {
            this.push(job)
        } else {
            // se não, salva buffers temporariamente
            const imagesCopy = await Promise.all(
                files.map(async file => ({
                    imagePath: await storageService.save(file.buffer, `${analysis.id}`, storageService.extensionFor(file.mimetype)),
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size
                }))
            )
            // monta cópia do job
            const payload = {
                analysisId: job.analysisId,
                userId: job.userId,
                images: imagesCopy
            }
            // salva temporariamente
            await storageService.savePayload(payload, `${analysis.id}`)
        }
        return { analysis, queued }
    }
    // dispara fila
    async push(job) {
        // instancia nova fila por demanda, e não junto do servidor
        const imageQueue = startImageQueue()

        await imageQueue.add('analysis-job', job, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: '3000'
            },
            removeOnComplete: 50,
            removeOnFail: 20
        })
    }
    // atualiza estado de progresso da análise
    async update(analysisId, data, extraWhere = {}) {
        if (!analysisId) {
            throw new AppError('Erro ao enviar ID da análise referente', 400)
        }

        if (!data) {
            throw new AppError('Erro ao enviar dados para atualização da análise', 400)
        }

        const updatedAnalysis = await Analise.update(data, {
            where: {
                id: analysisId,
                ...extraWhere
            }
        })

        return {
            id: analysisId,
            userId: updatedAnalysis.id_usuario,
            status: updatedAnalysis.status
        }
    }
    // consulta análise por ID
    async get(analysisId, userId) {
        if (!analysisId) {
            throw new AppError('Erro ao enviar ID da análise referente', 400)
        }

        const analysis = await Analise.findOne({
            where: { id: analysisId, id_usuario: userId }
        })

        return analysis
    }
    // monta lista de análises com paginação e período opcional
    async getAll(userId, page = 1, from = null, to = null) {
        if (!userId) {
            throw new AppError('Erro ao enviar ID do usuário referente', 400)
        }
        // parâmetros de paginação
        const limit = 20
        const offset = (page - 1) * limit

        // filtro por período só quando os dois limites forem enviados
        const where = { id_usuario: userId }
        if (from && to) {
            where.createdAt = { [Op.between]: [from, to] }
        }

        const analysisList = await Analise.findAll({
            attributes: [
                'id',
                'status',
                'createdAt',
                // subquery para contar imagens (alias da tabela = nome do model: 'analises')
                [
                    literal(`(
                SELECT COUNT(*)
                FROM imagens AS img
                WHERE img.id_analise = analises.id AND img.deletedAt IS NULL
            )`),
                    'imagesCount'
                ],
                // subquery para a miniatura: caminho da primeira imagem ou null
                [
                    literal(`(
                SELECT img.caminho
                FROM imagens AS img
                WHERE img.id_analise = analises.id AND img.deletedAt IS NULL
                ORDER BY img.createdAt ASC
                LIMIT 1
            )`),
                    'thumbnail'
                ]
            ],
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: Classificacao,
                    as: 'classificacao',
                    attributes: ['classe', 'confianca']
                }
            ],
            where,
            limit,
            offset
        })
        return analysisList
    }
    // monta relatório completo da análise
    async getDetails(analysisId, userId) {
        if (!analysisId) {
            throw new AppError('Erro ao enviar ID da análise referente', 400)
        }

        const analysisDetails = await Analise.findOne({
            where: { id: analysisId, id_usuario: userId },
            attributes: [
                'id',
                'status',
                'createdAt'
            ],
            include: [
                {
                    model: Imagem,
                    as: 'imagem',
                    attributes: ['caminho']
                },
                {
                    model: Classificacao,
                    as: 'classificacao',
                    attributes: [
                        'classe',
                        'confianca',
                        'tempo_execucao',
                        'modelo_cnn'
                    ]
                }
            ]
        })

        if (!analysisDetails) {
            throw new AppError('Análise não encontrada', 404)
        }

        return analysisDetails
    }
    // consulta análises pendentes
    async getPending() {
        const pending = await Analise.findAll({
            order: [['createdAt', 'DESC']],
            where: {
                status: 'pendente'
            }
        })
        return pending
    }
}

export default new AnalysisService()