'use client'

import React from 'react'
import {
  HomeIcon,
  CalendarIcon,
  ChartBarIcon,
  ClipboardDocumentIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeSolid,
  CalendarIcon as CalendarSolid,
  ChartBarIcon as ChartBarSolid,
  ClipboardDocumentIcon as ClipboardSolid,
  UserCircleIcon as UserCircleSolid,
} from '@heroicons/react/24/solid'
import FloatingNav, { type FloatingNavItem } from '@/components/shared/FloatingNav'

const navItems: FloatingNavItem[] = [
  { name: 'Website', href: '/', icon: HomeIcon, activeIcon: HomeSolid },
  { name: 'Dashboard', href: '/dashboard', icon: CalendarIcon, activeIcon: CalendarSolid },
  {
    name: 'History',
    href: '/medical-history',
    icon: ClipboardDocumentIcon,
    activeIcon: ClipboardSolid,
  },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon, activeIcon: ChartBarSolid },
  { name: 'Admin', href: '/admin/manager', icon: UserCircleIcon, activeIcon: UserCircleSolid },
]

export default function PortalMenu() {
  return <FloatingNav navItems={navItems} />
}
