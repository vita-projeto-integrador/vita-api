const URL_WEB = process.env.URL_WEB
const URL_EXPO_MOBILE = process.env.URL_EXPO_WEB
const URL_EXPO_METRO = process.env.URL_EXPO_METRO

// origens permitidas para requisições
const allowedOrigins = [
    URL_WEB,
    URL_EXPO_MOBILE,
    URL_EXPO_METRO
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