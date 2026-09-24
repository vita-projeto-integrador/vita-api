export default interface RedisError extends Error {
    code?: string
}