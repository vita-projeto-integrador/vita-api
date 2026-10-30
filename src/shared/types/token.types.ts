import type { UserProfile } from '../models/enums.js';

/**
 * Dados do usuário autenticado
 */
export interface TokenPayload {
    id: number
    email: string
    name: string
    profile: UserProfile
}