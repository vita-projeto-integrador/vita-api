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

/*
    Contrato de armazenamento de arquivos
    - todo adaptador (hoje: local; no futuro: R2) implementa esta interface
    - trabalha só com keys (endereço lógico), nunca com caminhos de disco
    - lança apenas StorageError (nunca AppError/HTTP)
*/
export interface StorageProvider {
  // boot: pastas, limpeza e teste de gravação
  init(): Promise<void>
  // testa se o storage continua gravável
  healthCheck(): Promise<void>
  // grava arquivo (se key já existe, sobrescreve)
  save(key: string, data: Buffer): Promise<void>
  // lê arquivo inteiro na memória (ex.: sharp)
  read(key: string): Promise<Buffer>
  // abre arquivo como stream (ex.: http)
  readStream(key: string): Promise<Readable>
  // verifica se arquivo existe
  exists(key: string): Promise<boolean>
  // lista as keys de todos os arquivos dentro de um prefixo
  list(prefix: string): Promise<string[]>
  // apaga o arquivo (não falha se ele já não existir)
  delete(key: string): Promise<void>
  // apaga todos os arquivos de um prefixo (ex.: uma análise inteira)
  deleteByPrefix(prefix: string): Promise<void>
}