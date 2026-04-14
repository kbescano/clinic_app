'use client'

import React, { useState, useEffect, useRef, useTransition, useMemo } from 'react'
import FadeIn from '../components/FadeIn'
import BackToHome from '../components/BackToHome'
import { verifyPatientProfile, logoutPatient } from './actions'
import { ShieldCheckIcon, UserIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import dayjs from '@/lib/dayjs'

// --- TYPES & INTERFACES ---

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

interface TimelineGroup {
  date: string | Date
  main: PatientVisit[]
  guests: Record<string, PatientVisit[]>
  daySubtotal: number
}

export default function PatientProfileClient({
  initialData,
}: {
  initialData: PatientProfile | null
}) {
  const [isPending, startTransition] = useTransition()
  const [patientData, setPatientData] = useState<PatientProfile | null>(initialData)
  const [isVerified, setIsVerified] = useState(!!initialData)
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest')

  const [drawLine, setDrawLine] = useState(false)
  const [isHeaderVisible, setIsHeaderVisible] = useState(false)
  const [isMetricsVisible, setIsMetricsVisible] = useState(false)

  const headerRef = useRef<HTMLDivElement>(null)
  const metricsRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [authForm, setAuthForm] = useState({ email: '', lastFour: '' })

  // --- HIERARCHICAL GROUPING & METRICS ---
  const { timelineRegistry, totalServices } = useMemo(() => {
    if (!patientData?.history) return { timelineRegistry: [], totalServices: 0 }

    const groups: Record<string, TimelineGroup> = {}
    let serviceCount = 0

    patientData.history.forEach((h) => {
      serviceCount++
      const dayKey = dayjs(h.date).format('YYYY-MM-DD')
      if (!groups[dayKey]) {
        groups[dayKey] = { date: h.date, main: [], guests: {}, daySubtotal: 0 }
      }

      groups[dayKey].daySubtotal += 1

      if (!h.isGuest) {
        groups[dayKey].main.push(h)
      } else {
        const guestName = `${h.firstName} ${h.surname}`
        if (!groups[dayKey].guests[guestName]) groups[dayKey].guests[guestName] = []
        groups[dayKey].guests[guestName].push(h)
      }
    })

    const sorted = Object.values(groups).sort((a, b) => {
      const timeA = dayjs(a.date).valueOf()
      const timeB = dayjs(b.date).valueOf()
      return sortBy === 'latest' ? timeB - timeA : timeA - timeB
    })

    return { timelineRegistry: sorted, totalServices: serviceCount }
  }, [patientData, sortBy])

  useEffect(() => {
    if (isVerified) {
      const timer = setTimeout(() => setDrawLine(true), 500)
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
        clearTimeout(timer)
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
          <div className="w-full max-w-[320px] space-y-8 text-center">
            <header className="space-y-2">
              <p className="text-[8px] uppercase tracking-[0.5em] text-[#595f72] font-serif">
                Registry Access
              </p>
              <h1 className="text-2xl font-serif font-light tracking-tighter uppercase text-[#251101] dark:text-zinc-100">
                Patient Passport
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
                    Registry Email
                  </label>
                  <input
                    required
                    type="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    className="w-full bg-transparent py-2 outline-none font-serif text-base"
                    placeholder="email@example.com"
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
                    className="w-full bg-transparent py-2 outline-none font-serif text-base tracking-[0.6em]"
                    placeholder="••••"
                  />
                </div>
              </div>
              <button
                disabled={isPending}
                className="w-full py-4 bg-[#251101] dark:bg-white text-white dark:text-[#251101] text-[9px] font-serif uppercase tracking-[0.4em] rounded-full transition-all active:scale-[0.98]"
              >
                {isPending ? 'Validating...' : 'Access Records'}
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
                className={`absolute -left-4 md:-left-8 top-0 w-[1px] bg-zinc-900 dark:bg-white transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] origin-top ${
                  isHeaderVisible && drawLine ? 'h-full opacity-100' : 'h-0 opacity-0'
                }`}
              />
              <div
                className={`transition-all duration-1000 delay-100 ${isHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              >
                <p className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-[#595f72] font-serif flex items-center gap-2">
                  <ShieldCheckIcon className="w-3.5 h-3.5 text-[#48a9a6]" /> Clinical Registry
                </p>
              </div>
              <h1
                className={`text-[28px] md:text-[48px] font-light tracking-tighter font-serif leading-none transition-all duration-[1200ms] delay-300 ease-out ${
                  isHeaderVisible
                    ? 'opacity-100 translate-y-0 blur-0'
                    : 'opacity-0 translate-y-8 blur-md'
                }`}
              >
                {patientData.firstName}{' '}
                <span className="text-[#595f72]">{patientData.surname}</span>
              </h1>
            </div>

            <div
              className={`self-end md:self-auto inline-flex items-center bg-zinc-50 dark:bg-zinc-900/50 p-1.5 rounded-full border border-zinc-100 dark:border-zinc-800/50 relative transition-all duration-1000 delay-500 ${isHeaderVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >
              <div
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-zinc-800 rounded-full shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${sortBy === 'oldest' ? 'translate-x-full' : 'translate-x-0'}`}
              />
              <button
                onClick={() => setSortBy('latest')}
                className={`relative z-10 w-28 md:w-36 py-2.5 text-[7px] md:text-[9px] uppercase tracking-[0.3em] font-medium transition-colors font-serif ${sortBy === 'latest' ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'}`}
              >
                Latest
              </button>
              <button
                onClick={() => setSortBy('oldest')}
                className={`relative z-10 w-28 md:w-36 py-2.5 text-[7px] md:text-[9px] uppercase tracking-[0.3em] font-medium transition-colors font-serif ${sortBy === 'oldest' ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'}`}
              >
                Oldest
              </button>
            </div>
          </header>

          <section
            ref={metricsRef}
            className={`flex flex-col transition-all duration-[1200ms] ease-out ${isMetricsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl overflow-hidden shadow-sm">
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
                  Status
                </p>
                <p className="text-[24px] md:text-[32px] font-light font-serif tracking-tight text-[#48a9a6]">
                  Active Registry
                </p>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-16 md:gap-24">
            {timelineRegistry.map((group, i) => (
              <RegistryDayBlock key={i} group={group} />
            ))}
          </div>

          <div className="pt-8 md:pt-12 flex flex-col items-center gap-8 border-t border-zinc-50 dark:border-zinc-900/50 opacity-40 hover:opacity-100 transition-opacity">
            <button
              onClick={async () => {
                await logoutPatient()
                window.location.reload()
              }}
              className="text-[8px] uppercase tracking-[0.5em] text-[#595f72] hover:text-[#d7263d] transition-all font-serif"
            >
              [ Terminate Registry Session ]
            </button>
            <BackToHome />
          </div>
        </div>
      </FadeIn>
    </div>
  )
}

function RegistryDayBlock({ group }: { group: TimelineGroup }) {
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
      <div className="flex justify-between items-baseline border-b border-zinc-900 dark:border-white pb-4 mb-10">
        <div className="flex items-baseline gap-4">
          <h2 className="text-[22px] md:text-[28px] font-serif font-light tracking-tighter tabular-nums text-[#251101] dark:text-zinc-100">
            {dayjs(group.date).format('MMM D')}
          </h2>
          <span className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] text-[#595f72] font-serif opacity-60">
            / {group.daySubtotal} Services
          </span>
        </div>
        <span className="text-[14px] md:text-[18px] font-serif font-light tabular-nums opacity-30 tracking-widest leading-none">
          {dayjs(group.date).format('YYYY')}
        </span>
      </div>

      <div className="flex flex-col gap-8 mb-12">
        {group.main.map((v, idx) => (
          <ServiceRow key={idx} title={v.service} status={v.status} />
        ))}
      </div>

      {(Object.entries(group.guests) as [string, PatientVisit[]][]).map(([name, visits], gIdx) => (
        <div key={gIdx} className="flex flex-col gap-8 mt-6">
          <div className="flex items-center gap-4 py-4 border-y border-zinc-100 dark:border-zinc-900/30 mb-4 px-2">
            <UserIcon className="w-3 h-3 text-[#595f72] opacity-40" />
            <p className="text-[10px] md:text-[12px] font-serif font-medium capitalize text-[#251101] dark:text-zinc-100 leading-none">
              {name}{' '}
              <span className="text-[6px] px-1.5 py-0.5 text-[#595f72] uppercase tracking-[0.2em] font-serif">
                Guest
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {visits.map((v, vIdx) => (
              <ServiceRow key={vIdx} title={v.service} status={v.status} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ServiceRow({ title, status }: { title: string; status: string }) {
  const styles: Record<string, string> = {
    confirmed: 'text-[#248232]',
    pending: 'text-amber-700/60',
    completed: 'text-[#48a9a6]',
    cancelled: 'text-[#d7263d]',
  }

  return (
    <div className="flex justify-between items-baseline gap-6 font-serif">
      <h3 className="text-[15px] md:text-[18px] font-serif font-light tracking-tight capitalize text-[#251101] dark:text-zinc-100 leading-none">
        {title}
      </h3>
      <span
        className={`text-[12px] md:text-[13px] uppercase font-medium tracking-[0.1em] shrink-0 leading-none ${styles[status] || 'text-[#595f72]'}`}
      >
        {status}
      </span>
    </div>
  )
}
