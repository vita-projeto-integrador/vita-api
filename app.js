import express from 'express'
import cors from 'cors'
import corsOptions from './src/config/cors-config.js'
import healthRoutes from './src/routes/healthRoutes.js'
import userRoutes from './src/routes/userRoutes.js'
import analysisRoutes from './src/routes/analysisRoutes.js'
import errorMiddleware from './src/middlewares/errorMiddleware.js'
import { fileURLToPath } from 'url'
import path from 'path'

const app = express()

// recria _dirname no padrão module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// middleware primário + configurações express
app.use(cors(corsOptions))
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// libera só as imagens enviadas (storage/temp e storage/processed ficam privados)
// a URL continua /storage/uploads/..., igual ao 'caminho' gravado no banco
const uploadsPath = path.resolve(__dirname, 'storage', 'uploads')
app.use('/storage/uploads', express.static(uploadsPath))

// rotas
app.get('/', (req, res) => {
    res.send('Hello, world!')
})
app.use('/', healthRoutes)
app.use('/', userRoutes)
app.use('/', analysisRoutes)

// define middleware como última camada de tratamento de erros
app.use(errorMiddleware)

export default app