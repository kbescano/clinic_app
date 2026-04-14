'use client'

import React, { useEffect, useState, useRef, useMemo, useTransition } from 'react'
import FadeIn from '../../components/FadeIn'
import { TableCellsIcon, ClockIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import MassUpload from '../../components/MassUpload'
import BackToHome from '../../components/BackToHome'
import AdminFilter from '../../components/AdminFilter'
import BookingActions from './actions'
import dayjs from '@/lib/dayjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { assignSpecialistAction } from './adminAction'

export interface Specialist {
  id: string | number
  name: string
}

interface BookingEntry {
  id: string
  firstName: string
  surname: string
  email: string
  phone: string
  services: string[]
  appointmentDate: string | Date
  endDateTime?: string | Date // NEW: Added to calculate overlaps accurately
  status: string
  isGuest?: boolean
  specialist?: string | Specialist | null
  emailStatus?: {
    confirmationSent?: boolean
    reminder24hSent?: boolean
    reminder2hSent?: boolean
  }
}

interface AdminProps {
  todayData: BookingEntry[]
  otherData: BookingEntry[]
  specialists: Specialist[]
  range: string
  status: string
  secondaryLabel: string
}

export default function AdminManagementClient({
  todayData,
  otherData,
  specialists,
  range,
  status,
  secondaryLabel,
}: AdminProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [drawLine, setDrawLine] = useState(false)
  const [search, setSearch] = useState(searchParams.get('search') || '')

  const [isHeaderVisible, setIsHeaderVisible] = useState(false)
  const [isSystemVisible, setIsSystemVisible] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const systemRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    const timer = setTimeout(() => setDrawLine(true), 100)

    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    const headerObserver = new IntersectionObserver(
      ([entry]) => setIsHeaderVisible(entry.isIntersecting),
      observerOptions,
    )
    const systemObserver = new IntersectionObserver(
      ([entry]) => setIsSystemVisible(entry.isIntersecting),
      observerOptions,
    )

    if (headerRef.current) headerObserver.observe(headerRef.current)
    if (systemRef.current) systemObserver.observe(systemRef.current)

    return () => {
      clearTimeout(timer)
      headerObserver.disconnect()
      systemObserver.disconnect()
    }
  }, [])

  const updateSearch = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val) {
      params.set('search', val)
    } else {
      params.delete('search')
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  // We combine all data so the tickets can check for overlaps globally
  const combinedData = useMemo(() => {
    const map = new Map<string, BookingEntry>()
    todayData.forEach((item) => map.set(item.id, item))
    otherData.forEach((item) => map.set(item.id, item))
    return Array.from(map.values())
  }, [todayData, otherData])

  const searchResults = useMemo(() => {
    let dataToFilter = [...combinedData]

    if (search) {
      const term = search.toLowerCase().trim()
      dataToFilter = dataToFilter.filter((item) => {
        const searchableFields = [
          item.firstName,
          item.surname,
          item.email,
          item.phone,
          ...(item.services || []),
        ]
        const searchableString = searchableFields.filter(Boolean).join(' ').toLowerCase()
        return searchableString.includes(term)
      })
    }

    return dataToFilter
  }, [combinedData, search])

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-[#251101] dark:text-zinc-100 pt-24 md:pt-32 pb-32 px-4 md:px-8 selection:bg-zinc-100 overflow-x-hidden font-sans">
      <FadeIn>
        <div className="max-w-4xl mx-auto flex flex-col gap-10 md:gap-20">
          <header
            ref={headerRef}
            className="flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-12"
          >
            <div className="space-y-4 relative">
              <div
                className={`absolute -left-4 md:-left-8 top-0 w-[1px] bg-zinc-900 dark:bg-white transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] origin-top ${
                  isHeaderVisible && drawLine ? 'h-full opacity-100' : 'h-0 opacity-0'
                }`}
              />
              <div
                className={`transition-all duration-1000 delay-100 ${isHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              >
                <p className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                  Clinical Operations
                </p>
              </div>
              <h1
                className={`text-[28px] md:text-[48px] font-light tracking-tighter font-serif leading-none transition-all duration-[1200ms] delay-300 ease-out ${
                  isHeaderVisible
                    ? 'opacity-100 translate-y-0 blur-0'
                    : 'opacity-0 translate-y-8 blur-md'
                }`}
              >
                Management
              </h1>
            </div>

            <div
              className={`self-end md:self-auto flex items-center relative z-20 transition-all duration-1000 delay-500 ${
                isHeaderVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            >
              {!search && <AdminFilter initialRange={range} initialStatus={status} />}
            </div>
          </header>

          <div className="flex flex-col gap-14 md:gap-20">
            <div
              className={`flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-4 transition-all duration-1000 delay-700 ${isHeaderVisible ? 'opacity-100' : 'opacity-0'}`}
            >
              <label
                htmlFor="admin-search"
                className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif"
              >
                Registry
              </label>
              <div className="self-end md:self-auto w-full md:w-64 relative group">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#595f72]" />
                <input
                  id="admin-search"
                  name="adminSearch"
                  type="text"
                  placeholder="Search database..."
                  value={search}
                  onChange={(e) => {
                    const val = e.target.value
                    setSearch(val)
                    updateSearch(val)
                  }}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 rounded-full py-3 md:py-2.5 pl-10 pr-4 text-[9px] md:text-[10px] font-serif placeholder:text-[#595f72] text-[#251101] dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-200 dark:focus:ring-zinc-700 transition-all shadow-sm"
                />
              </div>
            </div>

            {!search && range === 'today' && (
              <section className="flex flex-col gap-6 md:gap-8">
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
                    todayData.map((apt) => (
                      <AppointmentTicket
                        key={apt.id}
                        apt={apt}
                        specialists={specialists}
                        allAppointments={combinedData} // Passed the global list here
                      />
                    ))
                  ) : (
                    <EmptyState message="The registry is clear for today" />
                  )}
                </div>
              </section>
            )}

            {(search || range !== 'today') && (
              <section className="flex flex-col gap-6 md:gap-8">
                <div className="flex items-baseline justify-between border-b border-zinc-100 dark:border-zinc-900/50 pb-3">
                  <h2 className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                    {search ? 'Search Results' : secondaryLabel}
                  </h2>
                  <span className="text-[7px] md:text-[8px] uppercase tracking-[0.3em] text-[#595f72] font-serif">
                    {search ? searchResults.length : otherData.length} Found
                  </span>
                </div>

                <div className="flex flex-col border-b border-zinc-100 dark:border-zinc-900/50">
                  {search ? (
                    searchResults.length > 0 ? (
                      searchResults.map((apt) => (
                        <AppointmentTicket
                          key={apt.id}
                          apt={apt}
                          specialists={specialists}
                          allAppointments={combinedData}
                        />
                      ))
                    ) : (
                      <EmptyState message="No matching records found" />
                    )
                  ) : otherData.length > 0 ? (
                    otherData.map((apt) => (
                      <AppointmentTicket
                        key={apt.id}
                        apt={apt}
                        specialists={specialists}
                        allAppointments={combinedData}
                      />
                    ))
                  ) : (
                    <EmptyState message={`No records found in selected range`} />
                  )}
                </div>
              </section>
            )}

            <section
              ref={systemRef}
              className={`transition-all duration-[1200ms] ease-out ${
                isSystemVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50 shadow-sm overflow-hidden rounded-2xl">
                <div className="lg:col-span-4 bg-white dark:bg-[#050505] p-6 md:p-10 flex flex-col justify-between group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/20">
                  <div>
                    <p className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] mb-6 md:mb-8 flex items-center gap-2">
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

          <div className="pt-8 md:pt-12 flex justify-center border-t border-zinc-50 dark:border-zinc-900/50 opacity-40 hover:opacity-100 transition-opacity">
            <BackToHome />
          </div>
        </div>
      </FadeIn>
    </div>
  )
}

function AppointmentTicket({
  apt,
  specialists,
  allAppointments, // Receiving the full list here
}: {
  apt: BookingEntry
  specialists: Specialist[]
  allAppointments: BookingEntry[]
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ticketRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()

  const currentSpecialistId = String(
    typeof apt.specialist === 'object' ? apt.specialist?.id : apt.specialist || '',
  )

  // SMART COLLISION CHECK: Find specialists already busy at this exact time
  const busySpecialistIds = useMemo(() => {
    return allAppointments
      .filter((other) => {
        // Skip comparing against itself or appointments with no specialist assigned yet
        if (other.id === apt.id || !other.specialist || other.status === 'cancelled') return false

        const startA = dayjs(apt.appointmentDate)
        const endA = apt.endDateTime ? dayjs(apt.endDateTime) : startA.add(60, 'minute')

        const startB = dayjs(other.appointmentDate)
        const endB = other.endDateTime ? dayjs(other.endDateTime) : startB.add(60, 'minute')

        // If they overlap, this specialist is busy
        return startA.isBefore(endB) && endA.isAfter(startB)
      })
      .map((other) =>
        String(typeof other.specialist === 'object' ? other.specialist?.id : other.specialist),
      )
  }, [allAppointments, apt])

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: 0.1,
      rootMargin: '0px 0px -20px 0px',
    })
    if (ticketRef.current) observer.observe(ticketRef.current)
    return () => observer.disconnect()
  }, [])

  const handleSpecialistChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value
    startTransition(async () => {
      if (assignSpecialistAction) {
        await assignSpecialistAction(apt.id, newId === '' ? null : newId)
      }
    })
  }

  const displayTime = dayjs(apt.appointmentDate).tz('Asia/Manila').format('hh:mm A')
  const displayDate = dayjs(apt.appointmentDate).tz('Asia/Manila').format('MMM D')

  return (
    <div
      ref={ticketRef}
      className={`group py-6 px-5 md:px-2 transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 border-t border-zinc-100 dark:border-zinc-900/50 first:border-t-0 font-serif ${
        isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-sm'
      }`}
    >
      <div className="flex flex-col lg:grid lg:grid-cols-[20%_45%_35%] lg:items-start">
        <div className="flex flex-row lg:h-[80px] h-[60px] lg:flex-col justify-between lg:pr-8">
          <div className="flex flex-col gap-1">
            <div className="flex items-center">
              <p className="text-[16px] font-light text-[#251101] dark:text-zinc-100 tabular-nums tracking-tighter leading-none m-0">
                {displayTime}
              </p>
            </div>
            <div className="flex items-center">
              <p className="text-[10px] uppercase text-[#595f72] tracking-[0.3em] leading-none m-0">
                {displayDate}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 pt-1 lg:pt-0">
            <StatusDot label="Conf" active={apt.emailStatus?.confirmationSent} />
            <StatusDot label="24H" active={apt.emailStatus?.reminder24hSent} />
            <StatusDot label="2H" active={apt.emailStatus?.reminder2hSent} />
          </div>
        </div>

        <div className="flex flex-col h-[80px] justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center">
              <h3 className="text-[16px] text-[#251101] dark:text-zinc-100 tracking-tight capitalize leading-none m-0">
                {apt.firstName} {apt.surname}{' '}
                {apt.isGuest && (
                  <span className="text-[6px] px-1.5 py-0.5 text-[#595f72] uppercase tracking-[0.2em] font-serif">
                    Guest
                  </span>
                )}
              </h3>
            </div>
            <div className="flex items-center">
              <p className="text-[10px] text-[#595f72] tracking-tight lowercase leading-none m-0">
                {apt.email} <span className="mx-1.5 opacity-40">/</span> {apt.phone}
              </p>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center">
              {apt.services.map((s, i) => (
                <span
                  key={i}
                  className="text-[10px] uppercase tracking-[0.2em] text-[#595f72] font-medium leading-none m-0 pb-0.5 mr-2"
                >
                  {s}
                </span>
              ))}
            </div>

            <div className="flex items-center mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
              <span className="text-[8px] uppercase tracking-[0.2em] text-[#595f72] mr-2">
                Lane:
              </span>
              <select
                value={currentSpecialistId}
                onChange={handleSpecialistChange}
                disabled={isPending}
                className="bg-transparent text-[9px] uppercase tracking-[0.2em] font-serif text-[#251101] dark:text-zinc-100 outline-none border-b border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                <option value="">-- Unassigned --</option>
                {specialists?.map((s) => {
                  const sId = String(s.id)
                  // It is busy if their ID is in the overlap array, UNLESS it's the one already assigned to this exact ticket
                  const isBusy = busySpecialistIds.includes(sId) && currentSpecialistId !== sId

                  return (
                    <option key={sId} value={sId} disabled={isBusy}>
                      {s.name} {isBusy ? '(Busy)' : ''}
                    </option>
                  )
                })}
              </select>
              {isPending && (
                <span className="ml-2 text-[8px] animate-pulse text-[#48a9a6]">Saving...</span>
              )}
            </div>
          </div>
        </div>

        <div className="lg:border-l border-zinc-100 dark:border-zinc-900/50 lg:pl-8 w-full pt-6 lg:pt-0 border-t lg:border-t-0 mt-6 lg:mt-0">
          <BookingActions appointmentId={apt.id} currentStatus={apt.status} />
        </div>
      </div>
    </div>
  )
}

function StatusDot({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className="relative flex flex-col shrink-0 items-start justify-center h-[16px]">
      <div
        className={`absolute -top-1 left-0 w-full h-[1.5px] transition-all duration-700 ${active ? 'bg-[#248232] dark:bg-[#48a9a6]' : 'bg-zinc-200 dark:bg-zinc-800'}`}
      />
      <span
        className={`text-[10px] uppercase tracking-[0.2em] font-medium leading-none m-0 ${active ? 'text-[#248232] dark:text-[#48a9a6]' : 'text-[#595f72]'}`}
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
