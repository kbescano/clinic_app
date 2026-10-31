'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

interface PortalDemoValue {
  demo: boolean
  /** Call before any change: in demo mode it explains that nothing is saved and returns true. */
  blockInDemo: () => boolean
}

const PortalDemoContext = createContext<PortalDemoValue>({ demo: false, blockInDemo: () => false })
export const usePortalDemo = () => useContext(PortalDemoContext)

/** Demo sessions are view only; the server refuses changes too, this just says so nicely. */
export function PortalDemoProvider({ demo, children }: { demo: boolean; children: ReactNode }) {
  const [notice, setNotice] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  const blockInDemo = useCallback(() => {
    if (!demo) return false
    setNotice(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setNotice(false), 3200)
    return true
  }, [demo])

  return (
    <PortalDemoContext.Provider value={{ demo, blockInDemo }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[300] flex justify-center px-4 lg:bottom-8">
        {notice && (
          <p className="rounded-full bg-zinc-950 px-5 py-3 text-xs font-semibold text-white shadow-2xl dark:bg-white dark:text-zinc-950">
            Demo mode is view only. Sign in as staff to make changes.
          </p>
        )}
      </div>
    </PortalDemoContext.Provider>
  )
}
