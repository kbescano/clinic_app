'use client'

import React, { useState, useEffect, useRef } from 'react'
import FadeIn from '../components/FadeIn'
import BackToHome from '../components/BackToHome'
import { RegistrySkeleton } from '../components/RegistrySkeleton' // <-- Imported
import dayjs from '@/lib/dayjs'

// --- TYPES (STRICTLY PRESERVED) ---
interface MergedAppointment {
  id: string
  firstName: string
  surname: string
  email: string
  phone: string
  appointmentDate: string
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  services: string[]
  isGuest?: boolean
}

interface MetricsData {
  projectedRevenue: number
  settledRevenue: number
  pendingRevenue: number
  completionRate: number
  totalManifestWorkload: number
  totalCompletedServices: number
  serviceCounts: Record<string, number>
}

interface DashboardProps {
  todayData: MergedAppointment[]
  weekData: MergedAppointment[]
  todayMetrics: MetricsData
  weekMetrics: MetricsData
}

const formatPHTime = (dateStr: string) => dayjs(dateStr).tz('Asia/Manila').format('hh:mm A')

export default function SpecialistDashboardClient({
  todayData,
  weekData,
  todayMetrics,
  weekMetrics,
}: DashboardProps) {
  // THE 2-SECOND CINEMATIC LOCK
  const [isLoading, setIsLoading] = useState(true)

  const [view, setView] = useState<'today' | 'week'>('today')
  const [drawLine, setDrawLine] = useState(false)

  // SCROLL REVEAL STATES
  const [isHeaderVisible, setIsHeaderVisible] = useState(false)
  const [isMetricsVisible, setIsMetricsVisible] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const metricsRef = useRef<HTMLDivElement>(null)

  const activeData = view === 'today' ? todayData : weekData
  const activeMetrics = view === 'today' ? todayMetrics : weekMetrics
  const now = dayjs().tz('Asia/Manila')

  // Run the 2-second timer to perfectly match the RegistrySkeleton
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  // Trigger animations ONLY after loading has finished
  useEffect(() => {
    if (isLoading) return // Wait for curtain to drop

    const timer = setTimeout(() => setDrawLine(true), 500)
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }

    const headerObserver = new IntersectionObserver(
      ([entry]) => setIsHeaderVisible(entry.isIntersecting),
      observerOptions,
    )
    const metricsObserver = new IntersectionObserver(
      ([entry]) => setIsMetricsVisible(entry.isIntersecting),
      observerOptions,
    )

    if (headerRef.current) headerObserver.observe(headerRef.current)
    if (metricsRef.current) metricsObserver.observe(metricsRef.current)

    return () => {
      clearTimeout(timer)
      headerObserver.disconnect()
      metricsObserver.disconnect()
    }
  }, [isLoading])

  return (
    <>
      {/* 1. CINEMATIC SKELETON */}
      <RegistrySkeleton />

      {/* 2. DASHBOARD CONTENT */}
      {/* Hidden during the 2-second load, then fades in seamlessly */}
      <div
        className={`min-h-screen bg-white dark:bg-[#050505] text-[#251101] dark:text-zinc-100 pt-24 md:pt-32 pb-32 px-4 md:px-8 selection:bg-zinc-100 overflow-x-hidden font-sans transition-opacity duration-1000 ${
          isLoading ? 'opacity-0 h-screen overflow-hidden' : 'opacity-100'
        }`}
      >
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
                  <p className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                    Clinical Schedule
                  </p>
                </div>
                <h1
                  className={`text-[28px] md:text-[48px] font-light tracking-tighter font-serif leading-none transition-all duration-[1200ms] delay-300 ease-out ${
                    isHeaderVisible
                      ? 'opacity-100 translate-y-0 blur-0'
                      : 'opacity-0 translate-y-8 blur-md'
                  }`}
                >
                  {now.format('dddd')},{' '}
                  <span className="text-[#595f72]">{now.format('MMMM D')}</span>
                </h1>
              </div>

              <div
                className={`self-end md:self-auto inline-flex items-center bg-zinc-50 dark:bg-zinc-900/50 p-1.5 rounded-full border border-zinc-100 dark:border-zinc-800/50 relative transition-all duration-1000 delay-500 ${
                  isHeaderVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
              >
                <div
                  className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-zinc-800 rounded-full shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    view === 'week' ? 'translate-x-full' : 'translate-x-0'
                  }`}
                />
                <button
                  onClick={() => setView('today')}
                  className={`relative z-10 w-28 md:w-36 py-2.5 text-[7px] md:text-[9px] uppercase tracking-[0.3em] font-medium transition-colors duration-300 font-serif ${view === 'today' ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'}`}
                >
                  Today
                </button>
                <button
                  onClick={() => setView('week')}
                  className={`relative z-10 w-28 md:w-36 py-2.5 text-[7px] md:text-[9px] uppercase tracking-[0.3em] font-medium transition-colors duration-300 font-serif ${view === 'week' ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'}`}
                >
                  Next 7 Days
                </button>
              </div>
            </header>

            <section
              ref={metricsRef}
              className={`flex flex-col gap-8 md:gap-10 transition-all duration-[1200ms] ease-out ${isMetricsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl overflow-hidden shadow-sm">
                <MetricBlock
                  label="Projected Revenue"
                  value={`₱${activeMetrics.projectedRevenue.toLocaleString()}`}
                  delay="delay-[0ms]"
                  visible={isMetricsVisible}
                />
                <MetricBlock
                  label="Settled Revenue"
                  value={`₱${activeMetrics.settledRevenue.toLocaleString()}`}
                  highlight
                  delay="delay-[100ms]"
                  visible={isMetricsVisible}
                />
                <MetricBlock
                  label="Pending Revenue"
                  value={`₱${activeMetrics.pendingRevenue.toLocaleString()}`}
                  delay="delay-[200ms]"
                  visible={isMetricsVisible}
                />
                <div className="bg-white dark:bg-[#050505] p-5 md:p-8 flex flex-col justify-between min-h-[140px] md:min-h-[160px] group transition-all hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                  <p className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                    Completion Rate
                  </p>
                  <div>
                    <p className="text-[20px] md:text-[32px] font-light font-serif tracking-tight tabular-nums text-[#251101] dark:text-zinc-100">
                      {activeMetrics.completionRate}%
                    </p>
                    <div className="w-full h-[1.5px] bg-zinc-100 dark:bg-zinc-900 mt-2 mb-1 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#251101] dark:bg-white transition-all duration-1000 ease-out"
                        style={{
                          width: isMetricsVisible ? `${activeMetrics.completionRate}%` : '0%',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <BentoTable data={activeData} showDate={view === 'week'} />
            </section>

            <div className="pt-8 md:pt-12 flex justify-center border-t border-zinc-50 dark:border-zinc-900/50 opacity-40 hover:opacity-100 transition-opacity">
              <BackToHome />
            </div>
          </div>
        </FadeIn>
      </div>
    </>
  )
}

function MetricBlock({
  label,
  value,
  highlight = false,
  delay = '',
  visible = false,
}: {
  label: string
  value: string
  highlight?: boolean
  delay?: string
  visible?: boolean
}) {
  return (
    <div
      className={`bg-white dark:bg-[#050505] p-5 md:p-8 flex flex-col justify-between min-h-[140px] md:min-h-[160px] group transition-all duration-[1200ms] ease-out ${delay} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } hover:bg-zinc-50 dark:hover:bg-zinc-900/20`}
    >
      <p className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
        {label}
      </p>
      <div>
        <p
          className={`text-[20px] md:text-[32px] font-light font-serif tracking-tight tabular-nums ${highlight ? 'text-[#248232] dark:text-[#48a9a6]' : 'text-[#251101] dark:text-zinc-100'}`}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

function BentoTable({ data, showDate }: { data: MergedAppointment[]; showDate: boolean }) {
  if (data.length === 0)
    return (
      <div className="py-24 flex flex-col items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800">
        <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-[#595f72] font-serif">
          No appointments scheduled
        </p>
      </div>
    )

  const now = dayjs().tz('Asia/Manila')
  const nowUnix = now.valueOf()
  const isPast6PM = now.hour() >= 18

  const ongoingIndex = data.findIndex((apt) => {
    if (apt.status === 'cancelled') return false // Skip cancelled

    const startUnix = dayjs(apt.appointmentDate).tz('Asia/Manila').valueOf()
    const endUnix = startUnix + 60 * 60 * 1000
    return nowUnix >= startUnix && nowUnix < endUnix
  })

  const upcomingIndex = data.findIndex((apt) => {
    if (apt.status === 'cancelled') return false // Skip cancelled

    return dayjs(apt.appointmentDate).tz('Asia/Manila').valueOf() > nowUnix
  })

  return (
    <div className="w-full relative overflow-visible">
      <div className="flex flex-col">
        {data.map((apt, index) => {
          const isOngoing = index === ongoingIndex
          const isUpcoming = index === upcomingIndex
          const hasOngoing = ongoingIndex !== -1

          const isTodayTable = !showDate
          const isWeekTable = showDate

          const isTodaySticky = isTodayTable && (isOngoing || (!hasOngoing && isUpcoming))
          const isWeekSticky = isWeekTable && isPast6PM && isUpcoming

          const isSticky = isTodaySticky || isWeekSticky
          const showUpcomingLabel = isUpcoming && (isTodayTable || (isWeekTable && isPast6PM))

          return (
            <AppointmentRow
              key={apt.id}
              apt={apt}
              showDate={showDate}
              isSticky={isSticky}
              isOngoing={isOngoing}
              showUpcomingLabel={showUpcomingLabel}
            />
          )
        })}
      </div>
    </div>
  )
}

function AppointmentRow({
  apt,
  showDate,
  isSticky,
  isOngoing,
  showUpcomingLabel,
}: {
  apt: MergedAppointment
  showDate: boolean
  isSticky: boolean
  isOngoing: boolean
  showUpcomingLabel: boolean
}) {
  const [isVisible, setIsVisible] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: 0.1,
      rootMargin: '0px 0px -20px 0px',
    })
    if (rowRef.current) observer.observe(rowRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={rowRef}
      style={
        isSticky ? { position: 'sticky', top: '80px', zIndex: 50, transform: 'translateZ(0)' } : {}
      }
      className={`
        flex flex-row items-start justify-between gap-4 md:gap-0
        py-8 px-5 md:px-6 transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isSticky ? 'bg-white/95 dark:bg-[#050505]/95 backdrop-blur-md shadow-sm' : 'bg-transparent border-b border-zinc-100 dark:border-zinc-900/50'} 
        hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10
        ${isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-sm'}
        font-serif
      `}
    >
      {/* COLUMN 1: TIME & LABEL */}
      <div className="w-20 md:w-32 shrink-0 relative flex flex-col items-start gap-1">
        {isSticky && (
          <div
            className={`absolute -left-5 top-0 bottom-0 w-[2px] ${isOngoing ? 'bg-[#248232]' : 'bg-[#48a9a6]'}`}
          />
        )}
        {(isOngoing && !showDate) || showUpcomingLabel ? (
          <div className="flex flex-col items-start gap-1 leading-none">
            {isOngoing && !showDate && (
              <span className="text-[10px] text-[#248232] uppercase tracking-[0.2em] font-bold animate-pulse">
                ● Ongoing
              </span>
            )}
            {showUpcomingLabel && (
              <span className="text-[10px] text-[#48a9a6] uppercase tracking-[0.2em] font-medium">
                Upcoming
              </span>
            )}
            <span
              className={`text-[12px] whitespace-nowrap font-light tracking-widest tabular-nums ${isOngoing ? 'text-[#248232]' : 'text-[#251101] dark:text-zinc-100'}`}
            >
              {formatPHTime(apt.appointmentDate)}
            </span>
          </div>
        ) : (
          <span className="text-[12px] whitespace-nowrap font-light tracking-widest tabular-nums text-[#251101] dark:text-zinc-100 leading-none">
            {formatPHTime(apt.appointmentDate)}
          </span>
        )}
      </div>

      {/* COLUMN 2: PATIENT & SERVICES */}
      <div className="flex-1 min-w-0 flex flex-col items-start gap-1 px-2 md:px-8">
        <span className="text-[12px] text-[#251101] font-medium font-serif tracking-tight capitalize dark:text-zinc-100 leading-none">
          {apt.firstName} {apt.surname}
        </span>
        <div className="flex flex-wrap items-center gap-y-1 leading-none">
          {[...apt.services].sort().map((s, i) => (
            <React.Fragment key={i}>
              <span className="text-[8px] capitalize tracking-tight text-[#595f72] dark:text-zinc-400">
                {s}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* COLUMN 3: STATUS BADGE */}
      <div className="shrink-0 text-right flex flex-start w-20 md:w-32 leading-none">
        <StatusBadge status={apt.status} />
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed: 'text-[#248232]',
    pending: 'text-amber-700/60',
    completed: 'text-[#48a9a6]',
    cancelled: 'text-[#d7263d]',
  }
  return (
    <span
      className={`text-[12px] uppercase font-medium tracking-[0.1em] font-serif dark:text-zinc-100 leading-none ${styles[status]}`}
    >
      {status}
    </span>
  )
}
