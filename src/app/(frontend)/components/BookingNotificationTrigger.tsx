'use client'

import { useEffect, useRef } from 'react'
import { useNotification } from '../components/NotificationContext'

export default function BookingNotificationTrigger() {
  const { refresh } = useNotification()
  const hasTriggered = useRef(false)

  useEffect(() => {
    if (!hasTriggered.current) {
      // Re-fetch from DB to get the booking we just finished
      refresh()
      hasTriggered.current = true
    }
  }, [refresh])

  return null
}
