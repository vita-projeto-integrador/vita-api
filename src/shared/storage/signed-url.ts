import { createHmac, timingSafeEqual } from 'node:crypto'

/*
    Assinatura das URLs do storage local
    - a URL é a própria autorização (não exige token), por isso expira
    - a assinatura cobre key + expiração: alterar qualquer um invalida a URL
    - só o driver local usa: no R2, o próprio bucket gera e confere as URLs
*/

// assinatura = HMAC-SHA256("key:expires") em base64url (seguro em query string)
export function sign(key: string, expires: number, secret: string): string {
    return createHmac('sha256', secret).update(`${key}:${expires}`).digest('base64url')
}

// compara em tempo constante: não revela em qual byte a assinatura difere
export function isValidSignature(key: string, expires: number, signature: string, secret: string): boolean {
    const expected = Buffer.from(sign(key, expires, secret))
    const received = Buffer.from(signature)
    return expected.length === received.length && timingSafeEqual(expected, received)
}