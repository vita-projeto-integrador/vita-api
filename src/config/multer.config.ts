import multer, { Options } from 'multer'
import { MB, KB } from '../utils/units.js'
import type { MimeTypes } from '../types/multer.types.js'
import { Request } from 'express'

function createMulterPolicy(allowedMimeTypes: MimeTypes[], limits: Options['limits']) {
    const storage: Options['storage'] = multer.memoryStorage()
    const mimeList = allowedMimeTypes.map((type) => type.mime)
    const fileFilter: Options['fileFilter'] = (_req, file, cb) => {
        // validação barata do mimetype declarado pelo cliente
        if (mimeList.includes(file.mimetype.toLocaleLowerCase())) cb(null, true)
        else cb(new Error('INVALID_MIME_TYPE'))
    }
}