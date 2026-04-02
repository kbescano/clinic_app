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

interface DashboardProps {
  todayData: MergedAppointment[]
  weekData: MergedAppointment[]
  metrics: {
    projectedRevenue: number
    settledRevenue: number
    pendingRevenue: number
    completionRate: number
    totalManifestWorkload: number
    serviceCounts: Record<string, number>
  }
}

const formatPHTime = (dateStr: string) => dayjs(dateStr).tz('Asia/Manila').format('hh:mm A')

export default function SpecialistDashboardClient({
  todayData,
  weekData,
  metrics,
}: DashboardProps) {
  const [drawLine, setDrawLine] = useState(false)

  useEffect(() => {
    // Triggers the "Atelier" drawline animation on mount
    const timer = setTimeout(() => setDrawLine(true), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 pt-24 md:pt-32 pb-32 overflow-x-visible">
      <FadeIn>
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          {/* HEADER: With Reactive Drawline */}
          <header className="flex items-start gap-4 md:gap-5 mb-12 md:mb-16">
            <div
              className={`w-[1px] bg-zinc-900 dark:bg-white transition-all duration-1000 ease-out origin-top ${
                drawLine ? 'h-10 md:h-12 opacity-100' : 'h-0 opacity-0'
              }`}
            />
            <div className="space-y-1">
              <p className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                Clinical
              </p>
              <h2 className="text-[20px] md:text-[24px] text-[#251101]  font-light tracking-tight font-serif uppercase leading-none">
                Daily Schedule
              </h2>
            </div>
          </header>

          {/* BENTO BOX METRICS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-zinc-100 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-900 mb-16 md:mb-20 overflow-hidden shadow-sm">
            <div className="lg:col-span-6 bg-white dark:bg-black p-8 md:p-12 flex flex-col justify-center">
              <p className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] text-[#595f72] mb-4 font-serif ">
                Projected Revenue
              </p>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-2xl md:text-3xl font-light text-[#251101] tracking-tighter font-serif">
                  ₱{metrics.projectedRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex gap-6">
                <div className="flex flex-col border-l border-[#595f72] dark:border-zinc-800 pl-4">
                  <span className="text-[7px] md:text-[8px] uppercase tracking-widest text-[#595f72] mb-1">
                    Settled
                  </span>
                  <span className="text-sm font-light text-[#251101] font-serif">
                    ₱{metrics.settledRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col border-l border-[#595f72] dark:border-zinc-800 pl-4">
                  <span className="text-[7px] md:text-[8px] uppercase tracking-widest text-[#595f72] mb-1">
                    Pending
                  </span>
                  <span className="text-sm font-light font-serif text-[#595f72]">
                    ₱{metrics.pendingRevenue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 bg-white dark:bg-black p-8 md:p-12 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-zinc-100 dark:border-zinc-900">
              <p className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] text-[#595f72] mb-4 font-serif ">
                Efficiency
              </p>
              <span className="text-xl md:text-2xl font-light text-[#251101] tracking-tighter font-serif mb-6">
                {metrics.completionRate}%
              </span>
              <div className="w-full h-[1px] bg-zinc-50 dark:bg-zinc-900">
                <div
                  className="h-full bg-[#251101] dark:bg-white transition-all duration-1000"
                  style={{ width: `${metrics.completionRate}%` }}
                />
              </div>
            </div>

            <div className="lg:col-span-3 bg-white dark:bg-black p-8 md:p-12 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-zinc-100 dark:border-zinc-900">
              <div>
                <p className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] text-[#595f72] mb-4 font-serif ">
                  Services
                </p>
                <span className="text-xl md:text-2xl font-light text-[#251101] tracking-tighter font-serif">
                  {metrics.totalManifestWorkload}
                </span>
              </div>
              <div className="flex flex-col gap-2 mt-6">
                {Object.entries(metrics.serviceCounts).map(([name, count]) => (
                  <div
                    key={name}
                    className="flex justify-between items-end gap-2 border-b border-zinc-50 dark:border-zinc-900/50 py-1"
                  >
                    <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-[#595f72] font-serif">
                      {name}
                    </span>
                    <span className="text-[10px] font-serif tabular-nums text-[#251101]">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TABLES */}
          <div className="space-y-16 md:space-y-20">
            <section>
              <div className="flex items-baseline justify-between mb-6 border-b border-zinc-900 dark:border-white pb-3">
                <h3 className="text-[9px] md:text-[10px] uppercase tracking-[0.5em] font-medium text-[#251101] font-serif ">
                  Today&apos;s Sessions
                </h3>
              </div>
              <BentoTable data={todayData} showDate={false} />
            </section>
            <section>
              <div className="flex items-baseline justify-between mb-6 border-b border-zinc-100 dark:border-zinc-900 pb-3">
                <h3 className="text-[9px] md:text-[10px] uppercase tracking-[0.5em] font-medium font-serif text-zinc-400 ">
                  Weekly Overview
                </h3>
              </div>
              <BentoTable data={weekData} showDate={true} />
            </section>
          </div>

          <div className="mt-20 pt-10 flex justify-center border-t border-zinc-50 dark:border-zinc-900 opacity-40 hover:opacity-100 transition-opacity">
            <BackToHome />
          </div>
        </div>
      </FadeIn>
    </div>
  )
}

function BentoTable({ data, showDate }: { data: MergedAppointment[]; showDate: boolean }) {
  if (data.length === 0)
    return (
      <div className="py-16 text-center text-[10px] uppercase tracking-widest text-zinc-300">
        Archive Empty
      </div>
    )

  const now = dayjs().tz('Asia/Manila')
  const nowUnix = now.valueOf()

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
        <tbody className="block md:table-row-group divide-y divide-zinc-50 dark:divide-zinc-900/50 overflow-visible">
          {data.map((apt, index) => {
            const isOngoing = index === ongoingIndex
            const isUpcoming = index === upcomingIndex

            // Exclusive sticky logic: Ongoing priority, then Upcoming
            const hasOngoing = ongoingIndex !== -1
            const isSticky = !showDate && (isOngoing || (!hasOngoing && isUpcoming))

            return (
              <tr
                key={apt.id}
                style={
                  isSticky
                    ? {
                        position: 'sticky',
                        top: '80px',
                        zIndex: 50,
                        transform: 'translateZ(0)', // Fixes mobile sticky flickering
                      }
                    : {}
                }
                className={`
                  flex flex-col justify-around min-h-[160px] 
                  py-2 md:py-0 md:min-h-0 md:table-row group transition-all duration-700 
                  ${
                    isSticky
                      ? 'bg-white/95 dark:bg-[#050505]/95 backdrop-blur-sm shadow-xl border-b border-zinc-100 dark:border-zinc-800'
                      : 'bg-transparent'
                  } 
                  hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10
                `}
              >
                {/* TIME COLUMN */}
                <td className="block md:table-cell py-0 md:py-8 pr-4 md:pr-8 align-baseline pl-4 md:pl-6 relative">
                  {(isOngoing || isUpcoming) && (
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-[1.5px] ${isOngoing ? 'bg-[#248232]' : 'bg-[#48a9a6]'}`}
                    />
                  )}

                  <div className="relative flex items-baseline">
                    <div className="absolute -top-4 md:-top-5 left-0 flex items-center gap-1.5 whitespace-nowrap">
                      {isOngoing && (
                        <span className="text-[6px] md:text-[7px] text-[#248232] uppercase tracking-[0.2em] font-bold font-serif animate-pulse">
                          ● Ongoing
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="text-[6px] md:text-[7px] text-[#48a9a6] uppercase tracking-[0.2em] font-medium font-serif">
                          Upcoming
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] md:text-[13px] font-light tracking-widest tabular-nums leading-none ${isOngoing ? 'text-[#248232] font-medium' : 'text-zinc-900 dark:text-zinc-100'}`}
                    >
                      {formatPHTime(apt.appointmentDate)}
                    </span>
                  </div>
                </td>

                {/* NAME & EMAIL COLUMN */}
                <td className="block md:table-cell py-0 md:py-8 px-4 md:px-8 align-baseline">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[12px] md:text-[14px] text-[#251101] font-serif tracking-wide capitalize dark:text-zinc-100 leading-none">
                      {apt.firstName} {apt.surname}
                    </span>
                    <span className="text-[9px] md:hidden text-zinc-400 font-serif lowercase tracking-tight leading-none">
                      {apt.email}
                    </span>
                  </div>
                </td>

                {/* SERVICES COLUMN */}
                <td className="block md:table-cell py-0 md:py-8 px-4 md:px-8 align-baseline">
                  <div className="flex flex-wrap gap-1.5 items-baseline">
                    {apt.services.map((s, i) => (
                      <span
                        key={i}
                        className="text-[6px] md:text-[7px] uppercase tracking-[0.15em] border border-zinc-300 dark:border-zinc-800 px-1.5 py-0.5 font-medium text-[#595f72]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </td>

                {/* STATUS COLUMN */}
                <td className="block md:table-cell py-0 md:py-8 pl-4 md:pl-8 align-baseline text-left md:text-right pr-4 md:pr-6">
                  <div className="flex md:justify-end items-baseline">
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
      className={`text-[8px] md:text-[9px] uppercase tracking-[0.3em] font-bold font-serif ${styles[status]}`}
    >
      {status}
    </span>
  )
}
