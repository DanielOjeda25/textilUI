export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number
) {
  let t: ReturnType<typeof setTimeout> | undefined
  return (...args: Parameters<T>) => {
    if (t !== undefined) clearTimeout(t)
    t = setTimeout(() => {
      fn(...args)
    }, wait)
  }
}
