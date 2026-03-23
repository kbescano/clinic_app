'use client'

import React, { useEffect, useState } from 'react'
import FadeIn from '../../components/FadeIn'
import { CheckBadgeIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function AdminAnalytics() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((res) => res.json())
      .then((json) => {
        setData(json)
        setLoading(false)
      })
  }, [])

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
        <div className="animate-pulse text-[8px] uppercase tracking-[0.4em] text-zinc-400">
          Calculating...
        </div>
      </div>
    )

  return (
    <FadeIn>
      <div className="min-h-screen bg-white dark:bg-black text-black p-2 pt-10 md:p-8 lg:p-16 font-sans">
        {/* MAIN ANALYTICS CONTENT */}
        <div className="max-w-7xl mx-auto px-6 py-10 sm:px-6 lg:px-8">
          {/* Compact Header */}
          <header className="max-w-4xl pb-10">
            <p className="text-[7px] uppercase tracking-[0.6em] text-zinc-400 font-bold mb-3">
              Performance
            </p>
            <h1 className="text-2xl md:text-3xl font-light tracking-tight uppercase dark:text-white">
              Clinic Analytics
            </h1>
            <div className="mt-6 h-[1px] w-12 bg-zinc-800 dark:bg-zinc-200 opacity-20" />
          </header>

          {/* Scaled-down Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl">
            {/* 1. Daily Sales */}
            <div className="p-8 border border-zinc-100 dark:border-zinc-900 rounded-2xl bg-zinc-50/30 dark:bg-white/[0.02] flex flex-col justify-between min-h-[180px]">
              <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-zinc-400">Today</p>
              <div>
                <p className="text-4xl font-extralight tracking-tighter leading-none dark:text-white">
                  ₱{data?.dailySales?.toLocaleString()}
                </p>
                <p className="text-[7px] uppercase tracking-[0.1em] text-zinc-300 mt-3">
                  Live Revenue
                </p>
              </div>
            </div>

            {/* 2. Monthly Total */}
            <div className="p-8 border border-zinc-100 dark:border-zinc-900 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex flex-col justify-between min-h-[180px] shadow-lg">
              <p className="text-[8px] font-bold uppercase tracking-[0.6em] opacity-40">Monthly</p>
              <div>
                <p className="text-4xl font-extralight tracking-tighter leading-none">
                  ₱{data?.monthlySales?.toLocaleString()}
                </p>
                <p className="text-[7px] uppercase tracking-[0.1em] opacity-40 mt-3">Gross Total</p>
              </div>
            </div>

            {/* 3. Weekly Category Breakdown */}
            <div className="p-8 border border-zinc-100 dark:border-zinc-900 rounded-2xl flex flex-col min-h-[180px] md:col-span-2 xl:col-span-1">
              <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-zinc-400 mb-6">
                Weekly Categories
              </p>
              <div className="space-y-4 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                {data?.weeklyCategorySales &&
                Object.entries(data.weeklyCategorySales).length > 0 ? (
                  Object.entries(data.weeklyCategorySales).map(([cat, val]: any) => (
                    <div
                      key={cat}
                      className="flex justify-between items-end border-b border-zinc-50 dark:border-zinc-900/50 pb-1 group"
                    >
                      <span className="text-[9px] uppercase tracking-widest text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors truncate max-w-[120px]">
                        {cat}
                      </span>
                      <span className="text-base font-light dark:text-white">
                        ₱{val.toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[9px] italic text-zinc-300">No category data</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* QUICK VIEW SIDEBAR */}
        <aside className="min-h-screen bg-white dark:bg-black text-black p-2 pt-10 md:p-8 lg:p-16 font-sans">
          <header className="mb-10 px-6 lg:px-0">
            <p className="text-[7px] uppercase tracking-[0.6em] text-zinc-400 font-bold mb-3 flex items-center gap-2">
              <ClockIcon className="w-3 h-3" />
              Recent Activity
            </p>
            <h2 className="text-xl font-light uppercase tracking-tight dark:text-white">
              Latest Sales
            </h2>
          </header>

          <div className="space-y-8 px-6 lg:px-0">
            {data?.recent && data.recent.length > 0 ? (
              data.recent.map((booking: any) => (
                <div key={booking.id} className="group relative">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-800 dark:text-zinc-200 truncate pr-4">
                      {booking.firstName} {booking.surname}
                    </span>
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      +₱{booking.price?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[8px] text-zinc-400 uppercase tracking-tighter">
                      {booking.service}
                    </p>
                    <div className="flex items-center gap-1">
                      <CheckBadgeIcon className="w-3 h-3 text-emerald-500/50" />
                      <span className="text-[7px] text-zinc-300 uppercase">Just now</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10">
                <p className="text-[9px] uppercase tracking-widest text-zinc-300 italic text-center border border-dashed border-zinc-100 dark:border-zinc-900 p-8 rounded-2xl">
                  Waiting for data...
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </FadeIn>
  )
}
