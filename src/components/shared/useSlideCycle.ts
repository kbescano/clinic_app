import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Rotates through `count` slides, holding each for `dwellMs`, and only advances to a slide whose
 * media has reported ready (a slow clip is waited for; one that never loads is skipped).
 * Flags live in refs so clearing "dwell done" and changing slide happen in the same step.
 */
export function useSlideCycle(count: number, dwellMs: number, paused: boolean) {
  const [current, setCurrent] = useState(0)
  const ready = useRef<boolean[]>(Array.from({ length: count }, () => false))
  const dwellDone = useRef(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    dwellDone.current = false
    if (paused) return
    const timer = window.setTimeout(() => {
      dwellDone.current = true
      setTick((t) => t + 1)
    }, dwellMs)
    return () => window.clearTimeout(timer)
  }, [current, paused, dwellMs])

  useEffect(() => {
    if (!dwellDone.current) return
    for (let step = 1; step < count; step++) {
      const index = (current + step) % count
      if (ready.current[index]) {
        dwellDone.current = false
        setCurrent(index)
        return
      }
    }
  }, [tick, current, count])

  const markReady = useCallback((index: number) => {
    if (ready.current[index]) return
    ready.current[index] = true
    setTick((t) => t + 1)
  }, [])

  return { current, setCurrent, markReady }
}

/** True while the browser tab is hidden (no point running timers or video then). */
export function useDocumentHidden() {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    const sync = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])
  return hidden
}
