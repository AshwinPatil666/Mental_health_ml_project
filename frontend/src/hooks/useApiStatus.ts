import { useCallback, useEffect, useState } from 'react'
import { checkHealth } from '../services/api'

export type ApiStatus = 'checking' | 'online' | 'offline'

export function useApiStatus(intervalMs = 30_000) {
  const [status, setStatus] = useState<ApiStatus>('checking')

  const refresh = useCallback(async () => {
    setStatus((s) => (s === 'online' ? s : 'checking'))
    setStatus((await checkHealth()) ? 'online' : 'offline')
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
    const id = setInterval(() => void refresh(), intervalMs)
    return () => clearInterval(id)
  }, [refresh, intervalMs])

  return { status, refresh }
}
