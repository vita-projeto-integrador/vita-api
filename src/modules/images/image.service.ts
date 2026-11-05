import type { CreationAttributes, Transaction } from 'sequelize'
import { Imagem } from '../../shared/models/index.model.js'

class ImageService {
    async createMany(rows: CreationAttributes<Imagem>[], transaction: Transaction) {
        return Imagem.bulkCreate(rows, { transaction, validate: true })
    }
}

export default new ImageService()
