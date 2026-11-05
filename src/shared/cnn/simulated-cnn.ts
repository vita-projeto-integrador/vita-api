import { type Sharp } from 'sharp'
import { setTimeout as sleep } from 'node:timers/promises'
import { normalize, toRgbPixels } from '../image/pipelines.js'
import type { CnnClassifier, CnnPrediction } from '../types/cnn.types.js'

// parâmetros da simulação num lugar só
const SIMULATION = {
    size: 224,
    darkLuminance: 60, // abaixo disso o pixel conta como possível lesão
    saturationDensity: 2, // 2% de pixels escuros = probabilidade 1
    threshold: 0.8, // score >= limiar → infectado
    delayMs: 5000, // latência artificial de uma inferência real
} as const

const WHITE = { r: 255, g: 255, b: 255 }

const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length

// data augmentation: 4 variações de cada imagem
function augment(buffer: Buffer): Sharp[] {
    const base = () => normalize(buffer).resize(SIMULATION.size, SIMULATION.size)
    return [
        base(),
        base().flip(),
        base().modulate({ hue: 10, brightness: 0.9 }),
        base().rotate(45, { background: WHITE }), // cantos brancos, não pretos
    ]
}

// fração de pixels escuros (luminância BT.601)
function darkRatio(data: Buffer, channels: number): number {
    let dark = 0
    for (let i = 0; i < data.length; i += channels) {
        const luminance = 0.299 * data.readUInt8(i) + 0.587 * data.readUInt8(i + 1) + 0.114 * data.readUInt8(i + 2)
        if (luminance < SIMULATION.darkLuminance) dark++
    }
    return dark / (data.length / channels)
}

// score de uma imagem = média das variações (ensemble averaging)
async function scoreImage(buffer: Buffer): Promise<number> {
    const scores = await Promise.all(
        augment(buffer).map(async (variation) => {
            const { data, info } = await toRgbPixels(variation)
            const densityPercent = darkRatio(data, info.channels) * 100
            return Math.min(densityPercent / SIMULATION.saturationDensity, 1)
        }),
    )
    return mean(scores)
}

class SimulatedCnn implements CnnClassifier {
    async classify(images: Buffer[]): Promise<CnnPrediction> {
        if (images.length === 0) throw new Error('Nenhuma imagem para classificar')

        const scores: number[] = []
        for (const image of images) {
            scores.push(await scoreImage(image)) // sequencial: limita CPU e memória
        }

        const score = mean(scores)
        await sleep(SIMULATION.delayMs)

        const infectado = score >= SIMULATION.threshold
        return {
            classe: infectado ? 'infectado' : 'saudavel',
            confianca: infectado ? score : 1 - score, // probabilidade complementar
            modelo: 'simulacao-sharp',
            versao: '1.0.0',
        }
    }
}

export default new SimulatedCnn()
