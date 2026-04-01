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
const formatPHDate = (dateStr: string) => dayjs(dateStr).tz('Asia/Manila').format('MMM D, YYYY')

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
              <p className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-zinc-400 font-serif italic">
                Clinical
              </p>
              <h2 className="text-[20px] md:text-[24px] font-light tracking-tight font-serif uppercase leading-none">
                Daily Schedule
              </h2>
            </div>
          </header>

          {/* BENTO BOX METRICS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-zinc-100 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-900 mb-16 md:mb-20 overflow-hidden shadow-sm">
            <div className="lg:col-span-6 bg-white dark:bg-black p-8 md:p-12 flex flex-col justify-center">
              <p className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] text-zinc-400 mb-4 font-serif italic">
                Projected Revenue
              </p>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-2xl md:text-3xl font-light tracking-tighter font-serif">
                  ₱{metrics.projectedRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex gap-6">
                <div className="flex flex-col border-l border-zinc-100 dark:border-zinc-800 pl-4">
                  <span className="text-[7px] md:text-[8px] uppercase tracking-widest text-zinc-400 mb-1">
                    Settled
                  </span>
                  <span className="text-sm font-light font-serif">
                    ₱{metrics.settledRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col border-l border-zinc-100 dark:border-zinc-800 pl-4">
                  <span className="text-[7px] md:text-[8px] uppercase tracking-widest text-zinc-400 mb-1">
                    Pending
                  </span>
                  <span className="text-sm font-light font-serif text-zinc-400">
                    ₱{metrics.pendingRevenue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 bg-white dark:bg-black p-8 md:p-12 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-zinc-100 dark:border-zinc-900">
              <p className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] text-zinc-400 mb-4 font-serif italic">
                Efficiency
              </p>
              <span className="text-xl md:text-2xl font-light tracking-tighter font-serif mb-6">
                {metrics.completionRate}%
              </span>
              <div className="w-full h-[1px] bg-zinc-50 dark:bg-zinc-900">
                <div
                  className="h-full bg-zinc-900 dark:bg-white transition-all duration-1000"
                  style={{ width: `${metrics.completionRate}%` }}
                />
              </div>
            </div>

            <div className="lg:col-span-3 bg-white dark:bg-black p-8 md:p-12 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-zinc-100 dark:border-zinc-900">
              <div>
                <p className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] text-zinc-400 mb-4 font-serif italic">
                  Services
                </p>
                <span className="text-xl md:text-2xl font-light tracking-tighter font-serif">
                  {metrics.totalManifestWorkload}
                </span>
              </div>
              <div className="flex flex-col gap-2 mt-6">
                {Object.entries(metrics.serviceCounts).map(([name, count]) => (
                  <div
                    key={name}
                    className="flex justify-between items-center border-b border-zinc-50 dark:border-zinc-900/50 py-1"
                  >
                    <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-zinc-500 font-serif">
                      {name}
                    </span>
                    <span className="text-[10px] font-serif tabular-nums text-zinc-400">
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
                <h3 className="text-[9px] md:text-[10px] uppercase tracking-[0.5em] font-medium font-serif italic">
                  Today&apos;s Sessions
                </h3>
              </div>
              <BentoTable data={todayData} showDate={false} />
            </section>
            <section>
              <div className="flex items-baseline justify-between mb-6 border-b border-zinc-100 dark:border-zinc-900 pb-3">
                <h3 className="text-[9px] md:text-[10px] uppercase tracking-[0.5em] font-medium font-serif text-zinc-400 italic">
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
  if (data.length === 0) return <div className="py-16 text-center">Archive Empty</div>

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
      {/* GRADIENT MASK (Mobile Only): 
        This creates the 'fade out' effect at the top of the table 
        so sticky items don't feel like a hard block.
      */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white dark:from-[#050505] to-transparent z-40 pointer-events-none opacity-60" />

      <table className="w-full text-left border-collapse block md:table">
        <tbody className="block md:table-row-group divide-y divide-zinc-50 dark:divide-zinc-900/50">
          {data.map((apt, index) => {
            const isOngoing = index === ongoingIndex
            const isUpcoming = index === upcomingIndex
            const isSticky = !showDate && (isOngoing || isUpcoming)

            // Adjust 80px based on your actual navbar height
            let stickyTop = '80px'
            if (isUpcoming && ongoingIndex !== -1) stickyTop = '150px'

            return (
              <tr
                key={apt.id}
                style={
                  isSticky
                    ? { position: 'sticky', top: stickyTop, zIndex: isOngoing ? 30 : 20 }
                    : {}
                }
                className={`block md:table-row group transition-all duration-700 ${
                  isSticky
                    ? 'bg-white/95 dark:bg-[#050505]/95 backdrop-blur-sm shadow-xl z-30'
                    : 'bg-transparent'
                } hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10`}
              >
                {/* TIME COLUMN: Reduced py-3 for mobile to keep cards small */}
                <td className="block md:table-cell py-3 pr-4 md:pr-8 align-top pl-4 md:pl-6 relative">
                  {isSticky && (
                    <div className="absolute left-0 top-0 bottom-0 w-[1.5px] bg-emerald-500" />
                  )}

                  <div className="flex flex-col">
                    <div className="h-3 md:h-4 flex items-center">
                      {!showDate && isOngoing && (
                        <span className="text-[6px] md:text-[7px] text-emerald-500 uppercase tracking-widest font-bold font-serif animate-pulse">
                          ● Ongoing
                        </span>
                      )}
                      {!showDate && isUpcoming && (
                        <span className="text-[6px] md:text-[7px] text-emerald-500 uppercase tracking-widest font-medium font-serif">
                          Upcoming
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] md:text-[13px] font-light tracking-widest tabular-nums mt-0.5 ${isOngoing ? 'text-emerald-600 font-medium' : 'text-zinc-900 dark:text-zinc-100'}`}
                    >
                      {formatPHTime(apt.appointmentDate)}
                    </span>
                  </div>
                </td>

                {showDate && (
                  <td className="block md:table-cell py-2 px-4 md:px-8 align-top">
                    <div className="hidden md:block h-4" />
                    <span className="text-[10px] md:text-[11px] tracking-wider text-zinc-400 font-serif italic mt-0.5 block">
                      {formatPHDate(apt.appointmentDate)}
                    </span>
                  </td>
                )}

                <td className="block md:table-cell py-2 px-4 md:px-8 align-top">
                  <div className="hidden md:block h-4" />
                  <span className="text-[12px] md:text-[14px] font-serif tracking-wide capitalize text-zinc-800 dark:text-zinc-100 mt-0.5 block">
                    {apt.firstName} {apt.surname}
                  </span>
                </td>

                <td className="block md:table-cell py-2 px-4 md:px-8 align-top">
                  <div className="hidden md:block h-4" />
                  <div className="flex flex-wrap gap-1.5 mt-0.5">
                    {apt.services.map((s, i) => (
                      <span
                        key={i}
                        className="text-[6px] md:text-[7px] uppercase tracking-[0.15em] border border-zinc-100 dark:border-zinc-800 px-1.5 py-0.5 italic font-medium text-zinc-400"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </td>

                <td className="block md:table-cell pb-4 md:pb-8 pl-4 md:pl-8 align-top text-right pr-4 md:pr-6">
                  <div className="hidden md:block h-4" />
                  <div className="mt-0.5">
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
    confirmed: 'text-emerald-700/60',
    pending: 'text-amber-700/60',
    completed: 'text-zinc-900 dark:text-white',
    cancelled: 'text-zinc-300',
  }
  return (
    <span
      className={`text-[8px] md:text-[9px] uppercase tracking-[0.3em] font-medium font-serif ${styles[status]}`}
    >
      {status}
    </span>
  )
}
