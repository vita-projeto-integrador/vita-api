import type { Readable } from 'node:stream'

// configuração de storage
export interface StorageConfig {
    driver: 'local'
    root: string // sempre absoluto
    maxUploadBytes: number
    tmpTtlMs: number
    originalRetentionDays: number | null
    purgeDeletedAfterDays: number | null
}

// metadados
export interface StoredObjectInfo {
  key: string
  size: number
  contentType: string
  updatedAt: Date
}

// contrato de armazenamento de arquivos
export interface StorageProvider {
  init(): Promise<void>
  put(key: string, data: Buffer): Promise<StoredObjectInfo>
  getBuffer(key: string): Promise<Buffer>
  getStream(key: string): Promise<{ stream: Readable; info: StoredObjectInfo }>
  stat(key: string): Promise<StoredObjectInfo | null>
  delete(key: string): Promise<void>
  deletePrefix(prefix: string): Promise<number>
  list(prefix: string): AsyncIterable<StoredObjectInfo>
  healthCheck(): Promise<void>
}