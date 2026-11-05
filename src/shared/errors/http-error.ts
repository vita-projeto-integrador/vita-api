import AppError from './app-error.js'

interface HttpErrorInfo {
    message: string,
    status: number
}

// formato dos erros criados pelo pacote http-errors (body-parser, router do express)
interface HttpErrorLike extends Error {
    status: number,
    expose: boolean,
    type?: string
}

// tipos de erro do body-parser (express.json)
const HTTP_ERRORS: Partial<Record<string, HttpErrorInfo>> = {
    'entity.parse.failed': {
        message: 'JSON malformado',
        status: 400
    },
    'entity.too.large': {
        message: 'Corpo da requisição muito grande',
        status: 413
    },
    'encoding.unsupported': {
        message: 'Codificação do corpo não suportada',
        status: 415
    },
    'charset.unsupported': {
        message: 'Charset do corpo não suportado',
        status: 415
    }
}

// mensagem default para erros 4xx não mapeados
const FALLBACK_MESSAGE = 'Requisição inválida'

// reconhece erros no formato do http-errors
function isHttpError(error: unknown): error is HttpErrorLike {
    return error instanceof Error
        && 'status' in error && typeof error.status === 'number'
        && 'expose' in error && typeof error.expose === 'boolean'
}

// traduz erro de cliente (4xx) de bibliotecas em AppError
// retorna null para qualquer outro erro (o middleware trata como bug)
export function mapHttpError(error: unknown): AppError | null {
    if (!isHttpError(error)) return null

    // apenas erros de cliente seguros para expor
    const isClientError = error.status >= 400 && error.status < 500
    if (!isClientError || !error.expose) return null

    const known = error.type ? HTTP_ERRORS[error.type] : undefined

    // nunca repassa error.message nem error.body ao cliente (body pode conter senha)
    return new AppError(
        known?.status ?? error.status,
        known?.message ?? FALLBACK_MESSAGE,
        { cause: error }
    )
}