import { ConnectionAcquireTimeoutError, ConnectionError, DatabaseError } from 'sequelize'
import type { MySqlError } from './mysql-error.js'

/*
    1. mysql2 gera erro com código
    2. sequelize embrulha erro em ConnectionError/DatabaseError na propriedade 'original'
    3. mapeia/traduz error.original.code
*/

// mapeia erros mysql -> string
// Partial: para códigos não mapeados que retornam undefined
const ERROR_MESSAGES: Partial<Record<string, string>> = {
    // banco e permissões
    ER_BAD_DB_ERROR: 'Banco de dados não encontrado',
    ER_ACCESS_DENIED_ERROR: 'Acesso negado: usuário ou senha inválidos',
    ER_DBACCESS_DENIED_ERROR: 'Acesso negado: usuário sem permissão neste banco',
    ER_TOO_MANY_USER_CONNECTIONS: 'Limite de conexões do usuário atingido',
    ER_CON_COUNT_ERROR: 'Limite de conexões do servidor atingido',
    ER_SERVER_ISNT_AVAILABLE: 'Servidor MySQL não disponível',

    // rede
    ECONNREFUSED: 'Serviço MySQL indisponível nesse endereço/porta',
    ENOTFOUND: 'Não foi possível resolver o nome do servidor',
    EHOSTUNREACH: 'Servidor inalcançável',
    ETIMEDOUT: 'Timeout de conexão',
    ECONNRESET: 'Conexão resetada pelo servidor',
    PROTOCOL_CONNECTION_LOST: 'Conexão perdida com o servidor',
}

// retorna código de erro do mysql ou undefined
export function getMysqlErrorCode(error: unknown): string | undefined {
    if (error instanceof ConnectionError || error instanceof DatabaseError) {
        const original = error.original as MySqlError | undefined
        return original?.code
    }
    return undefined
}

// traduz erro de banco em mensagem legível, não loga nem relança
export function getDbErrorMessage(error: unknown): string {
    // caso especial (apenas sequelize, sem mysql): todas as conexões do pool ocupadas
    if (error instanceof ConnectionAcquireTimeoutError) {
        return 'Nenhuma conexão disponível no pool (timeout de aquisição)'
    }

    const code = getMysqlErrorCode(error)
    const known = code ? ERROR_MESSAGES[code] : undefined

    if (known) return known // código mapeado
    if (code) return `Erro MySQL não mapeado (${code})` // código não mapeado
    if (error instanceof Error) return error.message // erro comum
    return 'Erro desconhecido' // desconhecido
}