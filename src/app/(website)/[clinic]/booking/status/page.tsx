'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import FadeIn from '@/components/shared/FadeIn'
import { PlusIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline'
import BackToHome from '@/components/shared/BackToHome'
import dayjs from '@/lib/dayjs'
import { useClinic } from '@/app/(website)/components/ClinicContext'

// --- TYPES & INTERFACES ---

interface RawApt {
  firstName: string
  surname: string
  date: string
  service?: string
  isGuest?: boolean
}

interface ConsolidatedApt extends Omit<RawApt, 'service'> {
  services: string[]
}

export default function BookingStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#050505]">
          <div className="animate-pulse text-zinc-500 text-xs md:text-xs uppercase tracking-[0.2em]">
            Accessing Registry...
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
  const { href } = useClinic()
  const [drawLine, setDrawLine] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDrawLine(true), 500)
    return () => clearTimeout(timer)
  }, [])

  const firstName = searchParams.get('fn') || 'Patient'
  const aptsRaw = searchParams.get('apts')

  const userEmail = searchParams.get('email') || ''
  const userSurname = searchParams.get('sn') || ''
  const userPhone = searchParams.get('ph') || ''

  // FIX: Parsing logic moved inside useMemo to prevent dependency drift
  const consolidatedAppointments = React.useMemo(() => {
    let rawAppointments: RawApt[] = []
    try {
      rawAppointments = aptsRaw ? JSON.parse(aptsRaw) : []
    } catch {
      return []
    }
    if (!Array.isArray(rawAppointments)) return []

    const grouped: Record<string, ConsolidatedApt> = {}

    rawAppointments.forEach((apt) => {
      const pFirstName = (apt.firstName || '').trim().toLowerCase()
      const pSurname = (apt.surname || '').trim().toLowerCase()
      const timeKey = dayjs(apt.date).toISOString()
      const serviceName = apt.service || 'General Consultation'
      const groupKey = `${pFirstName}-${pSurname}-${timeKey}`

      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          firstName: apt.firstName,
          surname: apt.surname,
          date: apt.date,
          isGuest: apt.isGuest,
          services: [serviceName],
        }
      } else {
        if (!grouped[groupKey].services.includes(serviceName)) {
          grouped[groupKey].services.push(serviceName)
        }
      }
    })

    return Object.values(grouped).sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
  }, [aptsRaw])

  const formatPHTime = (d: string) => dayjs(d).tz('Asia/Manila').format('hh:mm A')
  const formatPHDate = (d: string) => dayjs(d).tz('Asia/Manila').format('MMM D, YYYY')

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-zinc-950 dark:text-zinc-100 pt-24 md:pt-32 pb-32 px-4 md:px-8 selection:bg-zinc-100 overflow-x-hidden font-sans">
      <FadeIn>
        <div className="max-w-4xl mx-auto flex flex-col gap-14 md:gap-20">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-12">
            <div className="space-y-4 relative">
              <div
                className={`absolute -left-4 md:-left-8 top-0 w-[1px] bg-zinc-900 dark:bg-white transition-all duration-1000 ease-out origin-top ${
 drawLine ? 'h-full opacity-100' : 'h-0 opacity-0'
 }`}
              />
              <div className="flex items-center gap-4">
                <p className="text-xs md:text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Booking Confirmation
                </p>
              </div>
              <h1 className="text-3xl md:text-6xl font-extrabold tracking-tighter leading-none">
                Hello, <br />
                <span className="text-zinc-500">{firstName}</span>
              </h1>
            </div>

            <div className="self-end md:self-auto flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900/50 px-6 py-3 rounded-none border border-zinc-300 dark:border-zinc-800/50">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#248232] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#248232]"></span>
              </div>
              <p className="text-xs md:text-xs text-[#248232] uppercase tracking-[0.2em] font-medium">
                Confirmed
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16">
            <section className="lg:col-span-7 flex flex-col gap-8">
              <div className="flex items-baseline justify-between border-b border-zinc-300 dark:border-zinc-800/50 pb-3">
                <h2 className="text-xs md:text-xs uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                  Scheduled Sessions
                </h2>
                <span className="text-xs md:text-sm text-zinc-950 dark:text-zinc-100 tabular-nums">
                  {consolidatedAppointments.length} Registry Entries
                </span>
              </div>

              <div className="grid grid-cols-1 gap-px bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-800/50 shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 ease-out fill-mode-both">
                {consolidatedAppointments.length > 0 ? (
                  consolidatedAppointments.map((apt, i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-[#050505] p-8 md:p-10 group transition-all duration-500 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10"
                    >
                      <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-12">
                        <div className="md:w-32 shrink-0 space-y-1.5">
                          <p className="text-xl md:text-4xl font-extrabold text-zinc-950 dark:text-zinc-100 tracking-tighter tabular-nums leading-none">
                            {formatPHTime(apt.date)}
                          </p>
                          <p className="text-xs md:text-xs uppercase tracking-[0.2em] text-zinc-500">
                            {formatPHDate(apt.date)}
                          </p>
                        </div>

                        <div className="flex-1 space-y-6">
                          <div className="flex items-center gap-3">
                            <h3 className="text-base md:text-base text-zinc-950 dark:text-zinc-100 tracking-tight capitalize leading-none">
                              {apt.isGuest
                                ? `${apt.firstName} ${apt.surname}`
                                : `${firstName} ${userSurname}`}
                            </h3>
                            {apt.isGuest && (
                              <span className="text-xs md:text-xs px-1.5 py-0.5 border border-zinc-300 dark:border-zinc-800 text-zinc-500 uppercase tracking-widest font-medium">
                                Guest
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            {apt.services.map((s, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <div className="w-4 h-[1px] bg-zinc-100 dark:bg-zinc-800" />
                                <span className="text-xs md:text-xs uppercase tracking-[0.2em] text-zinc-500 leading-none">
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
                  <div className="py-24 flex items-center justify-center bg-white dark:bg-[#050505]">
                    <p className="text-xs md:text-xs uppercase tracking-widest text-zinc-500">
                      Registry Clear
                    </p>
                  </div>
                )}
              </div>
            </section>

            <aside className="lg:col-span-5 flex flex-col gap-10">
              <div className="flex items-baseline justify-between border-b border-zinc-300 dark:border-zinc-800/50 pb-3">
                <h2 className="text-xs md:text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Next Steps
                </h2>
              </div>

              <div className="flex flex-col gap-8 sticky top-32">
                <Link
                  href={`${href('/booking')}?prefill=true&email=${encodeURIComponent(userEmail)}&fn=${encodeURIComponent(firstName)}&sn=${encodeURIComponent(userSurname)}&ph=${encodeURIComponent(userPhone)}`}
                  className="group bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 p-8 md:p-12 flex flex-col justify-between min-h-[240px] md:min-h-[280px] transition-all duration-700 relative overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] animate-in fade-in slide-in-from-right-8 duration-1000 delay-300"
                >
                  <div className="absolute top-0 left-0 w-full h-[1.5px] bg-[#48a9a6]/50" />
                  <PlusIcon className="w-8 h-8 opacity-30 group-hover:rotate-90 group-hover:opacity-100 transition-all duration-700 stroke-[1px]" />
                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <h3 className="text-xl md:text-4xl font-extrabold leading-tight tracking-tighter uppercase">
                        Plan another <br /> clinical visit
                      </h3>
                      <ArrowUpRightIcon className="w-5 h-5 opacity-30 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-700" />
                    </div>
                    <p className="text-xs md:text-xs uppercase tracking-[0.2em] opacity-40">
                      Continue through registry &rarr;
                    </p>
                  </div>
                </Link>

                <div className="pt-12 flex justify-center border-t border-zinc-50 dark:border-zinc-800/50 opacity-40 hover:opacity-100 transition-opacity">
                  <BackToHome />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
