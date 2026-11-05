import type { TokenPayload } from "./token.types.ts"
/*
    Declaração de tipos globais
    Personaliza interfaces nativas do Express  
*/
declare global {
    namespace Express {
        interface Request {
            // dados do usuário autenticado
            user?: TokenPayload;
            // requisições validadas pelos schemas zod
            validated?: {
                body?: unknown;
                query?: unknown;
                params?: unknown;
                files?: unknown;
            };
        }
    }
}

export { } // força TS a reconhecer o arquivo como module ES