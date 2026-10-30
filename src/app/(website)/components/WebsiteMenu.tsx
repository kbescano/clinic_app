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
import { useClinic } from './ClinicContext'

export default function WebsiteMenu() {
  const { href } = useClinic()
  const navItems: FloatingNavItem[] = [
    { name: 'Home', href: href(), icon: HomeIcon, activeIcon: HomeSolid },
    { name: 'Services', href: href('/services'), icon: SparklesIcon, activeIcon: SparklesSolid },
    { name: 'Book', href: href('/booking'), icon: CalendarDaysIcon, activeIcon: CalendarDaysSolid },
    {
      name: 'Visits',
      href: href('/appointments'),
      icon: ClipboardDocumentListIcon,
      activeIcon: ClipboardListSolid,
    },
  ]
  return <FloatingNav navItems={navItems} />
}
