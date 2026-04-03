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
    <div className="min-h-screen bg-white dark:bg-[#050505] text-[#251101] dark:text-zinc-100 pt-24 md:pt-32 pb-32 px-4 md:px-8 selection:bg-zinc-100 overflow-x-hidden font-sans">
      <FadeIn>
        {/* UNIFORM SPACING WRAPPER: Locked to max-w-4xl */}
        <div className="max-w-4xl mx-auto flex flex-col gap-10 md:gap-20">
          {/* COUTURE HEADER */}
          {/* COUTURE HEADER */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-12">
            <div className="space-y-4 relative">
              <div
                className={`absolute -left-4 md:-left-8 top-0 w-[1px] bg-zinc-900 dark:bg-white transition-all duration-1000 ease-out origin-top ${
                  drawLine ? 'h-full opacity-100' : 'h-0 opacity-0'
                }`}
              />
              <div className="flex items-center gap-4">
                <p className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                  Clinical Operations
                </p>
              </div>
              <h1 className="text-[28px] md:text-[48px] font-light tracking-tighter font-serif leading-none">
                Management
              </h1>
            </div>

            {/* Filter Container */}
            {/* Admin Filter Container: Anchored right for clean editorial alignment */}
            <div className="self-end md:self-auto flex items-center relative z-20">
              <AdminFilter initialRange={range} initialStatus={status} />
            </div>
          </header>

          <div className="flex flex-col gap-14 md:gap-20">
            {/* TODAY SECTION */}
            <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 ease-out fill-mode-both flex flex-col gap-6 md:gap-8">
              <div className="flex items-baseline justify-between border-b border-zinc-100 dark:border-zinc-900/50 pb-3">
                <h2 className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif flex items-center gap-2">
                  Today&apos;s Sessions
                </h2>
                <span className="text-[7px] md:text-[8px] uppercase tracking-[0.3em] text-[#595f72] font-serif">
                  {todayData.length} Entries
                </span>
              </div>

              <div className="flex flex-col border-b border-zinc-100 dark:border-zinc-900/50">
                {todayData.length > 0 ? (
                  todayData.map((apt: any) => <AppointmentTicket key={apt.id} apt={apt} />)
                ) : (
                  <EmptyState message="The registry is clear for today" />
                )}
              </div>
            </section>

            {/* SECONDARY SECTION */}
            {range !== 'today' && (
              <section className="animate-in fade-in duration-700 flex flex-col gap-6 md:gap-8">
                <div className="flex items-baseline justify-between border-b border-zinc-100 dark:border-zinc-900/50 pb-3">
                  <h2 className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                    {secondaryLabel}
                  </h2>
                  <span className="text-[7px] md:text-[8px] uppercase tracking-[0.3em] text-[#595f72] font-serif">
                    {otherData.length} Found
                  </span>
                </div>

                <div className="flex flex-col border-b border-zinc-100 dark:border-zinc-900/50">
                  {otherData.length > 0 ? (
                    otherData.map((apt: any) => <AppointmentTicket key={apt.id} apt={apt} />)
                  ) : (
                    <EmptyState message={`No records found in selected range`} />
                  )}
                </div>
              </section>
            )}

            {/* SYSTEM INTEGRATION SECTION (Atelier Hairline Design) */}
            <section className="animate-in fade-in duration-1000 delay-300 fill-mode-both">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50 shadow-sm">
                <div className="lg:col-span-4 bg-white dark:bg-[#050505] p-6 md:p-10 flex flex-col justify-between group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/20">
                  <div>
                    <p className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif mb-6 md:mb-8 flex items-center gap-2">
                      <TableCellsIcon className="w-3.5 h-3.5 opacity-50" /> System
                    </p>
                    <h2 className="text-[18px] md:text-[24px] font-light font-serif text-[#251101] dark:text-zinc-100 tracking-tight uppercase leading-none">
                      Data Import
                    </h2>
                  </div>
                  <p className="text-[8px] md:text-[9px] text-[#595f72] font-serif mt-10 uppercase tracking-[0.2em]">
                    Batch upload clinical manifest.
                  </p>
                </div>

                <div className="lg:col-span-8 bg-white dark:bg-[#050505] p-6 md:p-10 flex items-center justify-center transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                  <div className="w-full">
                    <MassUpload />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* FOOTER */}
          <div className="pt-8 md:pt-12 flex justify-center border-t border-zinc-50 dark:border-zinc-900/50 opacity-40 hover:opacity-100 transition-opacity">
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
    <div className="group py-6 px-5 md:px-2 transition-all duration-500 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 border-t border-zinc-100 dark:border-zinc-900/50 first:border-t-0">
      <div className="flex flex-col lg:grid lg:grid-cols-[20%_45%_35%] lg:items-start gap-y-6 md:gap-y-0">
        {/* COL 1: Time, Date & Dots */}
        <div className="flex flex-row items-start justify-between lg:flex-col lg:h-full lg:pr-8">
          <div className="space-y-1">
            <p className="text-[20px] md:text-[24px] font-light font-serif text-[#251101] dark:text-zinc-100 tabular-nums tracking-tighter leading-none">
              {displayTime}
            </p>
            <p className="text-[8px] md:text-[9px] uppercase text-[#595f72] tracking-[0.3em] font-serif mt-1">
              {displayDate}
            </p>
          </div>
          <div className="flex items-center gap-4 lg:mt-auto pt-2 lg:pt-8">
            <StatusDot label="Conf" active={apt.emailStatus?.confirmationSent} />
            <StatusDot label="24H" active={apt.emailStatus?.reminder24hSent} />
            <StatusDot label="2H" active={apt.emailStatus?.reminder2hSent} />
          </div>
        </div>

        {/* COL 2: Patient Info & Services */}
        <div className="flex flex-col justify-between h-full lg:pr-8">
          <div className="space-y-1.5 md:space-y-1">
            <h3 className="text-[15px] md:text-[16px] font-serif text-[#251101] dark:text-zinc-100 tracking-tight capitalize leading-none">
              {apt.firstName} {apt.surname}
            </h3>
            <p className="text-[9px] md:text-[10px] text-[#595f72] font-serif tracking-tight lowercase">
              {apt.email} <span className="mx-1.5 opacity-40">/</span> {apt.phone}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-4 md:mt-6">
            {apt.services.map((s: string, i: number) => (
              <span
                key={i}
                className="text-[6px] md:text-[7px] uppercase tracking-[0.2em] text-[#595f72] border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 font-medium font-serif"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* COL 3: Actions */}
        <div className="lg:border-l border-zinc-100 dark:border-zinc-900/50 lg:pl-8 w-full pt-4 lg:pt-0 border-t lg:border-t-0 mt-2 lg:mt-0">
          <BookingActions appointmentId={apt.id} currentStatus={apt.status} />
        </div>
      </div>
    </div>
  )
}

function StatusDot({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 shrink-0 items-start">
      <div
        className={`w-5 md:w-6 h-[1.5px] transition-all duration-700 ${active ? 'bg-[#248232] dark:bg-[#48a9a6]' : 'bg-zinc-200 dark:bg-zinc-800'}`}
      />
      <span
        className={`text-[6px] md:text-[7px] uppercase tracking-[0.2em] font-medium font-serif ${active ? 'text-[#248232] dark:text-[#48a9a6]' : 'text-[#595f72]'}`}
      >
        {label}
      </span>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-24 flex flex-col items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 my-4">
      <ClockIcon className="w-5 h-5 text-[#595f72] mb-4 opacity-50" />
      <p className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] text-[#595f72] font-serif text-center px-4">
        {message}
      </p>
    </div>
  )
}
