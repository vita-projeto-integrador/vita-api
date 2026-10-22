import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import { appRoutes } from './routes/index.js'
import { errorHandler } from './shared/middlewares/error.middleware.js'
import { notFoundHandler } from './shared/middlewares/not-found.middleware.js'
import corsOptions from './shared/config/cors.config.js'

// instancia do express
const app: Application = express()

// configs basicas
app.use(cors(corsOptions))
app.use(express.json())

// rotas da API
app.use('/api', appRoutes)

app.get('/', (req: Request, res: Response) => {
    res.redirect('/api/health')
})

// middleware de rota não encontrada
app.use(notFoundHandler)

// middleware de erro global
app.use(errorHandler)

export default app