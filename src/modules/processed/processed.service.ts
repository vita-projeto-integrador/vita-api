import type { CreationAttributes, Transaction } from 'sequelize'
import { Processada } from '../../shared/models/index.model.js'

class ProcessedService {
    async createMany(rows: CreationAttributes<Processada>[], transaction: Transaction) {
        return Processada.bulkCreate(rows, { transaction, validate: true })
    }
}

export default new ProcessedService()