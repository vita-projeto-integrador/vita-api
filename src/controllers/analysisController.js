import analysisService from "../services/analysisService.js"
import imagesService from "../services/imagesService.js"
import classificationService from "../services/classificationService.js"
import APIResponse from '../utils/apiResponse.js'
import AppError from '../utils/appError.js'
import validator from 'validator'

class AnalysisController {
    // inicia análise de fotos
    async initAnalysis(req, res, next) {
        try {
            const loggedUser = req.loggedUser
            const userId = loggedUser.id
            const files = req.files

            if (!userId) {
                throw new AppError('Usuário não autenticado', 401)
            }

            if (!files || files.length === 0) {
                throw new AppError('Nenhuma imagem enviada', 400)
            }

            // retorna análise 'pendente', dispara fila de processamento paralela
            const result = await analysisService.create(userId, files)

            if (result.queued) {
                return new APIResponse(res, 'Análise iniciada', 202, result)
            } else {
                return new APIResponse(res, 'Análise salva! Aguardando serviço de processamento estabilizar', 202, result)
            }

        } catch (error) {
            next(error)
        }
    }
    // verifica progresso da análise
    async getPolling(req, res, next) {
        try {
            const analysisId = req.params.id
            const userId = req.loggedUser.id

            if (!analysisId) {
                throw new AppError('Erro ao enviar ID da análise referente', 400)
            }

            // busca só entre as análises do usuário logado
            const analysis = await analysisService.get(analysisId, userId)

            if (!analysis) {
                throw new AppError('Análise não encontrada', 404)
            }

            const result = {
                analysisId: analysis.id,
                status: analysis.status
            }

            // uma mensagem por status (a requisição deu certo mesmo se a análise falhou)
            const messages = {
                pendente: 'A análise aguarda processamento',
                em_fila: 'A análise está na fila',
                classificando: 'A análise está sendo classificada',
                finalizada: 'A análise foi concluída com sucesso',
                cancelada: 'A análise foi cancelada devido a um erro'
            }

            return new APIResponse(res, messages[analysis.status] ?? 'Status desconhecido', 200, result)
        } catch (error) {
            next(error)
        }
    }
    // lista análises do usuário
    async getAllAnalysis(req, res, next) {
        try {
            const loggedUser = req.loggedUser
            const userId = loggedUser.id

            // requer número da página (inteiro a partir de 1)
            const page = req.query.page || '1'

            if (!validator.isInt(String(page), { min: 1 })) {
                throw new AppError('Página inválida', 400)
            }

            // período opcional: from e to juntos, em ISO 8601
            const { from, to } = req.query
            const isValidDate = (value) => typeof value === 'string' && validator.isISO8601(value)

            if ((from || to) && !(isValidDate(from) && isValidDate(to))) {
                throw new AppError('Período inválido: envie from e to em ISO 8601', 400)
            }

            const analysisList = await analysisService.getAll(
                userId,
                Number(page),
                from ? new Date(from) : null,
                to ? new Date(to) : null
            )

            const result = analysisList

            return new APIResponse(res, 'Listagem de Análises realizada com sucesso', 200, result)
        } catch (error) {
            next(error)
        }
    }
    // consulta relatório completo de uma análise
    async getAnalysisDetails(req, res, next) {
        try {
            const analysisId = req.params.id
            const userId = req.loggedUser.id

            const analysisDetails = await analysisService.getDetails(analysisId, userId)

            const result = analysisDetails

            return new APIResponse(res, 'Relatório da Análise gerado com sucesso', 200, result)

        } catch (error) {
            next(error)
        }
    }
}

export default new AnalysisController()