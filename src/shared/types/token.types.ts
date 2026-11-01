import type { UserProfile } from '../models/enums.js';

/**
 * Dados do usuário autenticado
 */
export interface TokenPayload {
    id: string
    email: string
    nome: string
    perfil: UserProfile
}