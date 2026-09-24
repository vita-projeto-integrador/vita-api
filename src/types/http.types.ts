/**
    Contrato HTTP: molde para objeto de resposta HTTP
    @param {boolean} success indica sucesso ou erro
    @param {string} message texto que acompanha resposta
    @param {T} data dado de qualquer tipo 
*/
interface ApiResponse<T = unknown> {
    success: boolean
    message: string
    data?: T // recebe o tipo passado em <T> (generics); se não informado T = unknown  
}

/**
    Contrato HTTP: molde para lista de dados paginados
    @param {T} items array com dados de qualquer tipo
    @param {number} total quantidade total de registros
    @param {number} page numero da pagina requisitada
    @param {number} limit quantidade máxima de dados por página
*/
interface PaginatedData<T> {
    items: T[]
    total: number
    page: number
    limit: number
}

export { ApiResponse, PaginatedData }