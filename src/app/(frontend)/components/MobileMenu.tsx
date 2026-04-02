'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

export default function MobileMenu() {
  const pathname = usePathname()

  // Navigation config matches Instagram's structure
  const navItems = [
    { name: 'Home', href: '/', icon: HomeIcon, activeIcon: HomeSolid },
    { name: 'Dashboard', href: '/dashboard', icon: CalendarIcon, activeIcon: CalendarSolid },
    {
      name: 'History',
      href: '/medical-history',
      icon: ClipboardDocumentIcon,
      activeIcon: ClipboardSolid,
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: ChartBarIcon,
      activeIcon: ChartBarSolid,
    },
    {
      name: 'Admin',
      href: '/admin/manager',
      icon: UserCircleIcon,
      activeIcon: UserCircleSolid,
    },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-gray-100 dark:border-white/15 z-[100] pb-safe shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = isActive ? item.activeIcon : item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-full h-full transition-transform active:scale-90"
            >
              {/* Icon Container */}
              <div className="relative">
                <Icon
                  className={`w-4 h-4 transition-colors duration-200 ${isActive ? 'text-[#251101] dark:text-white' : 'text-gray-400'}`}
                />
              </div>

              {/* Label */}
              <span
                className={`text-[6px] mt-1 font-bold uppercase tracking-widest ${isActive ? 'text-[#251101] dark:text-white' : 'text-gray-300'}`}
              >
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
