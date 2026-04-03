'use client'

import React, { useEffect, useState } from 'react'
import FadeIn from '../../components/FadeIn'
import { ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import BackToHome from '../../components/BackToHome'
import { RegistrySkeleton } from '../../components/RegistrySkeleton'

export const dynamic = 'force-dynamic'

interface AnalyticsData {
  periodRevenue: number
  prevPeriodRevenue: number
  growth: number
  categorySales: Record<string, number>
  totalAppointments: number
  recent: {
    id: string
    firstName: string
    surname: string
    service: string
    price: number
    time: string
    date: string
  }[]
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [range, setRange] = useState('today')
  const [drawLine, setDrawLine] = useState(false)

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/analytics?range=${range}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error(err)
        setError(true)
      } finally {
        setLoading(false)
        setTimeout(() => setDrawLine(true), 500)
      }
    }
    fetchAnalytics()
  }, [range])

  if (error) return <ErrorState />

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-[#251101] dark:text-zinc-100 pt-24 md:pt-32 pb-32 px-4 md:px-8 selection:bg-zinc-100 overflow-x-hidden font-sans">
      <FadeIn>
        {/* UNIFORM SPACING WRAPPER: Locked to max-w-4xl for focused reading width */}
        <div className="max-w-4xl mx-auto flex flex-col gap-10 md:gap-20">
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
                  Clinical Metrics
                </p>
              </div>
              <h1 className="text-[28px] md:text-[48px] font-light tracking-tighter font-serif leading-none">
                Analytics
              </h1>
            </div>

            {/* LUXURY SEGMENTED CONTROL (4-Way Slider) */}
            <div className="self-end md:self-auto relative flex items-center">
              {loading && (
                <div className="absolute -left-6 top-1/2 -translate-y-1/2">
                  <RegistrySkeleton />
                </div>
              )}
              <div className="inline-flex items-center bg-zinc-50 dark:bg-zinc-900/50 p-1.5 rounded-full border border-zinc-100 dark:border-zinc-800/50 relative">
                <div
                  className="absolute top-1.5 bottom-1.5 w-[72px] sm:w-[84px] md:w-28 bg-white dark:bg-zinc-800 rounded-full shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{
                    transform:
                      range === 'today'
                        ? 'translateX(0)'
                        : range === '7days'
                          ? 'translateX(100%)'
                          : range === 'thisMonth'
                            ? 'translateX(200%)'
                            : 'translateX(300%)',
                  }}
                />
                <button
                  onClick={() => setRange('today')}
                  className={`relative z-10 w-[72px] sm:w-[84px] md:w-28 py-2.5 md:py-2 text-[6px] sm:text-[7px] md:text-[8px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-medium transition-colors duration-300 font-serif ${
                    range === 'today' ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setRange('7days')}
                  className={`relative z-10 w-[72px] sm:w-[84px] md:w-28 py-2.5 md:py-2 text-[6px] sm:text-[7px] md:text-[8px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-medium transition-colors duration-300 font-serif ${
                    range === '7days' ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setRange('thisMonth')}
                  className={`relative z-10 w-[72px] sm:w-[84px] md:w-28 py-2.5 md:py-2 text-[6px] sm:text-[7px] md:text-[8px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-medium transition-colors duration-300 font-serif ${
                    range === 'thisMonth' ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setRange('all')}
                  className={`relative z-10 w-[72px] sm:w-[84px] md:w-28 py-2.5 md:py-2 text-[6px] sm:text-[7px] md:text-[8px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-medium transition-colors duration-300 font-serif ${
                    range === 'all' ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'
                  }`}
                >
                  All Time
                </button>
              </div>
            </div>
          </header>

          <section
            className={`animate-in fade-in duration-700 delay-150 ease-out fill-mode-both flex flex-col gap-10 md:gap-14 ${loading ? 'opacity-50 blur-[2px] transition-all' : 'opacity-100 blur-0 transition-all'}`}
          >
            {/* PRIMARY METRIC GRID (Atelier Hairline Design) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50 shadow-sm">
              {/* Revenue Slot */}
              <div className="md:col-span-6 bg-white dark:bg-[#050505] p-6 md:p-10 flex flex-col justify-between group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/20">
                <p className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] mb-6 md:mb-8 font-serif">
                  Period Revenue
                </p>
                <div>
                  <div className="flex items-baseline gap-2 mb-6 md:mb-8">
                    <span className="text-[28px] md:text-[40px] font-light tracking-tight font-serif tabular-nums text-[#251101] dark:text-zinc-100">
                      ₱{data?.periodRevenue?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-6 md:gap-10">
                    <div className="flex flex-col border-l border-zinc-200 dark:border-zinc-800/50 pl-4 md:pl-5">
                      <span className="text-[6px] md:text-[8px] uppercase tracking-[0.3em] text-[#595f72] mb-1.5 font-serif">
                        Previous
                      </span>
                      <span className="text-[12px] md:text-[14px] font-serif tabular-nums text-[#251101] dark:text-zinc-100">
                        ₱{data?.prevPeriodRevenue?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col border-l border-zinc-200 dark:border-zinc-800/50 pl-4 md:pl-5">
                      <span className="text-[6px] md:text-[8px] uppercase tracking-[0.3em] text-[#595f72] mb-1.5 font-serif">
                        Growth
                      </span>
                      <span
                        className={`text-[12px] md:text-[14px] font-serif tabular-nums ${(data?.growth ?? 0) >= 0 ? 'text-[#248232] dark:text-[#48a9a6]' : 'text-[#d7263d]'}`}
                      >
                        {(data?.growth ?? 0) > 0 ? '+' : ''}
                        {data?.growth}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Efficiency Slot */}
              <div className="md:col-span-3 bg-white dark:bg-[#050505] p-6 md:p-10 flex flex-col justify-between group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/20">
                <p className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] mb-6 md:mb-8 font-serif">
                  Growth Index
                </p>
                <div>
                  <span className="text-[20px] md:text-[28px] font-light tracking-tight font-serif mb-4 md:mb-6 block text-[#251101] dark:text-zinc-100 tabular-nums">
                    {data?.growth}%
                  </span>
                  <div className="w-full h-[1px] bg-zinc-100 dark:bg-zinc-900 mt-2">
                    <div
                      className={`h-full transition-all duration-1000 ${(data?.growth ?? 0) >= 0 ? 'bg-[#251101] dark:bg-white' : 'bg-[#d7263d]'}`}
                      style={{
                        width: `${Math.min(Math.max(Math.abs(data?.growth || 0), 0), 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Category List Slot */}
              <div className="md:col-span-3 bg-white dark:bg-[#050505] p-6 md:p-10 flex flex-col justify-between group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/20">
                <div>
                  <p className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] mb-4 md:mb-6 font-serif">
                    Total Sessions
                  </p>
                  <span className="text-[20px] md:text-[28px] font-light tracking-tight font-serif text-[#251101] dark:text-zinc-100 tabular-nums">
                    {data?.totalAppointments}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5 mt-6 md:mt-8">
                  {Object.entries(data?.categorySales || {}).length === 0 && (
                    <span className="text-[9px] md:text-[10px] text-[#595f72] font-serif ">
                      No data
                    </span>
                  )}
                  {Object.entries(data?.categorySales || {}).map(([name, val]) => (
                    <div
                      key={name}
                      className="flex justify-between items-start gap-4 border-b border-zinc-100 dark:border-zinc-900/50 py-2"
                    >
                      <span className="text-[7px] md:text-[8px] uppercase tracking-[0.2em] text-[#595f72] font-serif text-wrap leading-[1.5]">
                        {name}
                      </span>
                      <span className="text-[9px] md:text-[10px] font-serif tabular-nums text-[#251101] dark:text-zinc-100 shrink-0 mt-0.5">
                        ₱{val.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECONDARY SECTION: RECENT FEED */}
            <div className="w-full flex flex-col gap-6 md:gap-8">
              <div className="flex items-baseline justify-between border-b border-zinc-100 dark:border-zinc-900/50 pb-3">
                <h2 className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif flex items-center gap-2">
                  <ClockIcon className="w-3.5 h-3.5" /> Recent Activity
                </h2>
              </div>

              <div className="flex flex-col border-b border-zinc-100 dark:border-zinc-900/50">
                {data?.recent && data.recent.length > 0 ? (
                  data.recent.map((booking) => (
                    <div
                      key={booking.id}
                      className="group py-5 px-5 md:px-2 transition-all duration-500 flex flex-row justify-between items-center hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 border-t border-zinc-100 dark:border-zinc-900/50 first:border-t-0"
                    >
                      <div className="flex flex-col gap-1 md:gap-1.5">
                        <span className="text-[14px] md:text-[16px] font-serif tracking-tight text-[#251101] dark:text-zinc-100 capitalize leading-none">
                          {booking.firstName} {booking.surname}
                        </span>
                        <div className="flex items-center mt-0.5">
                          <span className="text-[6px] md:text-[7px] text-[#595f72] uppercase tracking-[0.2em] px-1.5 py-0.5 font-medium font-serif">
                            {booking.service}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 md:gap-1 text-right">
                        <span className="text-[13px] md:text-[14px] font-light font-serif text-[#248232] dark:text-[#48a9a6] tabular-nums leading-none">
                          +₱{booking.price?.toLocaleString()}
                        </span>
                        <span className="text-[8px] md:text-[9px] text-[#595f72] uppercase tracking-[0.2em] font-serif leading-none mt-0.5">
                          {booking.date}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-24 flex items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 mt-2">
                    <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-[#595f72] font-serif">
                      Archive Clear
                    </p>
                  </div>
                )}
              </div>
            </div>
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

function ErrorState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#050505]">
      <div className="text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <p className="text-[9px] uppercase tracking-[0.5em] text-[#595f72] font-serif">
          Data Stream Error
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-[#251101] dark:bg-white text-white dark:text-[#251101] text-[8px] uppercase tracking-[0.3em] font-serif transition-all hover:opacity-80"
        >
          Retry Sync
        </button>
      </div>
    </div>
  )
}
