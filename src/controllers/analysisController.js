import analysisService from "../services/analysisService.js"
import imagesService from "../services/imagesService.js"
import classificationService from "../services/classificationService.js"
import APIResponse from '../utils/apiResponse.js'
import AppError from '../utils/appError.js'

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

            if(result.queued){
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

            if (!analysisId) {
                throw new AppError('Erro ao enviar ID da análise referente', 400)
            }

            const analysis = await analysisService.get(analysisId)

            if(!analysis){
                throw new AppError('Nenhuma análise foi encontrada', 404)
            }

            const result = {
                analysisId: analysis.id,
                status: analysis.status
            }

            if (analysis.status === 'pendente') {
                return new APIResponse(res, 'A análise ainda está sendo processada', 200, result)
            } else if (analysis.status === 'cancelada') {
                return new APIResponse(res, 'A análise foi cancelada devido a algum erro', 500, result)
            } else if (analysis.status === 'finalizada') {
                return new APIResponse(res, 'A análise foi concluída com sucesso', 200, result)
            }
        } catch (error) {
            next(error)
        }
    }
    // lista análises do usuário
    async getAllAnalysis(req, res, next) {
        try {
            const loggedUser = req.loggedUser
            const userId = loggedUser.id

            // requer número da página
            const page = req.query.page || 1

            const analysisList = await analysisService.getAll(userId, page)

            const result = analysisList

            return new APIResponse(res, 'Listagem de Análises realizada com sucesso', 200, result)
        } catch (error) {
            next(error)
        }
    }
    // consulta relatório completo de uma análise
    async getAnalysisDetails(req, res, next){
        try {
            const analysisId = req.params.id

            const analysisDetails = await analysisService.getDetails(analysisId)

            const result = analysisDetails

            return new APIResponse(res, 'Relatório da Análise gerado com sucesso', 200, result)

        } catch (error) {
            next(error)
        }
    }
}

export default new AnalysisController()