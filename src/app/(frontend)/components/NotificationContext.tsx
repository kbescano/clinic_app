'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getLatestActivity } from '../booking/actions'

export interface ApptNotification {
  id: string
  bookerName: string
  phone: string
  service: string
  scheduleDate: string
  timestamp: string
}

interface NotificationContextType {
  notifications: ApptNotification[]
  unreadCount: number
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  refresh: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<ApptNotification[]>([])
  const [lastSeenId, setLastSeenId] = useState<string | null>(null)

  // 1. Define fetchActivity first with useCallback
  const fetchActivity = useCallback(async () => {
    try {
      const data = await getLatestActivity()
      setNotifications(data)
    } catch (error) {
      console.error('Atelier Registry Sync Error:', error)
    }
  }, [])

  // 2. Include fetchActivity in the dependency array
  useEffect(() => {
    const saved = localStorage.getItem('atelier_last_seen_id')
    if (saved) setLastSeenId(saved)

    fetchActivity()
  }, [fetchActivity])

  const topId = notifications[0]?.id || null
  const unreadCount = topId && topId !== lastSeenId ? 1 : 0

  const onOpen = useCallback(() => {
    if (topId) {
      setLastSeenId(topId)
      localStorage.setItem('atelier_last_seen_id', topId)
    }
    setIsOpen(true)
  }, [topId])

  const onClose = useCallback(() => setIsOpen(false), [])

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, isOpen, onOpen, onClose, refresh: fetchActivity }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotification must be used within NotificationProvider')
  return context
}
