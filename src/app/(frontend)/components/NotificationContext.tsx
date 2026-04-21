'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getLatestActivity } from '../booking/actions' // Adjust path

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
  refresh: () => void // New refresh trigger
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<ApptNotification[]>([])
  const [lastSeenId, setLastSeenId] = useState<string | null>(null)

  // 1. FETCH LOGIC
  const fetchActivity = useCallback(async () => {
    const data = await getLatestActivity()
    setNotifications(data)
  }, [])

  useEffect(() => {
    fetchActivity()
  }, [fetchActivity])

  // 2. UNREAD LOGIC (Session-based: Badge shows if latest ID is new to this session)
  const unreadCount = notifications.length > 0 && notifications[0].id !== lastSeenId ? 1 : 0

  const onOpen = useCallback(() => {
    setIsOpen(true)
    if (notifications.length > 0) {
      setLastSeenId(notifications[0].id) // Clear badge by marking the latest ID as "seen"
    }
  }, [notifications])

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
