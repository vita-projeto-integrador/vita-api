class HealthService {
    public async healthCheck(): Promise<Object> {
        try {
            return {
                api: 'online',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
            }
        } catch (error) {
            console.error(error)
            return {
                api: 'offline',
            }
        }
    }
}

export default new HealthService()