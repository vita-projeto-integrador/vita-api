import { performance } from 'node:perf_hooks'
import type { Transaction } from 'sequelize'
import { Classificacao } from '../../shared/models/index.model.js'
import cnn from '../../shared/cnn/simulated-cnn.js'
import type { CnnPrediction } from '../../shared/types/cnn.types.js'

export interface ClassificationResult extends CnnPrediction {
    tempoMs: number
}

class ClassificationService {
    // roda a CNN e mede o tempo de inferência
    async run(images: Buffer[]): Promise<ClassificationResult> {
        const start = performance.now()
        const prediction = await cnn.classify(images)
        return { ...prediction, tempoMs: Math.round(performance.now() - start) }
    }

    async create(analysisId: string, result: ClassificationResult, transaction: Transaction) {
        return Classificacao.create(
            {
                id_analise: analysisId,
                classe: result.classe,
                confianca: result.confianca,
                tempo_execucao: result.tempoMs,
                modelo_cnn: result.modelo,
                versao_modelo: result.versao,
            },
            { transaction },
        )
    }

    // formato público da classificação, reutilizado pelo relatório da análise
    toResponse(classificacao: Classificacao) {
        return {
            classe: classificacao.classe,
            confianca: classificacao.confianca,
            tempo_execucao: classificacao.tempo_execucao,
            modelo_cnn: classificacao.modelo_cnn,
            versao_modelo: classificacao.versao_modelo,
            criado_em: classificacao.createdAt,
        }
    }
}

export default new ClassificationService()
