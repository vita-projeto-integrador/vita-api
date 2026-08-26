import express, { Application, Request, Response } from 'express'
import { appRoutes } from './routes/index.js'
import path from 'node:path'

// instancia do express
const app: Application = express()

// configs basicas
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// serve pasta estática /storage
const storagePath: string = path.resolve(import.meta.dirname, '../storage')
app.use('/storage', express.static(storagePath))

// rotas da API
app.use('/api', appRoutes)

app.get('/api', (req: Request, res: Response) => {
    res.send('Hello, world!')
})

export default app