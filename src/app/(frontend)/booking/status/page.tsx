'use client'

import React, { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import FadeIn from '../../components/FadeIn'
import { PlusIcon } from '@heroicons/react/24/outline'
import BackToHome from '../../components/BackToHome'

export default function BookingStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-zinc-400 text-[9px] uppercase tracking-[0.4em]">
            Loading Schedule...
          </div>
        </div>
      }
    >
      <StatusContent />
    </Suspense>
  )
}

function StatusContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const firstName = searchParams.get('fn') || 'Patient'
  const aptsRaw = searchParams.get('apts')
  const appointments = aptsRaw ? JSON.parse(aptsRaw) : []

  // --- DATA RECOVERY LOGIC ---
  // We check the URL first, then fallback to the first appointment object
  // to ensure sn and ph are always available for the "Book Again" prefill.
  const userEmail = searchParams.get('email') || appointments[0]?.email || ''
  const userSurname = searchParams.get('sn') || appointments[0]?.surname || ''
  const userPhone = searchParams.get('ph') || appointments[0]?.phone || ''

  const formatPHTime = (d: string) =>
    new Date(d).toLocaleTimeString('en-US', {
      timeZone: 'Asia/Manila',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

  const formatPHDate = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

  return (
    <div className="min-h-screen bg-white dark:bg-black py-20 px-6">
      <FadeIn>
        <div className="max-w-[700px] mx-auto text-center">
          <header className="mb-20">
            <p className="text-[10px] uppercase tracking-[0.8em] text-zinc-400 font-medium mb-6">
              Appointment Status
            </p>
            <h1 className="text-4xl md:text-6xl font-light tracking-tight dark:text-white leading-tight uppercase">
              Hello, {firstName}
            </h1>
          </header>

          <div className="space-y-12 mb-20 text-left">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-400">
                Confirmed Schedule
              </p>
              <span className="text-[9px] text-zinc-300 uppercase tracking-widest">
                {appointments.length} total
              </span>
            </div>

            <div className="space-y-12">
              {appointments.length > 0 ? (
                appointments.map((apt: any, i: number) => (
                  <div
                    key={i}
                    className="group flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 md:gap-0"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-1">
                        {apt.service}
                      </p>
                      <p className="text-2xl md:text-3xl font-light dark:text-white tracking-tight">
                        {formatPHDate(apt.date)}
                      </p>
                    </div>
                    <p className="text-[12px] md:text-[14px] text-zinc-400 uppercase tracking-[0.2em] font-medium">
                      {formatPHTime(apt.date)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-zinc-300 text-[10px] uppercase tracking-widest italic font-light">
                  No active bookings found.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5 max-w-[500px] mx-auto">
            {/* LINK WITH FULL PREFILL PARAMS */}
            <Link
              href={`/booking?prefill=true&email=${encodeURIComponent(userEmail)}&fn=${encodeURIComponent(firstName)}&sn=${encodeURIComponent(userSurname)}&ph=${encodeURIComponent(userPhone)}`}
              className="w-full bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold py-7 rounded-full uppercase tracking-[0.4em] transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-3 shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Book New Visit
            </Link>

            <BackToHome />
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
