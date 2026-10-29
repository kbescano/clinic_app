'use client'

import React, { useState, useEffect, useRef, useTransition, useMemo } from 'react'
import Link from 'next/link'
import FadeIn from '@/components/shared/FadeIn'
import BackToHome from '@/components/shared/BackToHome'
import { verifyPatientProfile, logoutPatient } from '../profile/actions'
import {
  ShieldCheckIcon,
  UserIcon,
  PlusIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import dayjs from '@/lib/dayjs'
import { useSearchParams } from 'next/navigation'

interface PatientVisit {
  id: string
  date: string | Date
  status: 'confirmed' | 'completed' | 'pending' | 'cancelled'
  service: string
  isGuest: boolean
  firstName: string
  surname: string
}

interface PatientProfile {
  firstName: string
  surname: string
  email: string
  phone: string
  history: PatientVisit[]
}

interface AppointmentGroup {
  date: string | Date
  main: PatientVisit[]
  guests: Record<string, PatientVisit[]>
  daySubtotal: number
}

export default function AppointmentClient({ initialData }: { initialData: PatientProfile | null }) {
  const searchParams = useSearchParams()
  const autoEmail = searchParams?.get('email')
  const autoPhone = searchParams?.get('ph')

  const [isPending, startTransition] = useTransition()
  const [patientData, setPatientData] = useState<PatientProfile | null>(initialData)
  const [isVerified, setIsVerified] = useState(!!initialData)
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming')

  const [drawLine, setDrawLine] = useState(false)
  const [isHeaderVisible, setIsHeaderVisible] = useState(false)
  const [isMetricsVisible, setIsMetricsVisible] = useState(false)
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false)

  const headerRef = useRef<HTMLDivElement>(null)
  const metricsRef = useRef<HTMLDivElement>(null)

  const [authForm, setAuthForm] = useState({ email: '', lastFour: '' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isVerified && autoEmail && autoPhone && !isAutoLoggingIn) {
      setIsAutoLoggingIn(true)
      const lastFour = autoPhone.length >= 4 ? autoPhone.slice(-4) : autoPhone
      setAuthForm({ email: autoEmail, lastFour })

      startTransition(async () => {
        const res = await verifyPatientProfile(autoEmail, lastFour)
        if (res.error) {
          setError(res.error)
          setIsAutoLoggingIn(false)
        } else {
          setPatientData(res?.data as PatientProfile | null)
          setIsVerified(true)
          window.history.replaceState(null, '', '/appointments')
        }
      })
    }
  }, [isVerified, autoEmail, autoPhone, isAutoLoggingIn])

  const bookNewUrl = useMemo(() => {
    if (!patientData) return '/booking'
    const params = new URLSearchParams({
      fn: patientData.firstName || '',
      sn: patientData.surname || '',
      email: patientData.email || '',
      ph: patientData.phone || '',
    })
    return `/booking?${params.toString()}`
  }, [patientData])

  const { timelineRegistry, totalServices } = useMemo(() => {
    if (!patientData?.history) return { timelineRegistry: [], totalServices: 0 }
    const now = dayjs()
    const groups: Record<string, AppointmentGroup> = {}
    let sCount = 0

    patientData.history.forEach((h) => {
      const isPast = dayjs(h.date).add(1, 'hour').isBefore(now)

      if (filter === 'upcoming' && isPast) return
      if (filter === 'past' && !isPast) return

      if (h.status !== 'cancelled') {
        sCount++
      }

      const dayKey = dayjs(h.date).format('YYYY-MM-DD')
      if (!groups[dayKey]) {
        groups[dayKey] = {
          date: h.date,
          main: [],
          guests: {},
          daySubtotal: 0,
        }
      }

      groups[dayKey].daySubtotal += 1

      if (!h.isGuest) {
        groups[dayKey].main.push(h)
      } else {
        const gName = `${h.firstName} ${h.surname}`
        if (!groups[dayKey].guests[gName]) {
          groups[dayKey].guests[gName] = []
        }
        groups[dayKey].guests[gName].push(h)
      }
    })

    const sorted = Object.values(groups).sort((a, b) => {
      const timeA = dayjs(a.date).startOf('day').valueOf()
      const timeB = dayjs(b.date).startOf('day').valueOf()
      return filter === 'upcoming' ? timeA - timeB : timeB - timeA
    })

    sorted.forEach((group) => {
      group.main.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
      Object.values(group.guests).forEach((guestVisits) => {
        guestVisits.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
      })
    })

    return { timelineRegistry: sorted, totalServices: sCount }
  }, [patientData, filter])

  useEffect(() => {
    if (isVerified) {
      setTimeout(() => setDrawLine(true), 500)
      const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
      const headerObserver = new IntersectionObserver(
        ([e]) => setIsHeaderVisible(e.isIntersecting),
        observerOptions,
      )
      const metricsObserver = new IntersectionObserver(
        ([e]) => setIsMetricsVisible(e.isIntersecting),
        observerOptions,
      )
      if (headerRef.current) headerObserver.observe(headerRef.current)
      if (metricsRef.current) metricsObserver.observe(metricsRef.current)
      return () => {
        headerObserver.disconnect()
        metricsObserver.disconnect()
      }
    }
  }, [isVerified])

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await verifyPatientProfile(authForm.email, authForm.lastFour)
      if (res.error) setError(res.error)
      else {
        setPatientData(res.data as PatientProfile | null)
        setIsVerified(true)
      }
    })
  }

  if (!isVerified || !patientData?.firstName) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center p-6 font-sans">
        <FadeIn>
          <div className="w-full max-w-md space-y-8 text-center">
            <header className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Patient access</p>
              <h1 className="text-5xl font-extrabold leading-[0.95] tracking-tighter text-zinc-950 dark:text-zinc-100">
                My visits
              </h1>
              <p className="text-base text-zinc-600 dark:text-zinc-400">
                Enter the email you booked with and the last 4 digits of your phone number.
              </p>
            </header>

            {isAutoLoggingIn && isPending ? (
              <div className="py-20 animate-pulse">
                <p className="text-xs uppercase tracking-[0.2em] text-[#48a9a6] font-medium">
                  Verifying Session...
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleVerify}
                className="space-y-8 border-2 border-zinc-950 bg-white p-8 dark:border-zinc-600 dark:bg-[#050505]"
              >
                <div className="space-y-6 text-left">
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-none animate-in fade-in zoom-in-95">
                      <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
                      <p className="text-xs text-red-600 dark:text-red-400 leading-none">
                        {error}
                      </p>
                    </div>
                  )}
                  <div className="border-b-2 border-zinc-300 py-1 transition-colors focus-within:border-zinc-950 dark:border-zinc-700 dark:focus-within:border-white">
                    <label
                      htmlFor="verify-email"
                      className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500"
                    >
                      Email
                    </label>
                    <input
                      id="verify-email"
                      name="email"
                      required
                      type="email"
                      autoComplete="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                      className="w-full bg-transparent py-2 text-lg font-semibold text-zinc-950 outline-none dark:text-zinc-100"
                    />
                  </div>
                  <div className="border-b-2 border-zinc-300 py-1 transition-colors focus-within:border-zinc-950 dark:border-zinc-700 dark:focus-within:border-white">
                    <label
                      htmlFor="verify-suffix"
                      className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500"
                    >
                      Phone Suffix
                    </label>
                    <input
                      id="verify-suffix"
                      name="phoneSuffix"
                      required
                      maxLength={4}
                      type="text"
                      inputMode="numeric"
                      placeholder="••••"
                      value={authForm.lastFour}
                      onChange={(e) => setAuthForm({ ...authForm, lastFour: e.target.value })}
                      className="w-full bg-transparent py-2 text-lg font-semibold tracking-[0.3em] text-zinc-950 outline-none placeholder:opacity-30 dark:text-zinc-100"
                    />
                  </div>
                </div>
                <button
                  disabled={isPending}
                  type="submit"
                  className="w-full bg-zinc-950 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  {isPending ? 'Accessing...' : 'View My Schedule'}
                </button>
              </form>
            )}
          </div>
        </FadeIn>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-zinc-950 dark:text-zinc-100 pt-24 md:pt-32 pb-32 px-4 md:px-8 selection:bg-zinc-100 overflow-x-hidden font-sans">
      <FadeIn>
        <div className="max-w-4xl mx-auto flex flex-col gap-10 md:gap-20">
          <header
            ref={headerRef}
            className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12"
          >
            <div className="space-y-4 relative">
              <div
                className={`absolute -left-4 md:-left-8 top-0 w-[1px] bg-zinc-900 dark:bg-white transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top ${isHeaderVisible && drawLine ? 'h-full opacity-100' : 'h-0 opacity-0'}`}
              />
              <div
                className={`transition-all duration-1000 delay-100 ${isHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              >
                <p className="text-xs md:text-xs uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                  <ShieldCheckIcon className="w-3.5 h-3.5 text-[#48a9a6]" /> Appointment Portal
                </p>
              </div>
              <h1
                className={`text-3xl md:text-6xl capitalize font-extrabold tracking-tighter leading-none transition-all duration-700 delay-300 ease-out ${isHeaderVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-md'}`}
              >
                {patientData.firstName}{' '}
                <span className="text-zinc-500">{patientData.surname}</span>
              </h1>
            </div>
            <div className="flex flex-col items-end gap-6">
              <Link
                href={bookNewUrl}
                className="hidden md:flex items-center gap-3 px-6 py-3 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs uppercase tracking-[0.2em] rounded-none hover:opacity-100 transition-all active:scale-95 shadow-sm"
              >
                <PlusIcon className="w-3 h-3" /> Book New Session
              </Link>
              <div
                className={`self-end md:self-auto inline-flex items-center bg-zinc-50 dark:bg-zinc-900/50 p-1.5 rounded-none border border-zinc-300 dark:border-zinc-800/50 relative transition-all duration-1000 delay-500 ${isHeaderVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
              >
                <div
                  className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-zinc-800 rounded-none shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${filter === 'past' ? 'translate-x-full' : 'translate-x-0'}`}
                />
                <button
                  onClick={() => setFilter('upcoming')}
                  className={`relative z-10 w-28 md:w-36 py-2.5 text-xs md:text-xs uppercase tracking-[0.2em] font-medium transition-colors ${filter === 'upcoming' ? 'text-zinc-950 dark:text-white' : 'text-zinc-500'}`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setFilter('past')}
                  className={`relative z-10 w-28 md:w-36 py-2.5 text-xs md:text-xs uppercase tracking-[0.2em] font-medium transition-colors ${filter === 'past' ? 'text-zinc-950 dark:text-white' : 'text-zinc-500'}`}
                >
                  History
                </button>
              </div>
            </div>
          </header>

          <section
            ref={metricsRef}
            className={`grid grid-cols-2 md:grid-cols-3 gap-px bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-800/50 rounded-none overflow-hidden shadow-sm transition-all duration-700 ease-out ${isMetricsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
          >
            <div className="bg-white dark:bg-[#050505] p-6 md:p-8 flex flex-col justify-between min-h-[120px] group transition-all hover:bg-zinc-50/50">
              <p className="text-xs md:text-xs uppercase tracking-[0.2em] text-zinc-500">
                {filter === 'upcoming' ? 'Upcoming visits' : 'Total Visits'}
              </p>
              <p className="text-3xl md:text-5xl font-extrabold tracking-tighter tabular-nums text-zinc-950 dark:text-zinc-100 leading-[1.02]">
                {timelineRegistry.length}
              </p>
            </div>
            <div className="bg-white dark:bg-[#050505] p-6 md:p-8 flex flex-col justify-between min-h-[120px] group transition-all hover:bg-zinc-50/50">
              <p className="text-xs md:text-xs uppercase tracking-[0.2em] text-zinc-500">
                Procedures
              </p>
              <p className="text-3xl md:text-5xl font-extrabold tracking-tighter tabular-nums text-zinc-950 dark:text-zinc-100 leading-[1.02]">
                {totalServices}
              </p>
            </div>
            <div className="hidden md:flex bg-white dark:bg-[#050505] p-6 md:p-8 flex-col justify-between min-h-[120px] group transition-all hover:bg-zinc-50/50 border-l border-zinc-300 dark:border-zinc-800">
              <p className="text-xs md:text-xs uppercase tracking-[0.2em] text-zinc-500">
                Session Status
              </p>
              <p className="text-3xl md:text-5xl font-extrabold tracking-tighter text-[#48a9a6] leading-[1.02]">
                Verified
              </p>
            </div>
          </section>

          <div className="flex flex-col gap-16 md:gap-24">
            {timelineRegistry.length > 0 ? (
              timelineRegistry.map((group, i) => (
                <AppointmentDayBlock
                  key={i}
                  group={group}
                  isUpcoming={filter === 'upcoming'}
                  patientData={patientData}
                />
              ))
            ) : (
              <div className="py-24 flex flex-col items-center gap-8 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-none text-zinc-950 dark:text-zinc-100">
                <p className="text-xs uppercase tracking-widest text-zinc-500">
                  No appointments found
                </p>
                <Link
                  href={bookNewUrl}
                  className="px-8 py-4 bg-zinc-50 dark:bg-zinc-900 text-zinc-950 dark:text-white text-xs uppercase tracking-[0.2em] rounded-none hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-zinc-300 dark:border-zinc-800"
                >
                  Schedule Your First Visit
                </Link>
              </div>
            )}
          </div>

          <div className="pt-12 flex flex-col items-center gap-8 border-t border-zinc-50 dark:border-zinc-800/50 opacity-40 hover:opacity-100 transition-opacity">
            <Link
              href={bookNewUrl}
              className="md:hidden flex items-center gap-3 px-8 py-4 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs uppercase tracking-[0.2em] rounded-none active:scale-95 transition-all"
            >
              Book New Session
            </Link>
            <button
              onClick={async () => {
                await logoutPatient()
                window.location.reload()
              }}
              className="text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-[#d7263d] transition-all"
            >
              [ End Registry Session ]
            </button>
            <BackToHome />
          </div>
        </div>
      </FadeIn>
    </div>
  )
}

function AppointmentDayBlock({
  group,
  isUpcoming,
  patientData,
}: {
  group: AppointmentGroup
  isUpcoming: boolean
  patientData: PatientProfile | null
}) {
  const [isVisible, setIsVisible] = useState(false)
  const blockRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => setIsVisible(e.isIntersecting), {
      threshold: 0.1,
      rootMargin: '0px 0px -20px 0px',
    })
    if (blockRef.current) observer.observe(blockRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={blockRef}
      className={`flex flex-col transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-sm'}`}
    >
      <div className="flex justify-between items-baseline border-b border-zinc-900 dark:border-white pb-3 mb-10">
        <div className="flex items-baseline gap-4">
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tighter tabular-nums leading-none text-zinc-950 dark:text-zinc-100">
            {dayjs(group.date).format('MMM D')}
          </h2>
          <span className="text-xs md:text-xs uppercase tracking-[0.2em] text-zinc-500 opacity-60">
            Subtotal: {group.daySubtotal}
          </span>
        </div>
        <span className="text-base md:text-lg font-normal tabular-nums opacity-30 leading-none tracking-widest">
          {dayjs(group.date).format('YYYY')}
        </span>
      </div>
      <div className="flex flex-col gap-10 mb-12">
        {group.main.map((v, idx) => (
          <AppointmentRow key={idx} visit={v} isUpcoming={isUpcoming} patientData={patientData} />
        ))}
      </div>
      {(Object.entries(group.guests) as [string, PatientVisit[]][]).map(([name, visits], gIdx) => (
        <div key={gIdx} className="flex flex-col gap-10 mt-6">
          <div className="flex items-center gap-4 py-4 border-y border-zinc-300 dark:border-zinc-800/20 mb-6 px-2">
            <UserIcon className="w-3.5 h-3.5 text-zinc-500 opacity-40" />
            <p className="text-xs md:text-sm font-medium capitalize text-zinc-950 dark:text-zinc-100 leading-none">
              {name}
            </p>
            <div className="px-2 py-0.5">
              <span className="text-xs md:text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold leading-none">
                Guest
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-10">
            {visits.map((v, vIdx) => (
              <AppointmentRow
                key={vIdx}
                visit={v}
                isUpcoming={isUpcoming}
                patientData={patientData}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function AppointmentRow({
  visit,
  isUpcoming,
  patientData,
}: {
  visit: PatientVisit
  isUpcoming: boolean
  patientData: PatientProfile | null
}) {
  const statusColors: Record<string, string> = {
    confirmed: 'text-[#248232]',
    completed: 'text-[#48a9a6]',
    pending: 'text-amber-600',
    cancelled: 'text-[#d7263d]',
  }

  const now = dayjs()
  const visitDate = dayjs(visit.date)

  const isCurrentlyOngoing = now.isAfter(visitDate) && now.isBefore(visitDate.add(1, 'hour'))
  const isFutureTime = now.isBefore(visitDate)

  const rescheduleUrl = `/booking?reschedule=true&id=${visit.id || ''}&service=${encodeURIComponent(visit.service || '')}&date=${dayjs(visit.date).format('YYYY-MM-DD')}&time=${dayjs(visit.date).format('HH:mm')}&fn=${encodeURIComponent(visit.firstName || '')}&sn=${encodeURIComponent(visit.surname || '')}&email=${encodeURIComponent(patientData?.email || '')}&ph=${encodeURIComponent(patientData?.phone || '')}`

  return (
    <div className="flex justify-between items-baseline gap-6 group">
      <div className="space-y-1">
        {isUpcoming && isCurrentlyOngoing && visit.status !== 'cancelled' && (
          <span className="text-xs text-[#248232] uppercase tracking-[0.2em] font-bold animate-pulse">
            ● Ongoing
          </span>
        )}
        {isUpcoming && isFutureTime && visit.status !== 'cancelled' && (
          <span className="text-xs text-[#48a9a6] uppercase tracking-[0.2em] font-medium">
            Upcoming
          </span>
        )}
        <h3 className="text-base md:text-lg font-normal tracking-tight capitalize text-zinc-950 dark:text-zinc-100 leading-none">
          {visit.service}
        </h3>
        <div className="flex items-center gap-2 pt-0.5">
          <p className="text-xs opacity-40 tabular-nums leading-none">
            {dayjs(visit.date).format('hh:mm A')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <span
          className={`text-sm md:text-sm uppercase font-medium tracking-[0.1em] shrink-0 leading-none ${statusColors[visit.status] || 'text-zinc-500'}`}
        >
          {visit.status}
        </span>
        {isUpcoming && visit.status === 'confirmed' && (
          <Link
            href={rescheduleUrl}
            className="text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-all px-3 py-1.5 border border-zinc-300 dark:border-zinc-800 rounded-none opacity-100"
          >
            Reschedule
          </Link>
        )}
      </div>
    </div>
  )
}
