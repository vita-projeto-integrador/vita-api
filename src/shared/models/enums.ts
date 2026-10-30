// analise.status
export const ANALYSIS_STATUSES = ['em_espera', 'processando', 'finalizada', 'falhou'] as const
export type AnalysisStatus = (typeof ANALYSIS_STATUSES)[number]

// usuario.perfil
export const USER_PROFILES = ['produtor', 'estudante', 'outro'] as const
export type UserProfile = (typeof USER_PROFILES)[number]

// classificacao.classe
export const CLASSIFICATION_CLASSES = ['saudavel', 'infectado'] as const
export type ClassificationClass = (typeof CLASSIFICATION_CLASSES)[number]

// imagem.tipo_mime / processada.tipo_mime
export { ALL_FILE_FORMATS, type FileFormat } from "../config/formats.config.js"
