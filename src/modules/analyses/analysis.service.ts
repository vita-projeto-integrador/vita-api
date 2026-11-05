import { randomUUID } from 'node:crypto'
import { Op, literal } from 'sequelize'
import { connection, Analise, Imagem, Processada, Classificacao } from '../../shared/models/index.model.js'
import AppError from '../../shared/errors/app-error.js'
import storage from '../../shared/config/storage.config.js'
import { mimeToFormat } from '../../shared/config/formats.config.js'
import { detectFormat } from '../../shared/image/pipelines.js'
import { analysisImageKey } from '../../shared/storage/keys.js'
import { toPonto, toLocalizacao, pickAnalysisLocation } from '../../shared/utils/geo.js'
import ImageService from '../images/image.service.js'
import ClassificationService from '../classifications/classification.service.js'
import { enqueueAnalysis } from './jobs/analysis.queue.js'
import type { MulterFile } from '../../shared/types/multer.types.js'
import type { CreateAnalysisBodyDTO, ListAnalysesQueryDTO, MapQueryDTO, MetadadoDTO } from './dtos/analysis.dto.js'
import type { FileFormat } from '../../shared/config/formats.config.js'
import { toFileUrl } from '../../shared/storage/file-url.js'

/*
======================================
    Subqueries ("Analise" = alias Sequelize)
======================================
*/

// conta total de imagens
const IMAGES_COUNT_SQL = `(
    SELECT COUNT(*)::int FROM imagens AS img
    WHERE img.id_analise = "Analise"."id" AND img.deleted_at IS NULL
)`
// busca as thumbnails das imagens das análises
const THUMBNAIL_SQL = `(
    SELECT img.caminho FROM imagens AS img
    WHERE img.id_analise = "Analise"."id" AND img.deleted_at IS NULL
    ORDER BY img.created_at ASC LIMIT 1
)`

// máximo de pontos devolvidos pela rota do mapa
const MAP_LIMIT = 500

class AnalysisService {
    async create(userId: string, files: MulterFile[], data: CreateAnalysisBodyDTO) {
        const analysisId = randomUUID()

        // sem metadados (web/galeria) -> sem localização
        const metadados: MetadadoDTO[] = data.metadados ?? files.map(() => ({ capturadaEm: null, localizacao: null }))
        if (metadados.length !== files.length) {
            throw new AppError(400, 'Envie um item de metadados por imagem, na mesma ordem')
        }

        // local da análise: a foto com menor erro de GPS (ou null)
        const location = pickAnalysisLocation(metadados.map((item) => item.localizacao))

        const images: { id: string, file: MulterFile, format: string, key: string, metadado: MetadadoDTO }[] = []

        // confere conteúdo real e insere em images[]
        for (const [index, file] of files.entries()) {
            const declared = mimeToFormat(file.mimetype)
            const detected = await detectFormat(file.buffer)
            if (!declared || detected !== declared) {
                throw new AppError(415, 'Formato de arquivo inválido', { detail: file.originalname })
            }
            const id = randomUUID()
            images.push({
                id,
                file,
                format: declared,
                key: analysisImageKey(userId, analysisId, id, 'original', declared),
                metadado: metadados[index] // mesma posição do arquivo
            })
        }

        // storage + banco (se falhar, desfaz)
        try {
            for (const image of images) {
                await storage.save(image.key, image.file.buffer)
            }
            await connection.transaction(async (transaction) => {
                await Analise.create({
                    id: analysisId,
                    id_usuario: userId,
                    coordenadas: location ? toPonto(location.latitude, location.longitude) : null,
                    precisao: location ? location.precisao : null
                }, { transaction })
                await ImageService.createMany(images.map(({ id, file, key, metadado }) => ({
                    id,
                    id_analise: analysisId,
                    nome: file.originalname.slice(0, 150), // STRING(150)
                    caminho: key,
                    tipo_mime: mimeToFormat(file.mimetype) as FileFormat,
                    tamanho: file.size,
                    // localização e horário da foto (null na galeria ou sem GPS)
                    coordenadas: metadado.localizacao
                        ? toPonto(metadado.localizacao.latitude, metadado.localizacao.longitude)
                        : null,
                    precisao: metadado.localizacao ? metadado.localizacao.precisao : null,
                    capturada_em: metadado.capturadaEm ? new Date(metadado.capturadaEm) : null
                })), transaction)
            })
        } catch (error) {
            await Promise.all(images.map((image) => storage.delete(image.key).catch((cleanupError) => {
                console.error('>> [Storage] Falha ao remover arquivo órfão:', image.key, cleanupError)
            })))
            throw error
        }

        // enfileira; se Redis estiver offline faz requeue
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


        // URLs assinadas são assíncronas (no R2, cada uma é gerada pelo SDK)
        const items = await Promise.all(rows.map(async (analysis) => {
            const thumbnail = analysis.get('miniatura')
            return {
                id: analysis.id,
                status: analysis.status,
                criado_em: analysis.createdAt,
                total_imagens: Number(analysis.get('total_imagens')),
                miniatura: typeof thumbnail === 'string' ? await toFileUrl(thumbnail) : null,
                classificacao: analysis.classificacao
                    ? { classe: analysis.classificacao.classe, confianca: analysis.classificacao.confianca }
                    : null
            }
        }))

        return {
            items,
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
            localizacao: toLocalizacao(analysis.coordenadas, analysis.precisao),
            criado_em: analysis.createdAt,
            imagens: await Promise.all((analysis.imagens ?? []).map(async (imagem) => ({
                id: imagem.id,
                nome: imagem.nome,
                caminho: imagem.caminho,
                url: await storage.getUrl(imagem.caminho),
                tipo_mime: imagem.tipo_mime,
                tamanho: imagem.tamanho,
                processada: await toFileUrl(imagem.processadas?.[0]?.caminho)
            }))),
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

    async getMap(userId: string, query: MapQueryDTO) {
        const { from, to, status, classe } = query

        const { rows, count } = await Analise.findAndCountAll({
            where: {
                id_usuario: userId,
                coordenadas: { [Op.ne]: null }, // só análises com localização
                precisao: { [Op.ne]: null },
                ...(from && to ? { createdAt: { [Op.between]: [from, to] } } : {}),
                ...(status ? { status: { [Op.in]: status } } : {})
            },
            attributes: ['id', 'status', 'createdAt', 'coordenadas', 'precisao'],
            include: [{
                model: Classificacao,
                as: 'classificacao',
                attributes: ['classe', 'confianca'],
                // com where, o include vira INNER JOIN: só análises com essa classe
                ...(classe ? { where: { classe } } : {})
            }],
            order: [['createdAt', 'DESC']],
            limit: MAP_LIMIT,
            distinct: true // conta análises, não linhas do JOIN
        })

        return {
            // flatMap: devolve [] para pular a linha (o where já garante a localização)
            items: rows.flatMap((analysis) => {
                const localizacao = toLocalizacao(analysis.coordenadas, analysis.precisao)
                if (!localizacao) return []
                return [{
                    id: analysis.id,
                    status: analysis.status,
                    classe: analysis.classificacao?.classe ?? null,
                    confianca: analysis.classificacao?.confianca ?? null,
                    createdAt: analysis.createdAt, // nome do contrato comum com a API JS
                    latitude: localizacao.latitude,
                    longitude: localizacao.longitude,
                    precisao: localizacao.precisao
                }]
            }),
            total: count,
            page: 1,
            limit: MAP_LIMIT
        }
    }
}

export default new AnalysisService()