import type { Request, Response } from 'express'
import { pipeline } from 'node:stream/promises'
import FileService from './file.service.js'
import type { FileKeyParamsDTO, SignedUrlQueryDTO } from './dtos/file.dto.js'

// cliente fechou a conexão no meio do envio (ex.: trocou de tela): não é erro da API
function isClientAbort(error: unknown): boolean {
    return error instanceof Error && 'code' in error && error.code === 'ERR_STREAM_PREMATURE_CLOSE'
}

class FileController {
    read = async (req: Request, res: Response) => {
        const { key } = req.validated?.params as FileKeyParamsDTO
        const { expires, signature } = req.validated?.query as SignedUrlQueryDTO

        const file = await FileService.open(key, expires, signature)

        res.status(200).set({
            'Content-Type': file.mime,
            // private: só o navegador guarda; o cache vence junto com a URL
            'Cache-Control': `private, max-age=${file.maxAge}`,
            'X-Content-Type-Options': 'nosniff'
        })

        // resposta binária: não usa AppResponse (o envelope é só para JSON)
        try {
            await pipeline(file.stream, res)
        } catch (error) {
            if (isClientAbort(error)) return
            throw error
        }
    }
}

export default new FileController()