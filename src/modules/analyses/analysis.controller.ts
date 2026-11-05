import type { Request, Response } from 'express'
import AnalysisService from './analysis.service.js'
import { AppResponse } from '../../shared/utils/app-response.js'
import type { MulterFile } from '../../shared/types/multer.types.js'
import type { AnalysisStatus } from '../../shared/models/enums.js'
import type {
    CreateAnalysisBodyDTO,
    AnalysisIdParamsDTO,
    ListAnalysesQueryDTO,
    MapQueryDTO
} from './dtos/analysis.dto.js'

// Record<AnalysisStatus, ...> obriga a escrever uma mensagem para cada status novo
const STATUS_MESSAGES: Record<AnalysisStatus, string> = {
    em_espera: 'A análise aguarda processamento',
    processando: 'A análise está sendo processada',
    finalizada: 'A análise foi concluída',
    falhou: 'A análise falhou após todas as tentativas'
}

class AnalysisController {
    create = async (req: Request, res: Response) => {
        const userId = req.user?.id as string
        const files = req.validated?.files as MulterFile[]
        const data = req.validated?.body as CreateAnalysisBodyDTO

        const result = await AnalysisService.create(userId, files, data)

        const message = result.enfileirada
            ? 'Análise iniciada'
            : 'Análise salva; o processamento começa quando a fila estiver disponível'

        return AppResponse.send(res, 202, message, result)
    }

    list = async (req: Request, res: Response) => {
        const userId = req.user?.id as string
        const query = req.validated?.query as ListAnalysesQueryDTO

        const result = await AnalysisService.list(userId, query)

        return AppResponse.send(res, 200, 'Análises listadas com sucesso', result)
    }

    getDetails = async (req: Request, res: Response) => {
        const userId = req.user?.id as string
        const { id } = req.validated?.params as AnalysisIdParamsDTO

        const result = await AnalysisService.getDetails(userId, id)

        return AppResponse.send(res, 200, 'Relatório da análise gerado com sucesso', result)
    }

    getStatus = async (req: Request, res: Response) => {
        const userId = req.user?.id as string
        const { id } = req.validated?.params as AnalysisIdParamsDTO

        const result = await AnalysisService.getStatus(userId, id)

        return AppResponse.send(res, 200, STATUS_MESSAGES[result.status as AnalysisStatus], result)
    }

    getMap = async (req: Request, res: Response) => {
        const userId = req.user?.id as string
        const query = req.validated?.query as MapQueryDTO

        const result = await AnalysisService.getMap(userId, query)

        return AppResponse.send(res, 200, 'Análises do mapa', result)
    }
}

export default new AnalysisController()