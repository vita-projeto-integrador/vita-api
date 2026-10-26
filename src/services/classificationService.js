import Classificacao from '../models/Classificacao.js'
import Classificacao from '../models/Classificacao.js'
import AppError from '../utils/appError.js'

class ClassificationService {
    async create(data) {
        try {
            if (!data) {
                throw new AppError('Erro ao enviar dados da classificação', 400)
            }
            const classification = await Classificacao.create(data)
            return {
                id: classification.id,
                preDiagnosis: classification.classe,
                confidence: classification.confianca
            }
        } catch (error) {
            // registra o erro original antes de trocá-lo por um AppError genérico
            console.error('>> [ClassificationService] Erro ao salvar classificação: ', error)
            throw new AppError('Não foi possível salvar a classificação: erro interno do servidor', 500)
        }
    }
    async getByAnalysis(analysisId) {
        if (!analysisId) {
            throw new AppError('Erro ao enviar ID da análise referente', 400)
        }
        const classification = await Classificacao.findAll({
            where: {
                id_analise: analysisId
            }
        })
        return classification
    }
    async getAll() {
        const classificationList = await Classificacao.findAll({
            order: [['createdAt', 'DESC']]
        })
        return classificationList
    }
}

export default new ClassificationService()