export const KB = 1024
export const MB = 1024 * KB

export function formatBytes(bytes: number): string {
  if (bytes >= MB) return `${Number((bytes / MB).toFixed(1))} MB`
  if (bytes >= KB) return `${Number((bytes / KB).toFixed(1))} KB`
  return `${bytes} B`
}

export const SECOND = 1000
export const MINUTE = 60 * SECOND
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

export function formatTime(ms: number): string {
  if (ms >= DAY) return `${Number((ms / DAY).toFixed(1))} d`
  if (ms >= HOUR) return `${Number((ms / HOUR).toFixed(1))} h`
  if (ms >= MINUTE) return `${Number((ms / MINUTE).toFixed(1))} min`
  if (ms >= SECOND) return `${Number((ms / SECOND).toFixed(1))} s`
  return `${ms} ms`
}