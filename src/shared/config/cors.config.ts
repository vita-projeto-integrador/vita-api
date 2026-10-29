import { env } from './env.config.js'
import { CorsOptions } from 'cors'

// origens permitidas para requisições
const { webUrl, expoUrl } = env.cors
const allowedOrigins = [
    webUrl,
    expoUrl
].filter((url): url is string => Boolean(url))

const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        // permite requisições sem origin, como em mobile apps ou insomnia
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(null, false)
            console.warn(`>> [CORS] Origem recusada: ${origin}`)
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
}

export default corsOptions