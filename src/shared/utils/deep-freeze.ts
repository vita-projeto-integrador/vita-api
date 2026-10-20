type DeepReadonly<T> = {
  readonly [K in keyof T]: DeepReadonly<T[K]>
}

export function deepFreeze<T>(value: T): DeepReadonly<T> {
    if (value === null || typeof value !== 'object') {
        return value
    }

    if (Object.isFrozen(value)) {
        return value
    }

    Object.freeze(value)

    for (const child of Object.values(value)) {
        deepFreeze(child)
    }

    return value
}