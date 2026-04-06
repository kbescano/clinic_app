'use client'

import React, { useState, useEffect, useRef, useTransition, useMemo } from 'react'
import Link from 'next/link'
import FadeIn from '../components/FadeIn'
import BackToHome from '../components/BackToHome'
import { verifyPatientProfile, logoutPatient } from '../profile/actions'
import {
  ShieldCheckIcon,
  UserIcon,
  PlusIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import dayjs from '@/lib/dayjs'

export default function AppointmentClient({ initialData }: { initialData: any }) {
  const [isPending, startTransition] = useTransition()
  const [patientData, setPatientData] = useState(initialData)
  const [isVerified, setIsVerified] = useState(!!initialData)
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming')

  const [drawLine, setDrawLine] = useState(false)
  const [isHeaderVisible, setIsHeaderVisible] = useState(false)
  const [isMetricsVisible, setIsMetricsVisible] = useState(false)

  const headerRef = useRef<HTMLDivElement>(null)
  const metricsRef = useRef<HTMLDivElement>(null)

  const [authForm, setAuthForm] = useState({ email: '', lastFour: '' })
  const [error, setError] = useState<string | null>(null)

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
    const groups: Record<string, any> = {}
    let sCount = 0

    patientData.history.forEach((h: any) => {
      const isPast = dayjs(h.date).isBefore(now)
      if (filter === 'upcoming' && isPast) return
      if (filter === 'past' && !isPast) return

      sCount++
      const dayKey = dayjs(h.date).format('YYYY-MM-DD')
      if (!groups[dayKey]) {
        groups[dayKey] = { date: h.date, main: [], guests: {}, daySubtotal: 0 }
      }

      groups[dayKey].daySubtotal += 1
      if (!h.isGuest) groups[dayKey].main.push(h)
      else {
        const gName = `${h.firstName} ${h.surname}`
        if (!groups[dayKey].guests[gName]) groups[dayKey].guests[gName] = []
        groups[dayKey].guests[gName].push(h)
      }
    })

    const sorted = Object.values(groups).sort((a: any, b: any) => {
      const timeA = dayjs(a.date).valueOf()
      const timeB = dayjs(b.date).valueOf()
      return filter === 'upcoming' ? timeA - timeB : timeB - timeA
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
        setPatientData(res.data)
        setIsVerified(true)
      }
    })
  }

  if (!isVerified || !patientData?.firstName) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center p-6 font-sans">
        <FadeIn>
          <div className="w-full max-w-[320px] space-y-8 text-center">
            <header className="space-y-1">
              <p className="text-[7px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                Secure Registry
              </p>
              <h1 className="text-xl font-serif font-light tracking-tighter uppercase text-[#251101] dark:text-zinc-100">
                Appointments
              </h1>
            </header>
            <form
              onSubmit={handleVerify}
              className="space-y-8 bg-white dark:bg-[#050505] p-8 border border-zinc-100 dark:border-zinc-900 rounded-2xl shadow-sm"
            >
              <div className="space-y-6 text-left">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-lg animate-in fade-in zoom-in-95">
                    <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
                    <p className="text-[10px] font-serif text-red-600 dark:text-red-400 leading-none">
                      {error}
                    </p>
                  </div>
                )}
                <div className="border-b border-zinc-100 dark:border-zinc-800 py-1">
                  <label className="text-[7px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    className="w-full bg-transparent py-2 outline-none font-serif text-base text-[#251101] dark:text-zinc-100"
                  />
                </div>
                <div className="border-b border-zinc-100 dark:border-zinc-800 py-1">
                  <label className="text-[7px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                    Phone Suffix
                  </label>
                  <input
                    required
                    maxLength={4}
                    type="text"
                    value={authForm.lastFour}
                    onChange={(e) => setAuthForm({ ...authForm, lastFour: e.target.value })}
                    className="w-full bg-transparent py-2 outline-none font-serif text-base tracking-[0.6em] text-[#251101] dark:text-zinc-100"
                  />
                </div>
              </div>
              <button
                disabled={isPending}
                className="w-full py-4 bg-[#251101] dark:bg-white text-white dark:text-[#251101] text-[9px] font-serif uppercase tracking-[0.4em] rounded-full active:scale-95 transition-transform"
              >
                {isPending ? 'Accessing...' : 'View My Schedule'}
              </button>
            </form>
          </div>
        </FadeIn>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-[#251101] dark:text-zinc-100 pt-24 md:pt-32 pb-32 px-4 md:px-8 selection:bg-zinc-100 overflow-x-hidden font-sans">
      <FadeIn>
        <div className="max-w-4xl mx-auto flex flex-col gap-10 md:gap-20">
          <header
            ref={headerRef}
            className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12"
          >
            <div className="space-y-4 relative">
              <div
                className={`absolute -left-4 md:-left-8 top-0 w-[1px] bg-zinc-900 dark:bg-white transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] origin-top ${isHeaderVisible && drawLine ? 'h-full opacity-100' : 'h-0 opacity-0'}`}
              />
              <div
                className={`transition-all duration-1000 delay-100 ${isHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              >
                <p className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-[#595f72] font-serif flex items-center gap-2">
                  <ShieldCheckIcon className="w-3.5 h-3.5 text-[#48a9a6]" /> Management Portal
                </p>
              </div>
              <h1
                className={`text-[28px] md:text-[48px] font-light tracking-tighter font-serif leading-none transition-all duration-[1200ms] delay-300 ease-out ${isHeaderVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-md'}`}
              >
                {patientData.firstName}{' '}
                <span className="text-[#595f72]">{patientData.surname}</span>
              </h1>
            </div>

            <div className="flex flex-col items-end gap-6">
              <Link
                href={bookNewUrl}
                className="hidden md:flex items-center gap-3 px-6 py-3 bg-[#251101] dark:bg-white text-white dark:text-[#251101] text-[9px] font-serif uppercase tracking-[0.4em] rounded-full hover:opacity-100 transition-all active:scale-95 shadow-sm"
              >
                <PlusIcon className="w-3 h-3" />
                Book New Session
              </Link>

              <div
                className={`self-end md:self-auto inline-flex items-center bg-zinc-50 dark:bg-zinc-900/50 p-1.5 rounded-full border border-zinc-100 dark:border-zinc-800/50 relative transition-all duration-1000 delay-500 ${isHeaderVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
              >
                <div
                  className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-zinc-800 rounded-full shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${filter === 'past' ? 'translate-x-full' : 'translate-x-0'}`}
                />
                <button
                  onClick={() => setFilter('upcoming')}
                  className={`relative z-10 w-28 md:w-36 py-2.5 text-[7px] md:text-[9px] uppercase tracking-[0.3em] font-medium transition-colors font-serif ${filter === 'upcoming' ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'}`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setFilter('past')}
                  className={`relative z-10 w-28 md:w-36 py-2.5 text-[7px] md:text-[9px] uppercase tracking-[0.3em] font-medium transition-colors font-serif ${filter === 'past' ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'}`}
                >
                  History
                </button>
              </div>
            </div>
          </header>

          <section
            ref={metricsRef}
            className={`grid grid-cols-2 md:grid-cols-3 gap-px bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl overflow-hidden shadow-sm transition-all duration-[1200ms] ease-out ${isMetricsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
          >
            <div className="bg-white dark:bg-[#050505] p-6 md:p-8 flex flex-col justify-between min-h-[120px] group transition-all hover:bg-zinc-50/50">
              <p className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                Grand Total Visits
              </p>
              <p className="text-[24px] md:text-[32px] font-light font-serif tracking-tight tabular-nums text-[#251101] dark:text-zinc-100">
                {timelineRegistry.length}
              </p>
            </div>
            <div className="bg-white dark:bg-[#050505] p-6 md:p-8 flex flex-col justify-between min-h-[120px] group transition-all hover:bg-zinc-50/50">
              <p className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                Total Procedures
              </p>
              <p className="text-[24px] md:text-[32px] font-light font-serif tracking-tight tabular-nums text-[#251101] dark:text-zinc-100">
                {totalServices}
              </p>
            </div>
            <div className="hidden md:flex bg-white dark:bg-[#050505] p-6 md:p-8 flex-col justify-between min-h-[120px] group transition-all hover:bg-zinc-50/50 border-l border-zinc-100 dark:border-zinc-800">
              <p className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                Session Status
              </p>
              <p className="text-[24px] md:text-[32px] font-light font-serif tracking-tight text-[#48a9a6]">
                Verified Access
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
                  patientData={patientData} // Corrected typo
                />
              ))
            ) : (
              <div className="py-24 flex flex-col items-center gap-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-[#251101] dark:text-zinc-100">
                <p className="text-[10px] uppercase tracking-widest text-[#595f72] font-serif">
                  No appointments found
                </p>
                <Link
                  href={bookNewUrl}
                  className="px-8 py-4 bg-zinc-50 dark:bg-zinc-900 text-[#251101] dark:text-white text-[9px] font-serif uppercase tracking-[0.4em] rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-zinc-100 dark:border-zinc-800"
                >
                  Schedule Your First Visit
                </Link>
              </div>
            )}
          </div>

          <div className="pt-12 flex flex-col items-center gap-8 border-t border-zinc-50 dark:border-zinc-900/50 opacity-40 hover:opacity-100 transition-opacity">
            <Link
              href={bookNewUrl}
              className="md:hidden flex items-center gap-3 px-8 py-4 bg-[#251101] dark:bg-white text-white dark:text-[#251101] text-[9px] font-serif uppercase tracking-[0.4em] rounded-full active:scale-95 transition-all"
            >
              Book New Session
            </Link>
            <button
              onClick={async () => {
                await logoutPatient()
                window.location.reload()
              }}
              className="text-[8px] uppercase tracking-[0.5em] text-[#595f72] hover:text-[#d7263d] transition-all font-serif"
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
  patientData, // Corrected prop name
}: {
  group: any
  isUpcoming: boolean
  patientData: any
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
      className={`flex flex-col transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-sm'}`}
    >
      <div className="flex justify-between items-baseline border-b border-zinc-900 dark:border-white pb-3 mb-10">
        <div className="flex items-baseline gap-4">
          <h2 className="text-[22px] md:text-[28px] font-serif font-light tracking-tighter tabular-nums leading-none text-[#251101] dark:text-zinc-100">
            {dayjs(group.date).format('MMM D')}
          </h2>
          <span className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] text-[#595f72] font-serif opacity-60">
            Subtotal: {group.daySubtotal}
          </span>
        </div>
        <span className="text-[14px] md:text-[18px] font-serif font-light tabular-nums opacity-30 leading-none tracking-widest">
          {dayjs(group.date).format('YYYY')}
        </span>
      </div>

      <div className="flex flex-col gap-10 mb-12">
        {group.main.map((v: any, idx: number) => (
          <AppointmentRow key={idx} visit={v} isUpcoming={isUpcoming} patientData={patientData} />
        ))}
      </div>

      {Object.entries(group.guests).map(([name, visits]: any, gIdx) => (
        <div key={gIdx} className="flex flex-col gap-10 mt-6">
          <div className="flex items-center gap-4 py-4 border-y border-zinc-100 dark:border-zinc-900/20 mb-6 px-2">
            <UserIcon className="w-3.5 h-3.5 text-[#595f72] opacity-40" />
            <p className="text-[10px] md:text-[12px] font-serif font-medium capitalize text-[#251101] dark:text-zinc-100 leading-none">
              {name}
            </p>
            <div className="px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 rounded-full">
              <span className="text-[6px] md:text-[7px] uppercase tracking-[0.2em] text-[#595f72] font-serif font-bold leading-none">
                Guest
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-10">
            {visits.map((v: any, vIdx: number) => (
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
  visit: any
  isUpcoming: boolean
  patientData: any
}) {
  const statusColors: Record<string, string> = {
    confirmed: 'text-[#248232]',
    completed: 'text-[#48a9a6]',
    pending: 'text-amber-600',
    cancelled: 'text-[#d7263d]',
  }

  const rescheduleUrl =
    `/booking?reschedule=true` +
    `&id=${visit.id || ''}` +
    `&service=${encodeURIComponent(visit.service || '')}` +
    `&date=${dayjs(visit.date).format('YYYY-MM-DD')}` +
    `&time=${dayjs(visit.date).format('HH:mm')}` + // Added time prefill
    `&fn=${encodeURIComponent(visit.firstName || '')}` +
    `&sn=${encodeURIComponent(visit.surname || '')}` +
    `&email=${encodeURIComponent(patientData?.email || '')}` +
    `&ph=${encodeURIComponent(patientData?.phone || '')}`

  return (
    <div className="flex justify-between items-baseline gap-6 font-serif group">
      <div className="space-y-1">
        <h3 className="text-[15px] md:text-[18px] font-serif font-light tracking-tight capitalize text-[#251101] dark:text-zinc-100 leading-none">
          {visit.service}
        </h3>
        <p className="text-[11px] font-serif opacity-40 tabular-nums">
          {dayjs(visit.date).format('hh:mm A')}
        </p>
      </div>
      <div className="flex items-center gap-6">
        <span
          className={`text-[12px] md:text-[13px] uppercase font-medium tracking-[0.1em] shrink-0 leading-none ${statusColors[visit.status] || 'text-[#595f72]'}`}
        >
          {visit.status}
        </span>
        {isUpcoming && visit.status === 'confirmed' && (
          <Link
            href={rescheduleUrl}
            className="text-[7px] uppercase tracking-[0.3em] text-[#595f72] hover:text-[#251101] dark:hover:text-white transition-all px-3 py-1.5 border border-zinc-100 dark:border-zinc-900 rounded-full opacity-100"
          >
            Reschedule
          </Link>
        )}
      </div>
    </div>
  )
}
