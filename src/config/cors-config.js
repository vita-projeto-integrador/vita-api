// origens permitidas para requisições
const allowedOrigins = [
    'http://localhost:3000'
]

const corsOptions = {
    origin: (origin, callback) => {
        // permite requisições sem origin, como em mobile apps ou insomnia
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error('Acesso negado pelo CORS'))
            console.error('>> [CORS] Acesso negado pelo CORS')
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionSuccessStatus: 200
}

export default corsOptions