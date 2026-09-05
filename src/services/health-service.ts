import connection from "../config/sequelize-config.js"
import AppError from "../errors/app-error.js"

class HealthService {
    public async healthCheck(): Promise<Object> {
        const mysqlStatus = await this.checkDatabase()
        return {
            api: 'online',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            db: {
                mysql: mysqlStatus ? 'online' : 'offline'
            }
        }
    }
    public async checkDatabase(): Promise<Boolean> {
        try {
            await connection.authenticate()
            return true
        } catch (error) {
            return false
        }
    }
}

export default new HealthService()