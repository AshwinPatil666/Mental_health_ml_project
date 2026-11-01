import { useEffect, useState } from 'react'

interface Props {
  value: number
  decimals?: number
  duration?: number
  className?: string
}

/** Counts from 0 up to the real value. Always ends on exactly `value`. */
export default function CountUp({ value, decimals = 2, duration = 1200, className }: Props) {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(value)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setShown(t >= 1 ? value : value * (1 - Math.pow(1 - t, 3)))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return <span className={className}>{shown.toFixed(decimals)}</span>
}
