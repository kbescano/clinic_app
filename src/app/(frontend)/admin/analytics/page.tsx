'use client'

import React, { useEffect, useState } from 'react'
import FadeIn from '../../components/FadeIn'
import { ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/24/solid'
import BackToHome from '../../components/BackToHome'

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
    <div className="min-h-screen bg-white dark:bg-[#050505] text-[#251101] dark:text-zinc-100 pt-24 md:pt-32 pb-32 selection:bg-zinc-100 overflow-x-hidden">
      <FadeIn>
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          {/* HEADER (REDUCED FONT SCALE) */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
            <div className="flex items-start gap-4 md:gap-5">
              <div
                className={`w-[1px] bg-zinc-900 dark:bg-white transition-all duration-1000 ease-out origin-top ${
                  drawLine ? 'h-10 md:h-12 opacity-100' : 'h-0 opacity-0'
                }`}
              />
              <div className="space-y-1">
                <p className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif ">
                  Clinical Metrics
                </p>
                <h1 className="text-[20px] md:text-[24px] font-light tracking-tight font-serif uppercase leading-none">
                  Analytics
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4 self-end md:self-auto justify-end">
              <div className="relative group">
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="appearance-none bg-transparent border-none py-0 pl-0 pr-4 text-[8px] md:text-[9px] uppercase tracking-[0.25em] font-medium font-serif text-[#595f72] hover:text-[#251101] dark:hover:text-white cursor-pointer outline-none transition-colors text-right"
                >
                  <option value="today" className="text-right bg-white dark:bg-black">
                    Today
                  </option>
                  <option value="7days" className="text-right bg-white dark:bg-black">
                    Last 7 Days
                  </option>
                  <option value="thisMonth" className="text-right bg-white dark:bg-black">
                    This Month
                  </option>
                  <option value="all" className="text-right bg-white dark:bg-black">
                    All Time
                  </option>
                </select>

                <ChevronDownIcon className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-[#595f72] pointer-events-none" />

                {loading && (
                  <div className="absolute -left-6 top-1/2 -translate-y-1/2">
                    <ArrowPathIcon className="h-2 w-2 text-[#595f72] animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </header>
          <div className="animate-in fade-in duration-700">
            {/* PRIMARY METRIC GRID (PATTERN MATCHED) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-zinc-100 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-900 mb-16 md:mb-20 overflow-hidden shadow-sm">
              {/* Revenue Slot: Scaled down from 7xl */}
              <div className="lg:col-span-6 bg-white dark:bg-black p-8 md:p-12 flex flex-col justify-center">
                <p className="text-[8px] md:text-[9px] uppercase tracking-[0.35em] text-[#595f72] mb-4 font-serif ">
                  Period Revenue
                </p>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-2xl md:text-3xl font-light tracking-tighter font-serif">
                    ₱{data?.periodRevenue?.toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-6">
                  <div className="flex flex-col border-l border-zinc-100 dark:border-zinc-800 pl-4">
                    <span className="text-[7px] md:text-[8px] uppercase tracking-widest text-[#595f72] mb-1 ">
                      Previous
                    </span>
                    <span className="text-[13px] md:text-[14px] font-light font-serif">
                      ₱{data?.prevPeriodRevenue?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col border-l border-zinc-100 dark:border-zinc-800 pl-4">
                    <span className="text-[7px] md:text-[8px] uppercase tracking-widest text-[#595f72] mb-1 ">
                      Growth
                    </span>
                    <span
                      className={`text-[13px] md:text-[14px] font-light font-serif ${(data?.growth ?? 0) >= 0 ? 'text-emerald-700/70' : 'text-rose-700/70'}`}
                    >
                      {(data?.growth ?? 0) > 0 ? '+' : ''}
                      {data?.growth}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Efficiency Slot: Scaled down from 5xl */}
              <div className="lg:col-span-3 bg-white dark:bg-black p-8 md:p-12 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-zinc-100 dark:border-zinc-900">
                <p className="text-[8px] md:text-[9px] uppercase tracking-[0.35em] text-[#595f72] mb-4 font-serif ">
                  Growth Index
                </p>
                <span className="text-xl md:text-2xl font-light tracking-tighter font-serif mb-6">
                  {data?.growth}%
                </span>
                <div className="w-full h-[1px] bg-zinc-50 dark:bg-zinc-900">
                  <div
                    className="h-full bg-zinc-900 dark:bg-white transition-all duration-1000"
                    style={{ width: `${Math.min(Math.max(data?.growth || 0, 0), 100)}%` }}
                  />
                </div>
              </div>

              {/* Category List Slot: Scaled down from 5xl */}
              <div className="lg:col-span-3 bg-white dark:bg-black p-8 md:p-12 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-zinc-100 dark:border-zinc-900">
                <div>
                  <p className="text-[8px] md:text-[9px] uppercase tracking-[0.35em] text-[#595f72] mb-4 font-serif ">
                    Total Sessions
                  </p>
                  <span className="text-xl md:text-2xl font-light tracking-tighter font-serif">
                    {data?.totalAppointments}
                  </span>
                </div>
                <div className="flex flex-col gap-2 mt-8">
                  {Object.entries(data?.categorySales || {}).map(([name, val]) => (
                    <div
                      key={name}
                      className="flex justify-between items-end gap-2 border-b border-zinc-50 dark:border-zinc-900/50 py-1.5"
                    >
                      <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-[#595f72] font-serif">
                        {name}
                      </span>
                      <span className="text-[9px] font-serif tabular-nums text-[#595f72]">
                        ₱{val.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECONDARY SECTION: RECENT FEED (REDUCED FONT SCALE) */}
            <div className="max-w-5xl">
              <div className="flex items-center justify-between mb-8 border-b border-zinc-900 dark:border-white pb-3">
                <h2 className="text-[9px] md:text-[10px] uppercase tracking-[0.5em] text-[#595f72] font-serif flex items-center gap-3  font-medium">
                  <ClockIcon className="w-3 h-3 opacity-40" /> Recent Activity
                </h2>
              </div>

              <div className="divide-y divide-zinc-50 dark:divide-zinc-900/50">
                {data?.recent && data.recent.length > 0 ? (
                  data.recent.map((booking) => (
                    <div
                      key={booking.id}
                      className="group py-6 md:py-7 transition-colors flex justify-between items-center hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10"
                    >
                      <div className="space-y-1">
                        <span className="text-[13px] md:text-[14px] font-serif tracking-wide text-[#251101] dark:text-zinc-100 capitalize block">
                          {booking.firstName} {booking.surname}
                        </span>
                        <span className="text-[8px] md:text-[9px] text-[#595f72] uppercase tracking-[0.3em] font-medium font-serif ">
                          {booking.service}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[12px] md:text-[13px] font-light font-serif text-[#248232] dark:text-zinc-100 tabular-nums block">
                          +₱{booking.price?.toLocaleString()}
                        </span>
                        <span className="text-[8px] md:text-[9px] text-[#595f72] uppercase tracking-[0.2em] font-serif ">
                          {booking.date}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center border border-dashed border-zinc-100 dark:border-zinc-900">
                    <p className="text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif ">
                      Archive Clear
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-24 pt-10 flex justify-center border-t border-zinc-50 dark:border-zinc-900 opacity-40 hover:opacity-100 transition-opacity">
            <BackToHome />
          </div>
        </div>
      </FadeIn>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="text-center space-y-8">
        <p className="text-[9px] uppercase tracking-[0.5em] text-[#595f72] font-serif ">
          Data Stream Error
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-[9px] uppercase tracking-[0.4em] font-medium transition-all"
        >
          Retry Sync
        </button>
      </div>
    </div>
  )
}
