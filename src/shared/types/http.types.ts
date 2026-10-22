// Tipo para detalhes de um erro (AppError.detail)
type ErrorDetail = string | Record<string, unknown>

// Contrato HTTP: molde para objeto de resposta HTTP de sucesso
interface SuccessResponse<T = unknown> {
    success: true
    message: string
    data?: T // recebe o tipo passado em <T> (generics); se não informado T = unknown  
}

// Contrato HTTP: molde para objeto de resposta HTTP de erro
interface ErrorResponse {
    success: false
    message: string
    detail?: ErrorDetail
}

type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse

// Contrato HTTP: molde para lista de dados paginados
interface PaginatedData<T> {
    items: T[]
    total: number
    page: number
    limit: number
}

export { ApiResponse, PaginatedData, SuccessResponse, ErrorResponse, ErrorDetail }