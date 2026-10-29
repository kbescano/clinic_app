'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

type Target = number | string | HTMLElement
interface ScrollOptions {
  offset?: number
  immediate?: boolean
}

interface SmoothScrollValue {
  /** Scroll to a pixel offset, CSS selector or element. Eased when smooth scrolling is active. */
  scrollTo: (target: Target, options?: ScrollOptions) => void
  /** Reference-counted page scroll lock for modals. Safe to nest. */
  lock: (locked: boolean) => void
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function nativeScrollTo(target: Target, { offset = 0, immediate }: ScrollOptions = {}) {
  let top = 0
  if (typeof target === 'number') {
    top = target
  } else {
    let el: Element | null = null
    try {
      el = typeof target === 'string' ? document.querySelector(target) : target
    } catch {
      // A hash that is not a valid selector: just stay put.
    }
    if (!el) return
    top = el.getBoundingClientRect().top + window.scrollY
  }
  window.scrollTo({ top: top + offset, behavior: immediate || prefersReducedMotion() ? 'auto' : 'smooth' })
}

// Outside the provider (the staff portal) everything falls back to the browser's own scrolling.
const SmoothScrollContext = createContext<SmoothScrollValue>({
  scrollTo: nativeScrollTo,
  lock: (locked) => {
    document.documentElement.style.overflow = locked ? 'hidden' : ''
  },
})

export const useSmoothScroll = () => useContext(SmoothScrollContext)

/** Locks page scroll while `active` is true (modals, drawers). Works with or without smooth scroll. */
export function useScrollLock(active: boolean) {
  const { lock } = useSmoothScroll()
  useEffect(() => {
    if (!active) return
    lock(true)
    return () => lock(false)
  }, [active, lock])
}

/**
 * Inertial wheel scrolling for the public site. It is switched off entirely for visitors who ask
 * the OS for reduced motion, and touch devices keep their native momentum scrolling.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const lenisRef = useRef<Lenis | null>(null)
  const locks = useRef(0)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')

    const start = () => {
      if (lenisRef.current) return
      const instance = new Lenis({ lerp: 0.1, smoothWheel: true, autoRaf: true })
      if (locks.current > 0) instance.stop()
      lenisRef.current = instance
    }
    const stop = () => {
      lenisRef.current?.destroy()
      lenisRef.current = null
    }
    const sync = () => (query.matches ? stop() : start())

    sync()
    query.addEventListener('change', sync)
    return () => {
      query.removeEventListener('change', sync)
      stop()
    }
  }, [])

  const scrollTo = useCallback((target: Target, options: ScrollOptions = {}) => {
    const lenis = lenisRef.current
    if (!lenis) return nativeScrollTo(target, options)
    try {
      lenis.scrollTo(target, { offset: options.offset ?? 0, immediate: options.immediate })
    } catch {
      // Invalid selector: ignore.
    }
  }, [])

  const lock = useCallback((locked: boolean) => {
    locks.current = Math.max(0, locks.current + (locked ? 1 : -1))
    const active = locks.current > 0
    if (lenisRef.current) {
      if (active) lenisRef.current.stop()
      else lenisRef.current.start()
    } else {
      document.documentElement.style.overflow = active ? 'hidden' : ''
    }
  }, [])

  // New page: start at the top, or at the section named in the URL hash. The very first load is
  // left alone so the browser can restore the scroll position after a refresh.
  const firstRun = useRef(true)
  useEffect(() => {
    const hash = window.location.hash
    if (hash.length > 1) scrollTo(hash, { offset: -96, immediate: true })
    else if (!firstRun.current) scrollTo(0, { immediate: true })
    firstRun.current = false
  }, [pathname, scrollTo])

  const value = useMemo(() => ({ scrollTo, lock }), [scrollTo, lock])
  return <SmoothScrollContext.Provider value={value}>{children}</SmoothScrollContext.Provider>
}
