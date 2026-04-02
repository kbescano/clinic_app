'use client'

import React, { useState, useEffect } from 'react'
import FadeIn from '../../components/FadeIn'
import { TableCellsIcon, ClockIcon } from '@heroicons/react/24/outline'
import MassUpload from '../../components/MassUpload'
import BackToHome from '../../components/BackToHome'
import AdminFilter from '../../components/AdminFilter'
import BookingActions from './actions'
import dayjs from '@/lib/dayjs'

interface AdminProps {
  todayData: any[]
  otherData: any[]
  range: string
  status: string
  secondaryLabel: string
}

export default function AdminManagementClient({
  todayData,
  otherData,
  range,
  status,
  secondaryLabel,
}: AdminProps) {
  const [drawLine, setDrawLine] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDrawLine(true), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-[#251101] dark:text-[#595f72] pt-24 md:pt-32 pb-32 selection:bg-zinc-100 overflow-x-hidden">
      <FadeIn>
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          {/* COUTURE HEADER: With Reactive Drawline */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 md:mb-24">
            <div className="flex items-start gap-4 md:gap-5">
              <div
                className={`w-[1px] bg-zinc-900 dark:bg-white transition-all duration-1000 ease-out origin-top ${
                  drawLine ? 'h-10 md:h-12 opacity-100' : 'h-0 opacity-0'
                }`}
              />
              <div className="space-y-1">
                <p className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif ">
                  Clinical Operations
                </p>
                <h1 className="text-[20px] md:text-[24px] font-light tracking-tight font-serif uppercase leading-none">
                  Management
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-6 self-end md:self-auto">
              <AdminFilter initialRange={range} initialStatus={status} />
            </div>
          </header>

          <div className="space-y-20">
            {/* TODAY SECTION */}
            <section>
              <div className="flex items-baseline justify-between mb-8 border-b border-zinc-900 dark:border-white pb-3">
                <h2 className="text-[9px] md:text-[10px] uppercase tracking-[0.5em] font-medium font-serif  flex items-center gap-3">
                  Today&apos;s Sessions
                </h2>
                <span className="text-[8px] uppercase tracking-widest text-[#595f72] font-serif">
                  {todayData.length} Registry Entries
                </span>
              </div>

              <div className="divide-y divide-zinc-50 dark:divide-zinc-900/50">
                {todayData.length > 0 ? (
                  todayData.map((apt: any) => <AppointmentTicket key={apt.id} apt={apt} />)
                ) : (
                  <EmptyState message="The registry is clear for today" />
                )}
              </div>
            </section>

            {/* SECONDARY SECTION */}
            {range !== 'today' && (
              <section className="animate-in fade-in duration-700">
                <div className="flex items-baseline justify-between mb-8 border-b border-zinc-100 dark:border-zinc-900 pb-3">
                  <h2 className="text-[9px] md:text-[10px] uppercase tracking-[0.5em] font-medium font-serif text-[#595f72] ">
                    {secondaryLabel}
                  </h2>
                  <span className="text-[8px] uppercase tracking-widest text-[#595f72] font-serif">
                    {otherData.length} Found
                  </span>
                </div>

                <div className="divide-y divide-zinc-50 dark:divide-zinc-900/50">
                  {otherData.length > 0 ? (
                    otherData.map((apt: any) => <AppointmentTicket key={apt.id} apt={apt} />)
                  ) : (
                    <EmptyState message={`No records found in selected range`} />
                  )}
                </div>
              </section>
            )}

            {/* SYSTEM INTEGRATION SECTION */}
            <section className="pt-20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-zinc-50 dark:bg-zinc-900 border border-zinc-50 dark:border-zinc-900 overflow-hidden shadow-sm">
                <div className="lg:col-span-4 bg-white dark:bg-black p-8 md:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-zinc-50 dark:border-zinc-900">
                  <div>
                    <p className="text-[8px] uppercase tracking-[0.3em] text-[#595f72] font-serif mb-6 flex items-center gap-2">
                      <TableCellsIcon className="w-3.5 h-3.5 opacity-30" /> System
                    </p>
                    <h2 className="text-[18px] md:text-[20px] font-light font-serif text-[#251101] dark:text-white tracking-tight uppercase">
                      Data Import
                    </h2>
                  </div>
                  <p className="text-[9px] text-[#595f72] font-serif leading-relaxed mt-10 uppercase tracking-widest opacity-60 ">
                    Batch upload clinical manifest.
                  </p>
                </div>
                <div className="lg:col-span-8 bg-zinc-50/20 dark:bg-black p-6 md:p-12">
                  <MassUpload />
                </div>
              </div>
            </section>
          </div>

          <div className="mt-24 pt-10 flex justify-center border-t border-zinc-50 dark:border-zinc-900 opacity-40 hover:opacity-100 transition-opacity">
            <BackToHome />
          </div>
        </div>
      </FadeIn>
    </div>
  )
}

function AppointmentTicket({ apt }: { apt: any }) {
  const displayTime = dayjs(apt.appointmentDate).tz('Asia/Manila').format('hh:mm A')
  const displayDate = dayjs(apt.appointmentDate).tz('Asia/Manila').format('MMM D')

  return (
    <div className="group py-8 md:py-10 transition-all duration-500 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 px-2">
      <div className="flex flex-col lg:grid lg:grid-cols-[20%_45%_35%] lg:items-start gap-y-8">
        <div className="flex flex-row items-start justify-between lg:flex-col lg:h-full lg:pr-10">
          <div className="space-y-1">
            <p className="text-[20px] md:text-[24px] font-light font-serif text-[#251101] dark:text-white tabular-nums tracking-tighter leading-none">
              {displayTime}
            </p>
            <p className="text-[9px] uppercase text-[#595f72] tracking-[0.2em] font-serif ">
              {displayDate}
            </p>
          </div>
          <div className="flex items-center gap-4 lg:mt-auto pt-4 lg:pt-0">
            <StatusDot label="Conf" active={apt.emailStatus?.confirmationSent} />
            <StatusDot label="24H" active={apt.emailStatus?.reminder24hSent} />
            <StatusDot label="2H" active={apt.emailStatus?.reminder2hSent} />
          </div>
        </div>

        <div className="flex flex-col justify-between h-full lg:pr-10">
          <div className="space-y-2">
            <h3 className="text-[16px] md:text-[18px] font-light font-serif text-[#251101] dark:text-[#595f72] tracking-tight capitalize leading-none">
              {apt.firstName} {apt.surname}
            </h3>
            <p className="text-[9px] text-[#595f72] font-serif tracking-widest uppercase  opacity-80">
              {apt.email} <span className="mx-1 text-[#595f72] dark:text-[#251101]">/</span>{' '}
              {apt.phone}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-6">
            {apt.services.map((s: string, i: number) => (
              <span
                key={i}
                className="text-[7px] md:text-[8px] uppercase tracking-[0.25em] text-[#595f72] border border-zinc-100 dark:border-zinc-800 px-2.5 py-1 font-serif "
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="lg:border-l border-zinc-50 dark:border-zinc-900/50 lg:pl-10 w-full">
          <BookingActions appointmentId={apt.id} currentStatus={apt.status} />
        </div>
      </div>
    </div>
  )
}

function StatusDot({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 shrink-0">
      <div
        className={`w-6 h-[1px] transition-all duration-700 ${active ? 'bg-emerald-600/60' : 'bg-zinc-100 dark:bg-zinc-800'}`}
      />
      <span
        className={`text-[6px] md:text-[7px] uppercase tracking-widest font-bold font-serif ${active ? 'text-[#251101] dark:text-[#595f72]' : 'text-[#595f72] dark:text-[#251101]'}`}
      >
        {label}
      </span>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-24 flex flex-col items-center justify-center border border-dashed border-zinc-100 dark:border-zinc-900">
      <ClockIcon className="w-5 h-5 text-[#595f72] dark:text-[#251101] mb-4" />
      <p className="text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif text-center px-4">
        {message}
      </p>
    </div>
  )
}
