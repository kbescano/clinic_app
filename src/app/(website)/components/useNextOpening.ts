'use client'

import { useEffect, useState } from 'react'
import type { ClinicSlug } from '@/lib/clinics'

export interface NextSlot {
  dayLabel: string
  timeLabel: string
}

/** The clinic's earliest bookable slot. undefined while loading, null when nothing is free or the lookup fails. */
export function useNextOpening(clinic: ClinicSlug) {
  const [slot, setSlot] = useState<NextSlot | null | undefined>(undefined)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/availability/next?clinic=${clinic}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then(setSlot)
      .catch((error) => {
        if (error.name !== 'AbortError') setSlot(null)
      })
    return () => controller.abort()
  }, [clinic])

  return slot
}
