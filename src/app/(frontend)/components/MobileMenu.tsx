'use client'

import React, { useState, useEffect } from 'react'
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

export default function NavigationMenu() {
  const pathname = usePathname()

  const [showDesktopMenu, setShowDesktopMenu] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setShowDesktopMenu(true)
      } else if (currentScrollY < lastScrollY) {
        setShowDesktopMenu(false)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const navItems = [
    { name: 'Home', href: '/', icon: HomeIcon, activeIcon: HomeSolid },
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

  return (
    <>
      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-gray-100 dark:border-white/15 z-[9999] pb-safe shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
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
                <div className="relative">
                  <Icon
                    className={`w-4 h-4 transition-colors duration-200 ${isActive ? 'text-[#251101] dark:text-white' : 'text-gray-400'}`}
                  />
                </div>
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

      {/* DESKTOP PREMIUM "DYNAMIC CAPSULE" NAVIGATION */}
      <nav
        className={`hidden lg:flex fixed top-1/2 right-6 -translate-y-1/2 z-[9999] transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          showDesktopMenu
            ? 'opacity-100 translate-x-0 scale-100'
            : 'opacity-0 translate-x-8 scale-95 pointer-events-none'
        }`}
      >
        {/* INCREASED PADDING: p-3 and gap-2 for a perfectly framed fit */}
        <div className="group flex flex-col items-end gap-2 p-2.5 bg-white/40 dark:bg-[#050505]/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-full shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15)] hover:shadow-[0_16px_60px_-15px_rgba(0,0,0,0.2)] transition-all duration-500">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = isActive ? item.activeIcon : item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex items-center justify-end h-12 rounded-full overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-md'
                    : 'text-[#595f72] hover:bg-black dark:hover:bg-zinc-800/80 hover:text-white dark:hover:text-white'
                }`}
              >
                <span
                  className={`font-serif uppercase tracking-[0.25em] text-[9px] whitespace-nowrap overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] 
                  max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:pl-6 group-hover:pr-2`}
                >
                  {item.name}
                </span>

                <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                  <Icon
                    className={`w-[18px] h-[18px] transition-transform duration-500 ${isActive ? 'scale-100' : 'group-hover:scale-110'}`}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
