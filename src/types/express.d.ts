/*
    Declaração de tipos globais
    Personaliza interfaces nativas do Express  
*/
declare global {
    namespace Express {
        interface Request {
            userId?: string
            userRole?: 'admin' | 'user'
        }
    }
}

export { } // força TS a reconhecer o arquivo como module ES