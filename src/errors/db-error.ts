import { ConnectionAcquireTimeoutError, ConnectionError, DatabaseError } from 'sequelize'

/*
    1. pg gera erro com código
    2. sequelize embrulha erro em ConnectionError/DatabaseError na propriedade 'original'
    3. mapeia/traduz error.original.code
*/

type DriverError = { code?: string }

// mapeia erros SQLSTATE + messages -> string
// Partial: para códigos não mapeados que retornam undefined
const ERROR_MESSAGES: Partial<Record<string, string>> = {
    // autenticação e permissões
    '28P01': 'Acesso negado: senha inválida',                          // invalid_password
    '28000': 'Acesso negado: usuário inexistente ou bloqueado pelo pg_hba.conf', // invalid_authorization_specification
    '42501': 'Acesso negado: usuário sem permissão neste banco',       // insufficient_privilege

    // banco e extensões
    '3D000': 'Banco de dados não encontrado',                          // invalid_catalog_name
    '3F000': 'Schema não encontrado',                                  // invalid_schema_name
    '42883': 'Função não encontrada (extensão PostGIS instalada neste banco?)', // undefined_function

    // disponibilidade do servidor
    '53300': 'Limite de conexões do servidor atingido',                // too_many_connections
    '57P03': 'Servidor Postgres iniciando, encerrando ou em recuperação', // cannot_connect_now
    '57P01': 'Conexão encerrada pelo administrador do banco',          // admin_shutdown
    '57014': 'Consulta cancelada por timeout',                         // query_canceled

    // rede
    ECONNREFUSED: 'Serviço do Postgres indisponível nesse endereço/porta',
    ENOTFOUND: 'Não foi possível resolver o nome do servidor',
    EHOSTUNREACH: 'Servidor inalcançável',
    ETIMEDOUT: 'Timeout de conexão',
    ECONNRESET: 'Conexão resetada pelo servidor',
    PROTOCOL_CONNECTION_LOST: 'Conexão perdida com o servidor',

    // TLS (Node), relevantes agora que rejectUnauthorized é true
    SELF_SIGNED_CERT_IN_CHAIN: 'Certificado do servidor não confiável (informe a CA em DB_SSL_CA)',
    DEPTH_ZERO_SELF_SIGNED_CERT: 'Certificado autoassinado no servidor (informe a CA em DB_SSL_CA)',
    UNABLE_TO_VERIFY_LEAF_SIGNATURE: 'Não foi possível validar a cadeia do certificado',
    ERR_TLS_CERT_ALTNAME_INVALID: 'Certificado não corresponde ao host (DB_HOST)',
}

// retorna código de erro do pg ou undefined
export function getDbErrorCode(error: unknown): string | undefined {
    if (error instanceof ConnectionError || error instanceof DatabaseError) {
        const original = error.original as DriverError
        return original?.code
    }
    return undefined
}

// traduz erro de banco em mensagem legível, não loga nem relança
export function getDbErrorMessage(error: unknown): string {
    // caso especial (apenas sequelize, sem pg): todas as conexões do pool ocupadas
    if (error instanceof ConnectionAcquireTimeoutError) {
        return 'Nenhuma conexão disponível no pool (timeout de aquisição)'
    }

    const code = getDbErrorCode(error)
    const known = code ? ERROR_MESSAGES[code] : undefined

    if (known) return known // código mapeado
    if (code) return `Erro de banco não mapeado (${code})` // código não mapeado
    if (error instanceof Error) return error.message // erro comum
    return 'Erro desconhecido' // desconhecido
}