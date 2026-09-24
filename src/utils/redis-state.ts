import { RedisStatus } from "ioredis"

let isRedisConnected: RedisStatus = 'wait'

const setRedisState = (status: RedisStatus) => {
    isRedisConnected = status
}

const getRedisState = (): RedisStatus => {
    return isRedisConnected
}

export { setRedisState, getRedisState }