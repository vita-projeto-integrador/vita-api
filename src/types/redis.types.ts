import { RedisStatus } from "ioredis"

// formatação para configs exclusivas de outros clientes
export interface customConfigInterface {
    maxRetriesPerRequest: number | null,
    connectionName: string
}