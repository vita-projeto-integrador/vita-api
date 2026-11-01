import type { ClassificationClass } from '../models/enums.js'

export interface CnnPrediction {
    classe: ClassificationClass
    confianca: number // 0 a 1, confiança na classe prevista
    modelo: string
    versao: string
}

export interface CnnClassifier {
    classify(images: Buffer[]): Promise<CnnPrediction>
}