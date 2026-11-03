// traduz os valores da API JS para os do contrato do mapa (os mesmos da API TS)
// na troca para a API TS, este arquivo deixa de existir

// status do contrato -> status gravados pela API JS
export const STATUS_TO_DB = {
    em_espera: ['pendente', 'em_fila'],
    processando: ['classificando'],
    finalizada: ['finalizada'],
    falhou: ['cancelada']
}

// status gravado pela API JS -> status do contrato
export const STATUS_FROM_DB = {
    pendente: 'em_espera',
    em_fila: 'em_espera',
    classificando: 'processando',
    finalizada: 'finalizada',
    cancelada: 'falhou'
}

// classe do contrato <-> classe numérica da API JS (1 = pinta preta)
export const CLASSE_TO_DB = { saudavel: 0, infectado: 1 }
export const CLASSE_FROM_DB = { 0: 'saudavel', 1: 'infectado' }