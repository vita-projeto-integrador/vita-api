/* 
    gerencia o estado de conexão do Redis com a aplicação
    consultado pela rota de health check
*/

let isRedisConnected = false

const setRedisState = (status) => {
    isRedisConnected = status
}

const getRedisState = () => {
    return isRedisConnected
}

export {setRedisState, getRedisState}