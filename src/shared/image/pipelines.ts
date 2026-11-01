import sharp, { type Sharp } from 'sharp'
const CNN_SIZE = 224
const WHITE = { r: 255, g: 255, b: 255 }

// verifica formato da imagem através dos bytes
export async function detectFormat(buffer: Buffer): Promise<string | undefined> {
    try {
        const { format } = await sharp(buffer).metadata()
        return format
    } catch {
        return undefined // bytes que o Sharp não reconhece como imagem
    }
}

// base comum: orientação EXIF, sem transparência, sRGB
export function normalize(buffer: Buffer): Sharp {
    return sharp(buffer)
        .rotate()                       // aplica a orientação EXIF (fotos de celular)
        .flatten({ background: WHITE }) // transparência vira branco, não preto
        .toColorspace('srgb')
}

// imagens processadas
export async function preprocess(buffer: Buffer): Promise<Buffer> {
    return normalize(buffer)
        .resize(CNN_SIZE, CNN_SIZE, { fit: 'cover', position: 'center' })
        .blur(0.5)                                       // reduz ruído
        .modulate({ brightness: 1.05, saturation: 1.2 }) // contraste e cor
        .webp({ quality: 90 })
        .toBuffer()
}

// pixels crus, sem alpha (o chamador usa info.channels, nunca 3 fixo)
export async function toRgbPixels(image: Sharp) {
    return image
        .removeAlpha()
        .toColorspace('srgb')
        .raw()
        .toBuffer({ resolveWithObject: true })
}