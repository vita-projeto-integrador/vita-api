import type { TokenPayload } from "./token.types.ts"
/*
    Declaração de tipos globais
    Personaliza interfaces nativas do Express  
*/
declare global {
    namespace Express {
        interface Request {
            // userId?: string
            // userRole?: 'admin' | 'user'
            user?: TokenPayload
        }
    }
}

export { } // força TS a reconhecer o arquivo como module ES