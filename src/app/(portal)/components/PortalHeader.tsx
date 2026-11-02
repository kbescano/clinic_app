'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  CalendarDaysIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'
import FadeIn from '@/components/shared/FadeIn'
import type { ClinicSlug } from '@/lib/clinics'
import DemoTour from './DemoTour'
import NotificationTrigger from './NotificationTrigger'
import Tooltip from './Tooltip'
import { switchPortalClinic } from './clinicActions'
import { exitPortalDemo } from './demoActions'

interface PortalHeaderProps {
  clinicName: string
  clinicSlug: ClinicSlug
  /** Only for super admins: the clinics they can switch between. */
  clinics: { slug: ClinicSlug; name: string }[]
  email: string
  /** A demo visitor: show the demo strip, hide the CMS, and "Exit demo" instead of signing out. */
  demo?: boolean
}

/** The portal's pages, always in view under the clinic name. Each says what it's for on hover. */
const PAGES = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: CalendarDaysIcon,
    tip: "Today's schedule at a glance: who's coming in, and how much revenue is expected and settled.",
  },
  {
    name: 'Bookings',
    href: '/admin/manager',
    icon: ClipboardDocumentCheckIcon,
    tip: 'Every booking, with buttons to confirm, complete or cancel it. Mark a visit Completed after it happens: that is what counts it as revenue.',
  },
  {
    name: 'History',
    href: '/medical-history',
    icon: ClipboardDocumentListIcon,
    tip: "Patient records: look up anyone's past visits and the notes written after each one.",
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: ChartBarIcon,
    also: ['/admin/reports'],
    tip: 'Revenue and booking trends by day, week, month or year, plus downloadable reports. Revenue counts Completed visits only.',
  },
]

const utilityLink =
  'text-[8px] uppercase tracking-[0.5em] font-serif text-[#595f72] dark:text-zinc-400 hover:text-[#251101] dark:hover:text-white transition-colors duration-500'

export default function PortalHeader({ clinicName, clinicSlug, clinics, email, demo = false }: PortalHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [isSwitching, startSwitch] = useTransition()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    if (demo) return exitPortalDemo()
    await fetch('/api/users/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <>
    <nav className="fixed top-0 left-0 w-full z-[100] bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-100/50 dark:border-zinc-900/50 shadow-sm">
      {demo && (
        <div className="flex items-center justify-center gap-3 bg-zinc-950 px-4 py-2 text-[11px] font-semibold text-white dark:bg-white dark:text-zinc-950">
          <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-950 dark:bg-zinc-950 dark:text-white">
            Demo
          </span>
          <span>Sample bookings, view only</span>
          <button onClick={() => setTourOpen(true)} className="underline underline-offset-4 hover:opacity-70">
            Tour
          </button>
          <button onClick={handleLogout} className="underline underline-offset-4 hover:opacity-70">
            Exit demo
          </button>
        </div>
      )}
      <FadeIn>
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 h-20 md:h-28 flex items-center justify-between">
          {/* LEFT: the clinic's public site, and (super admins) which clinic to show */}
          <div className="flex-1 flex items-center justify-start gap-6 md:gap-10">
            <span className="hidden md:inline-flex">
              <Tooltip text="Opens the clinic's public website, where patients book online." align="start">
                <Link href={`/${clinicSlug}`} className={utilityLink}>
                  Website
                </Link>
              </Tooltip>
            </span>
            {clinics.length > 1 && (
              <label className="flex items-center gap-2">
                <span className="sr-only">Clinic</span>
                <Tooltip text="Choose which clinic's bookings and numbers you're looking at. Only super admins see this." align="start">
                  <select
                    value={clinicSlug}
                    disabled={isSwitching}
                    onChange={(e) => {
                      const next = e.target.value
                      startSwitch(async () => {
                        await switchPortalClinic(next)
                        router.refresh()
                      })
                    }}
                    className={`${utilityLink} max-w-[7.5rem] cursor-pointer appearance-none truncate border-b border-current bg-transparent pb-1 pr-3 outline-none disabled:opacity-50 md:max-w-none`}
                  >
                    {clinics.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Tooltip>
              </label>
            )}
          </div>

          {/* CENTER: BRANDING PILLAR */}
          <div className="flex-none flex flex-col items-center">
            <span className="text-[6px] uppercase tracking-[0.8em] text-[#595f72] dark:text-zinc-500 mb-2 font-serif">
              Staff Portal
            </span>
            <Link href="/dashboard" className="group flex flex-col items-center">
              <h1 className="text-center text-[11px] md:text-[13px] uppercase tracking-[0.3em] sm:tracking-[0.5em] md:tracking-[0.8em] font-light font-serif text-[#251101] dark:text-zinc-100">
                {clinicName || 'Atelier'}
              </h1>
              <div className="w-1 h-1 rounded-full mt-1.5 bg-[#251101]/10 dark:bg-white/10" />
            </Link>
          </div>

          {/* RIGHT: UTILITY PILLAR */}
          <div className="flex-1 flex items-center justify-end gap-6 md:gap-10">
            {!demo && (
              <span className="hidden md:inline-flex">
                <Tooltip text="The content manager: edit services, prices, specialists and staff accounts." align="end">
                  <Link href="/dashboard-secret-portal" className={utilityLink}>
                    CMS
                  </Link>
                </Tooltip>
              </span>
            )}
            {/* On phones the demo strip already has "Exit demo"; room is short there. */}
            <span className={demo ? 'hidden md:inline-flex' : 'inline-flex'}>
              <Tooltip text={demo ? 'Leave the demo and go back to the sign-in page.' : `Signed in as ${email}.`} align="end">
                <button onClick={handleLogout} disabled={isLoggingOut} className={`${utilityLink} disabled:opacity-50`}>
                  {isLoggingOut ? 'Signing out…' : demo ? 'Exit demo' : 'Sign out'}
                </button>
              </Tooltip>
            </span>
            <Tooltip text="The 10 most recent bookings, newest first. The red dot counts ones you haven't seen." align="end">
              <span className="inline-flex transform hover:scale-110 transition-transform duration-500">
                <NotificationTrigger />
              </span>
            </Tooltip>
          </div>
        </div>
      </FadeIn>

      {/* PAGES: always visible, so nobody has to find a hidden menu */}
      <div className="border-t border-zinc-100/70 dark:border-zinc-900/70">
        <div className="max-w-[1800px] mx-auto px-3 md:px-12 h-12 flex items-center justify-between sm:justify-center gap-1 sm:gap-2 overflow-x-auto md:overflow-visible [&::-webkit-scrollbar]:hidden">
          {PAGES.map((page, i) => {
            const active = [page.href, ...(page.also ?? [])].some((p) => pathname === p || pathname.startsWith(`${p}/`))
            const Icon = page.icon
            return (
              <Tooltip key={page.href} text={page.tip} align={i === 0 ? 'start' : i === PAGES.length - 1 ? 'end' : 'center'}>
                <Link
                  href={page.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-3 sm:px-4 py-2 text-[9px] sm:text-[10px] font-serif uppercase tracking-[0.2em] sm:tracking-[0.25em] transition-colors duration-300 ${
                    active
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                      : 'text-[#595f72] hover:bg-zinc-100 hover:text-[#251101] dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="hidden sm:block w-4 h-4" />
                  {page.name}
                </Link>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </nav>
    {/* Outside the nav: its backdrop blur would trap a fixed overlay inside the bar. */}
    {demo && <DemoTour clinicName={clinicName} open={tourOpen} onOpenChange={setTourOpen} />}
    </>
  )
}
