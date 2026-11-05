// transforma valores vazios em undefined
export const emptyToUndefined = (value: unknown) => {
    if (typeof value === 'string' && value.trim() === '') {
        return undefined
    }
    return value
}

// transforma valores vazios em null (atualização: campo vazio = apagar o valor)
export const emptyToNull = (value: unknown) => {
    if (typeof value === 'string' && value.trim() === '') {
        return null
    }
    return value
}
