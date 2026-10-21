/*
    Declaração de tipos globais
    Personaliza interfaces nativas do Express  
*/
declare global {
    namespace Express {
        interface Request {
            // userId?: string
            // userRole?: 'admin' | 'user'
            user?: {
                id: number,
                name: string,
                email: string
            }
        }
    }
}

export { } // força TS a reconhecer o arquivo como module ES