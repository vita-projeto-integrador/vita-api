import jwt, { type SignOptions } from 'jsonwebtoken';
import type { TokenPayload } from '../types/token.types.js';
import { env } from '../config/env.config.js'

const { auth } = env

function getJwtSecret(): string {
    const secret = auth.secret;

    if (!secret) {
        throw new Error('JWT_SECRET não definido no .env');
    }

    return secret;
}

const JWT_SECRET = getJwtSecret();
const expiresIn = (auth.expiresIn ?? '7d') as SignOptions['expiresIn'];

export function generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
}