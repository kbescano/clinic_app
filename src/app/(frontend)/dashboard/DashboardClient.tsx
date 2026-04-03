'use client'

import React, { useState, useEffect } from 'react'
import FadeIn from '../components/FadeIn'
import BackToHome from '../components/BackToHome'
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
const formatPHDate = (dateStr: string) => dayjs(dateStr).tz('Asia/Manila').format('MMM D, YYYY')

export default function SpecialistDashboardClient({
  todayData,
  weekData,
  todayMetrics,
  weekMetrics,
}: DashboardProps) {
  const [view, setView] = useState<'today' | 'week'>('today')
  const [drawLine, setDrawLine] = useState(false)

  const activeData = view === 'today' ? todayData : weekData
  const activeMetrics = view === 'today' ? todayMetrics : weekMetrics

  const now = dayjs().tz('Asia/Manila')

  useEffect(() => {
    const timer = setTimeout(() => setDrawLine(true), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-[#251101] dark:text-zinc-100 pt-24 md:pt-32 pb-32 px-4 md:px-8 selection:bg-zinc-100 overflow-x-hidden font-sans">
      <FadeIn>
        {/* UNIFORM SPACING WRAPPER: Locked to max-w-4xl for focused, editorial reading width */}
        <div className="max-w-4xl mx-auto flex flex-col gap-14 md:gap-20">
          {/* HEADER SECTION */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12">
            <div className="space-y-4 relative">
              <div
                className={`absolute -left-4 md:-left-8 top-0 w-[1px] bg-zinc-900 dark:bg-white transition-all duration-1000 ease-out origin-top ${
                  drawLine ? 'h-full opacity-100' : 'h-0 opacity-0'
                }`}
              />
              <div className="flex items-center gap-4">
                <p className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                  Clinical Schedule
                </p>
              </div>
              <h1 className="text-[28px] md:text-[48px] font-light tracking-tighter font-serif leading-none">
                {now.format('dddd')},<br />
                <span className="text-[#595f72]">{now.format('MMMM D')}</span>
              </h1>
            </div>

            {/* LUXURY SEGMENTED CONTROL (self-end anchors it to the right on mobile) */}
            <div className="self-end md:self-auto inline-flex items-center bg-zinc-50 dark:bg-zinc-900/50 p-1.5 rounded-full border border-zinc-100 dark:border-zinc-800/50 relative">
              <div
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-zinc-800 rounded-full shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  view === 'week' ? 'translate-x-full' : 'translate-x-0'
                }`}
              />
              <button
                onClick={() => setView('today')}
                className={`relative z-10 w-28 md:w-36 py-2.5 text-[7px] md:text-[9px] uppercase tracking-[0.3em] font-medium transition-colors duration-300 font-serif ${
                  view === 'today' ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setView('week')}
                className={`relative z-10 w-28 md:w-36 py-2.5 text-[7px] md:text-[9px] uppercase tracking-[0.3em] font-medium transition-colors duration-300 font-serif ${
                  view === 'week' ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'
                }`}
              >
                Next 7 Days
              </button>
            </div>
          </header>

          {/* METRICS SECTION */}
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 ease-out fill-mode-both flex flex-col gap-8 md:gap-10">
            {/* 1px Grid Borders */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50">
              <MetricBlock
                label="Projected Revenue"
                value={`₱${activeMetrics.projectedRevenue.toLocaleString()}`}
              />
              <MetricBlock
                label="Settled Revenue"
                value={`₱${activeMetrics.settledRevenue.toLocaleString()}`}
                highlight
              />
              <MetricBlock
                label="Pending Revenue"
                value={`₱${activeMetrics.pendingRevenue.toLocaleString()}`}
              />
              <div className="bg-white dark:bg-[#050505] p-5 md:p-8 flex flex-col justify-between min-h-[140px] md:min-h-[160px] group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/20">
                <p className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                  Completion Rate
                </p>
                <div>
                  <p className="text-[20px] md:text-[32px] font-light font-serif tracking-tight tabular-nums text-[#251101] dark:text-zinc-100">
                    {activeMetrics.completionRate}%
                  </p>
                  <div className="w-full h-[1px] bg-zinc-100 dark:bg-zinc-900 mt-2 mb-1">
                    <div
                      className="h-full bg-[#251101] dark:bg-white transition-all duration-1000"
                      style={{ width: `${activeMetrics.completionRate}%` }}
                    />
                  </div>
                  <p className="text-[6px] md:text-[8px] uppercase tracking-widest text-[#595f72] font-serif mt-2">
                    {activeMetrics.totalCompletedServices} / {activeMetrics.totalManifestWorkload}{' '}
                    Workloads
                  </p>
                </div>
              </div>
            </div>

            {/* Service Breakdown */}
            <div className="flex flex-wrap gap-4 md:gap-8 pt-2">
              <p className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif w-full mb-1">
                Service Manifest Breakdown
              </p>
              {Object.entries(activeMetrics.serviceCounts).length === 0 && (
                <span className="text-[10px] md:text-[12px] font-serif text-zinc-400">
                  No workloads found.
                </span>
              )}
              {Object.entries(activeMetrics.serviceCounts).map(([name, count]) => (
                <div key={name} className="flex items-center gap-2 md:gap-3">
                  <span className="text-[12px] md:text-[16px] font-serif text-[#251101] dark:text-zinc-100 tabular-nums leading-none">
                    {count}
                  </span>
                  <span className="text-[7px] md:text-[9px] uppercase tracking-widest text-[#595f72] font-serif leading-none">
                    × {name}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* TABLE SECTION */}
          <section className="animate-in fade-in duration-1000 delay-300 fill-mode-both">
            <BentoTable data={activeData} showDate={view === 'week'} />
          </section>

          {/* FOOTER */}
          <div className="pt-8 md:pt-12 flex justify-center border-t border-zinc-50 dark:border-zinc-900/50 opacity-40 hover:opacity-100 transition-opacity">
            <BackToHome />
          </div>
        </div>
      </FadeIn>
    </div>
  )
}

function MetricBlock({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="bg-white dark:bg-[#050505] p-5 md:p-8 flex flex-col justify-between min-h-[140px] md:min-h-[160px] group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/20">
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
    const startUnix = dayjs(apt.appointmentDate).tz('Asia/Manila').valueOf()
    const endUnix = startUnix + 60 * 60 * 1000
    return nowUnix >= startUnix && nowUnix < endUnix
  })

  const upcomingIndex = data.findIndex((apt) => {
    return dayjs(apt.appointmentDate).tz('Asia/Manila').valueOf() > nowUnix
  })

  return (
    <div className="w-full relative overflow-visible">
      <table className="w-full text-left border-collapse block md:table overflow-visible">
        <tbody className="block md:table-row-group md:divide-y md:divide-zinc-50 dark:md:divide-zinc-900/50 overflow-visible">
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
              <tr
                key={apt.id}
                style={
                  isSticky
                    ? {
                        position: 'sticky',
                        top: '80px',
                        zIndex: 50,
                        transform: 'translateZ(0)',
                      }
                    : {}
                }
                className={`
                  flex flex-row items-start justify-between gap-4 md:gap-0
                  py-5 px-5 md:px-0 md:py-0 md:min-h-0 md:table-row group transition-all duration-700 
                  ${
                    isSticky
                      ? 'bg-white/95 dark:bg-[#050505]/95 backdrop-blur-md shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border-b border-zinc-200 dark:border-zinc-800'
                      : 'bg-transparent border-b border-zinc-100 dark:border-zinc-900/50 md:border-b-0'
                  } 
                  hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10
                `}
              >
                {/* TIME COLUMN */}
                <td className="block md:table-cell w-16 md:w-32 shrink-0 pt-0.5 md:pt-0 py-0 md:py-8 pr-2 md:pr-8 align-top md:align-baseline pl-0 md:pl-6 relative">
                  {isSticky && (
                    <div
                      className={`absolute -left-5 md:left-0 top-0 bottom-0 w-[2px] ${isOngoing ? 'bg-[#248232]' : 'bg-[#48a9a6]'}`}
                    />
                  )}

                  <div className="flex flex-col md:relative items-start md:items-baseline gap-0.5 md:gap-0">
                    <div className="md:absolute md:-top-5 left-0 flex items-center gap-1.5 whitespace-nowrap">
                      {isOngoing && isTodayTable && (
                        <span className="text-[6px] md:text-[7px] text-[#248232] uppercase tracking-[0.2em] font-bold font-serif animate-pulse">
                          ● Ongoing
                        </span>
                      )}
                      {showUpcomingLabel && (
                        <span className="text-[6px] md:text-[7px] text-[#48a9a6] uppercase tracking-[0.2em] font-medium font-serif">
                          Upcoming
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] md:text-[14px] font-light tracking-widest tabular-nums leading-none font-serif ${isOngoing ? 'text-[#248232]' : 'text-[#251101] dark:text-zinc-100'}`}
                    >
                      {formatPHTime(apt.appointmentDate)}
                    </span>
                  </div>
                </td>

                {/* DATE COLUMN (Desktop Weekly View Only) */}
                {showDate && (
                  <td className="hidden md:table-cell py-0 md:py-8 px-0 md:px-8 align-top md:align-baseline w-40">
                    <span className="text-[11px] text-[#595f72] tracking-wider font-serif block leading-none">
                      {formatPHDate(apt.appointmentDate)}
                    </span>
                  </td>
                )}

                {/* NAME & MOBILE-COMBINED COLUMN */}
                <td className="flex-1 min-w-0 block md:table-cell py-0 md:py-8 px-0 md:px-8 align-top md:align-baseline">
                  <div className="flex flex-col gap-1.5 md:gap-1">
                    <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2 truncate">
                      <span className="text-[13px] md:text-[16px] text-[#251101] font-serif tracking-tight capitalize dark:text-zinc-100 leading-none truncate">
                        {apt.firstName} {apt.surname}
                      </span>
                      {/* Show date inline on mobile for Weekly View */}
                      {showDate && (
                        <span className="md:hidden text-[8px] text-[#595f72] font-serif tracking-wider whitespace-nowrap opacity-80">
                          {formatPHDate(apt.appointmentDate)}
                        </span>
                      )}
                    </div>

                    {/* Services (Visible on Mobile inside Name column) */}
                    <div className="flex md:hidden flex-wrap gap-1.5">
                      {apt.services.map((s, i) => (
                        <span
                          key={i}
                          className="text-[6px] uppercase tracking-[0.2em] border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 font-medium text-[#595f72] font-serif"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    <span className="text-[8px] md:hidden text-[#595f72] font-serif lowercase tracking-tight leading-none truncate opacity-60">
                      {apt.email}
                    </span>
                  </div>
                </td>

                {/* SERVICES COLUMN (Desktop Only) */}
                <td className="hidden md:table-cell py-0 md:py-8 px-0 md:px-8 align-top md:align-baseline">
                  <div className="flex flex-wrap gap-1.5 items-baseline">
                    {apt.services.map((s, i) => (
                      <span
                        key={i}
                        className="text-[8px] uppercase tracking-[0.2em] border border-zinc-200 dark:border-zinc-800 px-2 py-1 font-medium text-[#595f72] font-serif"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </td>

                {/* STATUS COLUMN */}
                <td className="shrink-0 block md:table-cell pt-0.5 md:pt-0 py-0 md:py-8 pl-0 md:pl-8 align-top md:align-baseline text-right pr-0 md:pr-6 w-20 md:w-32">
                  <div className="flex justify-end items-start md:items-baseline">
                    <StatusBadge status={apt.status} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
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
      className={`text-[7px] md:text-[9px] uppercase tracking-[0.3em] font-medium font-serif ${styles[status]}`}
    >
      {status}
    </span>
  )
}
