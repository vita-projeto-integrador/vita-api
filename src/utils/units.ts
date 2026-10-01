export const KB = 1024
export const MB = 1024 * KB

export function formatBytes(bytes: number): string {
  if (bytes >= MB) return `${Number((bytes / MB).toFixed(1))} MB`
  if (bytes >= KB) return `${Number((bytes / KB).toFixed(1))} KB`
  return `${bytes} B`
}