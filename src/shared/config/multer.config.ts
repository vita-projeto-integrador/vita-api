import type { UploadPolicyConfig } from '../types/multer.types.js'
import { MB } from '../utils/units.js'

// políticas
const analysisPolicy: UploadPolicyConfig = {
    name: 'analysisPolicy',
    field: 'images',
    formats: ['png', 'webp', 'jpeg'],
    limits: {
        fileSize: 5 * MB,
        files: 4
    }
}

export { analysisPolicy }