import { useState } from 'react'

export function useAppStore() {
  const [ready, setReady] = useState(false)
  return { ready, setReady }
}
