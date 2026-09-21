'use client'

import React from 'react'
import {
  HomeIcon,
  SparklesIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeSolid,
  SparklesIcon as SparklesSolid,
  CalendarDaysIcon as CalendarDaysSolid,
  ClipboardDocumentListIcon as ClipboardListSolid,
} from '@heroicons/react/24/solid'
import FloatingNav, { type FloatingNavItem } from '@/components/shared/FloatingNav'

const navItems: FloatingNavItem[] = [
  { name: 'Home', href: '/', icon: HomeIcon, activeIcon: HomeSolid },
  { name: 'Services', href: '/services', icon: SparklesIcon, activeIcon: SparklesSolid },
  { name: 'Book', href: '/booking', icon: CalendarDaysIcon, activeIcon: CalendarDaysSolid },
  {
    name: 'Visits',
    href: '/appointments',
    icon: ClipboardDocumentListIcon,
    activeIcon: ClipboardListSolid,
  },
]

export default function WebsiteMenu() {
  return <FloatingNav navItems={navItems} />
}
