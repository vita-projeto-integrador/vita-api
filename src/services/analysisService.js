// import Analise from '../models/Analise.js'
import AppError from '../utils/appError.js'
import startImageQueue from '../queues/imageQueue.js'
// import Classificacao from '../models/Classificacao.js'
// import Imagem from '../models/Imagem.js'
import { Analise, Imagem, Classificacao } from '../models/index.js'
import { getRedisState } from '../config/redisState.js'
import storageService from '../utils/storage/storageService.js'
import { fn, col, literal, Op } from 'sequelize'
import { toPoint, fromPoint, pickAnalysisLocation } from '../utils/geo.js'
import { STATUS_TO_DB, STATUS_FROM_DB, CLASSE_TO_DB, CLASSE_FROM_DB } from '../utils/contract.js'

// máximo de pontos devolvidos pela rota do mapa
const MAP_LIMIT = 500

class AnalysisService {
    // cadastra análise 'pendente'
    async create(userId, files, metadata) {
        // local da análise
        const location = pickAnalysisLocation(metadata.map(item => item.localizacao))

        const analysis = await Analise.create({
            id_usuario: userId,
            coordenadas: location ? toPoint(location) : null,
            precisao: location ? location.precisao : null
        })

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
                size: file.size,
                location: metadata[index].localizacao,
                capturedAt: metadata[index].capturadaEm
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
                    size: file.size,
                    location: metadata[index].localizacao,
                    capturedAt: metadata[index].capturadaEm
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
                'coordenadas',
                'precisao',
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

        const { coordenadas, precisao, ...details } = analysisDetails.toJSON()
        return { ...details, localizacao: fromPoint(coordenadas, precisao) }
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
    // pontos do mapa: análises do usuário que têm localização
    async getMapItems(userId, filters) {
        const where = {
            id_usuario: userId,
            coordenadas: { [Op.ne]: null } // só análises com localização
        }
        if (filters.from && filters.to) {
            where.createdAt = { [Op.between]: [filters.from, filters.to] }
        }
        if (filters.status) {
            // traduz o status do contrato para os status da API JS
            where.status = { [Op.in]: filters.status.flatMap(status => STATUS_TO_DB[status]) }
        }

        const classificacao = {
            model: Classificacao,
            as: 'classificacao',
            attributes: ['classe', 'confianca']
        }
        if (filters.classe) {
            // com 'where', o include vira INNER JOIN: só análises com essa classe
            classificacao.where = { classe: CLASSE_TO_DB[filters.classe] }
        }

        const { rows, count } = await Analise.findAndCountAll({
            attributes: ['id', 'status', 'createdAt', 'coordenadas', 'precisao'],
            include: [classificacao],
            where,
            order: [['createdAt', 'DESC']],
            limit: MAP_LIMIT,
            distinct: true // conta análises, não linhas do JOIN
        })

        // monta cada ponto no formato do contrato
        const items = rows.map(analysis => {
            const location = fromPoint(analysis.coordenadas, analysis.precisao)
            return {
                id: analysis.id,
                status: STATUS_FROM_DB[analysis.status],
                classe: analysis.classificacao ? CLASSE_FROM_DB[analysis.classificacao.classe] : null,
                confianca: analysis.classificacao ? analysis.classificacao.confianca : null,
                createdAt: analysis.createdAt,
                latitude: location.latitude,
                longitude: location.longitude,
                precisao: location.precisao
            }
        })

        return { items, total: count, page: 1, limit: MAP_LIMIT }
    }
}

export default new AnalysisService()