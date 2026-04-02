'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import FadeIn from '../../components/FadeIn'
import { PlusIcon, ArrowUpRightIcon, ClockIcon } from '@heroicons/react/24/outline'
import BackToHome from '../../components/BackToHome'
import dayjs from '@/lib/dayjs'

export default function BookingStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#050505]">
          <div className="animate-pulse text-[#595f72] font-serif text-[8px] md:text-[9px] uppercase tracking-[0.5em] ">
            Loading ...
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
  const [drawLine, setDrawLine] = useState(false)

  useEffect(() => {
    // Triggers the Atelier drawline animation on mount
    const timer = setTimeout(() => setDrawLine(true), 500)
    return () => clearTimeout(timer)
  }, [])

  // Data Extraction (Logic Preserved)
  const firstName = searchParams.get('fn') || 'Patient'
  const aptsRaw = searchParams.get('apts')
  const rawAppointments = aptsRaw ? JSON.parse(aptsRaw) : []

  const userEmail = searchParams.get('email') || ''
  const userSurname = searchParams.get('sn') || ''
  const userPhone = searchParams.get('ph') || ''

  const consolidatedAppointments = React.useMemo(() => {
    if (!rawAppointments || !Array.isArray(rawAppointments)) return []

    const grouped: Record<string, any> = {}

    rawAppointments.forEach((apt: any) => {
      // 1. Sanitize the name and date
      const pFirstName = (apt.firstName || '').trim().toLowerCase()
      const pSurname = (apt.surname || '').trim().toLowerCase()
      const timeKey = dayjs(apt.date).toISOString()
      const serviceName = apt.service || 'General Consultation'

      // 2. GROUP KEY: Person + Time (Excluding serviceName)
      // This ensures Robert's 2 treatments at 10:00 AM merge into 1 card.
      const groupKey = `${pFirstName}-${pSurname}-${timeKey}`

      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          ...apt,
          services: [serviceName], // Start the list of services
        }
      } else {
        // 3. If person + time exists, add the second service to the SAME card
        if (!grouped[groupKey].services.includes(serviceName)) {
          grouped[groupKey].services.push(serviceName)
        }
      }
    })

    // 4. Sort chronologically
    return Object.values(grouped).sort(
      (a: any, b: any) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
    )
  }, [rawAppointments])

  const formatPHTime = (d: string) => dayjs(d).tz('Asia/Manila').format('hh:mm A')
  const formatPHDate = (d: string) => dayjs(d).tz('Asia/Manila').format('MMM D, YYYY')

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-[#251101] dark:text-[#595f72] pt-24 md:pt-32 pb-32 selection:bg-zinc-100 overflow-x-hidden">
      <FadeIn>
        {/* ATELIER CONTAINER: Standardized max-w-5xl used on Dashboard and Registry pages */}
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <header className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-start gap-4 md:gap-5">
              <div
                className={`w-[1px] bg-zinc-900 dark:bg-white transition-all duration-1000 ease-out origin-top ${
                  drawLine ? 'h-10 md:h-12 opacity-100' : 'h-0 opacity-0'
                }`}
              />
              <div className="space-y-1">
                <p className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif ">
                  Booking Confirmation
                </p>
                <h1 className="text-[20px] md:text-[24px] font-light tracking-tight font-serif text-[#251101] dark:text-white leading-none uppercase">
                  Hello, <span className="text-[#595f72] ">{firstName}</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4 self-start md:self-auto border-l border-zinc-100 dark:border-zinc-900 pl-6 h-10">
              <div className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </div>
              <p className="text-[8px] md:text-[9px] text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] font-medium font-serif ">
                Confirmed
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12">
            {/* MAIN QUEUE: Registry Ledger View */}
            <section className="lg:col-span-7">
              <div className="flex items-baseline justify-between mb-8 border-b border-zinc-900 dark:border-white pb-3">
                <h2 className="text-[9px] md:text-[10px] uppercase tracking-[0.5em] font-medium font-serif  flex items-center gap-3">
                  Scheduled Sessions
                </h2>
                <span className="text-[8px] uppercase tracking-widest text-[#595f72] font-serif tabular-nums ">
                  Entry Count: {consolidatedAppointments.length}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-px bg-zinc-50 dark:bg-zinc-900/50 border-y border-zinc-100 dark:border-zinc-900">
                {consolidatedAppointments.length > 0 ? (
                  consolidatedAppointments.map((apt: any, i: number) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-black p-8 md:p-10 group transition-colors hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10"
                    >
                      <div className="flex flex-col md:flex-row justify-between gap-8">
                        <div className="w-32 shrink-0 space-y-1">
                          <p className="text-[20px] md:text-[24px] font-light font-serif text-[#251101] dark:text-white tracking-tighter tabular-nums leading-none">
                            {formatPHTime(apt.date)}
                          </p>
                          <p className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] text-[#595f72] font-serif ">
                            {formatPHDate(apt.date)}
                          </p>
                        </div>

                        <div className="flex-1 space-y-6">
                          <div className="flex items-center gap-3">
                            <h3 className="text-[15px] md:text-[16px] font-light font-serif text-[#251101] dark:text-[#595f72] capitalize tracking-tight">
                              {apt.isGuest
                                ? `${apt.firstName} ${apt.surname}`
                                : `${firstName} ${userSurname}`}
                            </h3>
                            {apt.isGuest && (
                              <span className="text-[6px] px-1.5 py-0.5 border border-zinc-100 dark:border-zinc-800 text-[#595f72] uppercase tracking-widest font-serif ">
                                Guest
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            {apt.services.map((s: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-3">
                                <div className="w-0.5 h-[1px] bg-zinc-200 dark:bg-zinc-800" />
                                <span className="text-[9px] uppercase tracking-[0.2em] text-[#595f72] font-serif ">
                                  {s}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-24 flex flex-col items-center justify-center bg-white dark:bg-black">
                    <p className="text-[9px] uppercase tracking-[0.5em] text-[#595f72] font-serif ">
                      Registry Clear
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* QUICK ACTIONS */}
            <aside className="lg:col-span-5">
              <div className="sticky top-32 space-y-12">
                <section>
                  <div className="flex items-baseline justify-between mb-8 border-b border-zinc-50 dark:border-zinc-900/50 pb-3">
                    <h2 className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif ">
                      Next Steps
                    </h2>
                  </div>

                  <div className="flex flex-col gap-8">
                    <Link
                      href={`/booking?prefill=true&email=${encodeURIComponent(userEmail)}&fn=${encodeURIComponent(firstName)}&sn=${encodeURIComponent(userSurname)}&ph=${encodeURIComponent(userPhone)}`}
                      className="group bg-zinc-900 text-white dark:bg-white dark:text-black p-8 md:p-12 flex flex-col justify-between min-h-[220px] transition-all duration-700 relative overflow-hidden shadow-sm"
                    >
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10 dark:bg-black/10" />

                      <PlusIcon className="w-6 h-6 opacity-30 group-hover:rotate-90 group-hover:opacity-100 transition-all duration-700 stroke-[1px]" />

                      <div className="flex items-end justify-between gap-4">
                        <h3 className="text-[18px] md:text-[22px] font-light font-serif leading-tight tracking-tight uppercase">
                          Plan another <br /> clinical visit
                        </h3>
                        <ArrowUpRightIcon className="w-4 h-4 opacity-30 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-700" />
                      </div>
                    </Link>

                    <div className="pt-10 flex justify-center border-t border-zinc-50 dark:border-zinc-900 opacity-30 hover:opacity-100 transition-opacity">
                      <BackToHome />
                    </div>
                  </div>
                </section>
              </div>
            </aside>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
