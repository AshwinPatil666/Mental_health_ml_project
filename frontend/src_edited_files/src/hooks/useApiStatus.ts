import { useCallback, useEffect, useRef, useState } from 'react'
import { checkHealth } from '../services/api'

export type ApiStatus = 'checking' | 'online' | 'offline'

export function useApiStatus(intervalMs = 60_000) {
  const [status, setStatus] = useState<ApiStatus>('checking')
  const mounted = useRef(true)

  const refresh = useCallback(async () => {
    setStatus((s) => (s === 'online' ? s : 'checking'))
    const ok = await checkHealth()
    if (mounted.current) setStatus(ok ? 'online' : 'offline')
  }, [])

  useEffect(() => {
    mounted.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
    // Skip polling while the tab is hidden: it only wakes the server for nobody.
    const id = setInterval(() => {
      if (!document.hidden) void refresh()
    }, intervalMs)
    return () => {
      mounted.current = false
      clearInterval(id)
    }
  }, [refresh, intervalMs])

  return { status, refresh }
}
