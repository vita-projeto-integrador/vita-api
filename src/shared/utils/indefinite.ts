// transforma valores vazios em undefined
export const emptyToUndefined = (value: unknown) => {
    if (typeof value === 'string' && value.trim() === "") {
        return undefined;
    }
    return value
}