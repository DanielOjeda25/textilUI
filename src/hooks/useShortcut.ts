import { useEffect } from 'react'

export function useShortcut(keys: string[], handler: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const pressed = [
        e.ctrlKey ? 'Ctrl' : '',
        e.shiftKey ? 'Shift' : '',
        e.altKey ? 'Alt' : '',
        e.key,
      ]
        .filter(Boolean)
        .join('+')
      const combo = keys.join('+')
      if (pressed.toLowerCase() === combo.toLowerCase()) handler()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [keys, handler])
}
