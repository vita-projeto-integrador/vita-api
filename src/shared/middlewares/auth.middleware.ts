import type { NextFunction, Request, Response } from 'express';
import AppError from '../errors/app-error.js';
import { verifyToken } from '../utils/jwt.js';
import { Usuario } from '../models/usuario.model.js'
import type { TokenPayload } from '../types/token.types.js';

export async function authMiddleware(
    request: Request,
    _response: Response,
    next: NextFunction,
) {
    try {
        const authHeader = request.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError(401, 'Token não fornecido')
        }

        let payload: TokenPayload

        try {
            payload = verifyToken(authHeader.split(' ')[1])
        } catch (error) {
            throw new AppError(401, 'Token inválido ou expirado')
        }

        const user = await Usuario.findOne({
            where: {
                id: payload.id
            }
        })

        if (!user) {
            throw new AppError(401, 'Usuário não encontrado')
        }

        request.user = payload

        next()
        
    } catch (error) {
        next(error);
    }
}