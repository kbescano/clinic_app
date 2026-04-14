'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarIcon,
  PencilSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import FadeIn from '../components/FadeIn'
import BackToHome from '../components/BackToHome'
import Notification from '../components/Notification'
import { useRouter, useSearchParams } from 'next/navigation'

// --- TYPES & INTERFACES ---

export interface RawAppointment {
  id: string
  firstName: string
  surname: string
  email: string
  isGuest?: boolean
  appointmentDate: string
  status: 'confirmed' | 'cancelled' | 'pending' | 'completed'
  specialistNotes?: string
  service?: string | { title?: string; name?: string }
}

interface VisitEntry extends RawAppointment {
  services: string[]
}

interface PatientRecord extends RawAppointment {
  uniqueId: string
  history: VisitEntry[]
  visitCount: number
  services: string[]
  isGuestPatient: boolean
}

// Helper for initial grouping setup
interface GroupedAccumulator extends RawAppointment {
  uniqueId: string
  history: VisitEntry[]
  uniqueDates: Set<string>
  allServices: Set<string>
  isGuestPatient: boolean
}

export const dynamic = 'force-dynamic'

export default function MedicalHistoryClient({
  initialData,
  currentPage,
}: {
  initialData: RawAppointment[]
  currentPage: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'name'>('latest')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<RawAppointment[]>(initialData)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [showNotification, setShowNotification] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [drawLine, setDrawLine] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setAppointments(initialData)
    const timer = setTimeout(() => setDrawLine(true), 100)
    return () => clearTimeout(timer)
  }, [initialData])

  const handleSaveNote = async (id: string, note: string) => {
    setSavingId(id)
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialistNotes: note }),
      })
      if (res.ok) {
        setShowNotification(true)
        setTimeout(() => setShowNotification(false), 3000)
      }
    } catch (error) {
      console.error('Save failed', error)
    } finally {
      setTimeout(() => setSavingId(null), 800)
    }
  }

  const ITEMS_PER_PAGE = 10

  const consolidatedData = useMemo(() => {
    const grouped: Record<string, GroupedAccumulator> = {}

    appointments.forEach((doc) => {
      const fName = (doc.firstName || '').toLowerCase().trim()
      const lName = (doc.surname || '').toLowerCase().trim()
      const email = (doc.email || '').toLowerCase().trim()
      const uniqueId = `${fName}-${lName}-${email}`

      const serviceName =
        typeof doc.service === 'object'
          ? doc.service?.title || doc.service?.name || 'General Procedure'
          : doc.service || 'General Procedure'

      if (!grouped[uniqueId]) {
        grouped[uniqueId] = {
          ...doc,
          uniqueId,
          history: [],
          uniqueDates: new Set(),
          allServices: new Set(),
          isGuestPatient: doc.isGuest === true,
        }
      }

      grouped[uniqueId].allServices.add(serviceName)
      grouped[uniqueId].uniqueDates.add(doc.appointmentDate)

      const existingVisit = grouped[uniqueId].history.find(
        (v) => v.appointmentDate === doc.appointmentDate,
      )

      if (existingVisit) {
        if (!existingVisit.services.includes(serviceName)) existingVisit.services.push(serviceName)
      } else {
        grouped[uniqueId].history.push({ ...doc, services: [serviceName] })
      }
    })

    return Object.values(grouped).map(
      (patient): PatientRecord => ({
        ...patient,
        visitCount: patient.uniqueDates.size,
        services: Array.from(patient.allServices),
      }),
    )
  }, [appointments])

  const sortedData = useMemo(() => {
    const dataToSort = [...consolidatedData]
    return dataToSort.sort((a, b) => {
      if (sortBy === 'name')
        return `${a.firstName} ${a.surname}`
          .toLowerCase()
          .localeCompare(`${b.firstName} ${b.surname}`.toLowerCase())
      if (sortBy === 'oldest')
        return new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
      return new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
    })
  }, [consolidatedData, sortBy])

  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE) || 1

  const paginatedData = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages)
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE
    return sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [sortedData, currentPage, totalPages])

  const updateFilters = (newPage?: number, newSearch?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newPage) params.set('page', newPage.toString())
    if (newSearch !== undefined) {
      params.set('search', newSearch)
      params.set('page', '1')
    }
    router.push(`?${params.toString()}`)
  }

  if (!isMounted) return <DirectorySkeleton />

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-[#251101] dark:text-zinc-100 pt-24 md:pt-32 pb-32 px-4 md:px-8 selection:bg-zinc-100 overflow-x-hidden font-sans">
      {showNotification && (
        <Notification
          message="Clinical record updated successfully"
          type="success"
          onClose={() => setShowNotification(false)}
        />
      )}

      <FadeIn>
        <div className="max-w-4xl mx-auto flex flex-col gap-10 md:gap-20">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12">
            <div className="space-y-4 relative">
              <div
                className={`absolute -left-4 md:-left-8 top-0 w-[1px] bg-zinc-900 dark:bg-white transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] origin-top ${drawLine ? 'h-full opacity-100' : 'h-0 opacity-0'}`}
              />
              <div
                className={`transition-all duration-1000 delay-100 ${drawLine ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              >
                <p className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                  Clinical
                </p>
              </div>
              <h1
                className={`text-[28px] md:text-[48px] font-light tracking-tighter font-serif leading-none transition-all duration-[1200ms] delay-300 ease-out ${drawLine ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-md'}`}
              >
                Patient Records
              </h1>
            </div>

            <div
              className={`self-end md:self-auto inline-flex items-center bg-zinc-50 dark:bg-zinc-900/50 p-1.5 rounded-full border border-zinc-100 dark:border-zinc-800/50 relative transition-all duration-1000 delay-500 ${drawLine ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >
              <div
                className="absolute top-1.5 bottom-1.5 w-20 sm:w-24 md:w-28 bg-white dark:bg-zinc-800 rounded-full shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  transform:
                    sortBy === 'latest'
                      ? 'translateX(0)'
                      : sortBy === 'oldest'
                        ? 'translateX(100%)'
                        : 'translateX(200%)',
                }}
              />
              <button
                onClick={() => {
                  setSortBy('latest')
                  updateFilters(1)
                }}
                className={`relative z-10 w-20 sm:w-24 md:w-28 py-2.5 md:py-2 text-[7px] md:text-[8px] uppercase tracking-[0.3em] font-medium transition-colors duration-300 font-serif ${sortBy === 'latest' ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'}`}
              >
                Latest
              </button>
              <button
                onClick={() => {
                  setSortBy('oldest')
                  updateFilters(1)
                }}
                className={`relative z-10 w-20 sm:w-24 md:w-28 py-2.5 md:py-2 text-[7px] md:text-[8px] uppercase tracking-[0.3em] font-medium transition-colors duration-300 font-serif ${sortBy === 'oldest' ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'}`}
              >
                Oldest
              </button>
              <button
                onClick={() => {
                  setSortBy('name')
                  updateFilters(1)
                }}
                className={`relative z-10 w-20 sm:w-24 md:w-28 py-2.5 md:py-2 text-[7px] md:text-[8px] uppercase tracking-[0.3em] font-medium transition-colors duration-300 font-serif ${sortBy === 'name' ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'}`}
              >
                A - Z
              </button>
            </div>
          </header>

          <section className="flex flex-col gap-6 md:gap-8">
            <div
              className={`flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-4 transition-all duration-1000 delay-700 ${drawLine ? 'opacity-100' : 'opacity-0'}`}
            >
              <label
                htmlFor="record-search"
                className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif"
              >
                Database
              </label>
              <div className="self-end md:self-auto w-full md:w-64 relative group">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#595f72]" />
                <input
                  id="record-search"
                  name="recordSearch"
                  type="text"
                  placeholder="Search Database..."
                  value={search}
                  onChange={(e) => {
                    const val = e.target.value
                    setSearch(val)
                    updateFilters(1, val)
                  }}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 rounded-full py-3 md:py-2.5 pl-10 pr-4 text-[9px] md:text-[10px] font-serif placeholder:text-[#595f72] text-[#251101] dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-200 dark:focus:ring-zinc-700 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="flex flex-col border-b border-zinc-100 dark:border-zinc-900/50">
              {paginatedData.length > 0 ? (
                paginatedData.map((patient) => (
                  <PatientRow
                    key={patient.uniqueId}
                    patient={patient}
                    expandedId={expandedId}
                    setExpandedId={setExpandedId}
                    handleSaveNote={handleSaveNote}
                    savingId={savingId}
                    setAppointments={setAppointments}
                  />
                ))
              ) : (
                <div className="py-24 flex items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 mt-4">
                  <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-[#595f72] font-serif">
                    No records found
                  </p>
                </div>
              )}
            </div>
          </section>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-8 border-t border-zinc-100 dark:border-zinc-900/50">
              <button
                disabled={currentPage <= 1}
                onClick={() => updateFilters(currentPage - 1)}
                className="flex items-center gap-3 text-[7px] md:text-[8px] font-medium uppercase tracking-[0.3em] text-[#595f72] hover:text-[#251101] dark:hover:text-white disabled:opacity-20 transition-all font-serif"
              >
                <ChevronLeftIcon className="w-3.5 h-3.5" /> Previous
              </button>
              <div className="text-[10px] md:text-[11px] font-serif text-[#595f72] tracking-widest">
                {currentPage} / {totalPages}
              </div>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => updateFilters(currentPage + 1)}
                className="flex items-center gap-3 text-[7px] md:text-[8px] font-medium uppercase tracking-[0.3em] text-[#595f72] hover:text-[#251101] dark:hover:text-white disabled:opacity-20 transition-all font-serif"
              >
                Next <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="pt-8 md:pt-12 flex justify-center border-t border-zinc-50 dark:border-zinc-900/50 opacity-40 hover:opacity-100 transition-opacity">
            <BackToHome />
          </div>
        </div>
      </FadeIn>
    </div>
  )
}

interface PatientRowProps {
  patient: PatientRecord
  expandedId: string | null
  setExpandedId: (id: string | null) => void
  handleSaveNote: (id: string, note: string) => Promise<void>
  savingId: string | null
  setAppointments: React.Dispatch<React.SetStateAction<RawAppointment[]>>
}

function PatientRow({
  patient,
  expandedId,
  setExpandedId,
  handleSaveNote,
  savingId,
  setAppointments,
}: PatientRowProps) {
  const [isVisible, setIsVisible] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: 0.1,
      rootMargin: '0px 0px -20px 0px',
    })
    if (rowRef.current) observer.observe(rowRef.current)
    return () => observer.disconnect()
  }, [])

  const isExpanded = expandedId === patient.uniqueId

  return (
    <div
      ref={rowRef}
      className={`group transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] border-t border-zinc-100 dark:border-zinc-900/50 ${isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-sm'}`}
    >
      <div
        onClick={() => setExpandedId(isExpanded ? null : patient.uniqueId)}
        className={`py-5 px-5 md:px-2 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-8 transition-colors ${isExpanded ? 'bg-zinc-50 dark:bg-zinc-900/20' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10'}`}
      >
        <div className="flex-1 space-y-1.5 md:space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="text-[15px] md:text-[16px] capitalize font-serif tracking-tight text-[#251101] dark:text-zinc-100 leading-none">
              {patient.firstName} {patient.surname}
            </h3>
            {patient.isGuestPatient && (
              <span className="text-[6px] px-1.5 py-0.5 text-[#595f72] uppercase tracking-[0.2em] font-serif">
                Guest
              </span>
            )}
          </div>
          <p className="text-[9px] md:text-[10px] text-[#595f72] font-serif tracking-tight lowercase">
            {patient.email}
          </p>
        </div>

        <div className="flex items-end md:items-center justify-between w-full md:w-auto gap-8 md:gap-14">
          <div className="text-left md:text-center">
            <p className="text-[7px] md:text-[8px] uppercase tracking-[0.3em] text-[#595f72] font-serif mb-1 md:mb-1.5">
              Sessions
            </p>
            <p className="text-[12px] md:text-[14px] font-light font-serif text-[#251101] dark:text-zinc-100 tabular-nums leading-none">
              {patient.visitCount.toString().padStart(2, '0')}
            </p>
          </div>
          <div className="flex items-end md:items-center gap-6">
            <div className="text-right">
              <p className="text-[7px] md:text-[8px] uppercase tracking-[0.3em] text-[#595f72] font-serif mb-1 md:mb-1.5">
                Latest
              </p>
              <p className="text-[10px] md:text-[11px] font-serif text-[#251101] dark:text-zinc-100 whitespace-nowrap tracking-wider leading-none">
                {new Date(patient.appointmentDate).toLocaleDateString('en-PH', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="pl-2">
              <div className="w-6 h-6 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center transition-colors group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800">
                {isExpanded ? (
                  <ChevronUpIcon className="w-3 h-3 text-[#251101] dark:text-white" />
                ) : (
                  <ChevronDownIcon className="w-3 h-3 text-[#595f72]" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isExpanded ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-5 md:p-6 pb-8 md:pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50 shadow-sm">
            <div className="lg:col-span-5 bg-white dark:bg-[#050505] p-5 md:p-8 space-y-6 md:space-y-8">
              <h4 className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif flex items-center gap-2">
                <CalendarIcon className="w-3.5 h-3.5" /> Visit History
              </h4>
              <div className="flex flex-col gap-4 md:gap-5">
                {patient.history
                  .filter((v) => v.status === 'completed' || v.status === 'confirmed')
                  .map((visit, index) => (
                    <div
                      key={visit.id || index}
                      className="flex justify-between items-start gap-4 border-b border-zinc-100 dark:border-zinc-900/50 pb-4"
                    >
                      <div className="flex flex-wrap gap-1.5">
                        {visit.services?.map((s, i) => (
                          <span
                            key={i}
                            className="text-[6px] md:text-[7px] uppercase tracking-[0.2em] px-1.5 py-0.5 font-medium text-[#595f72] font-serif"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                      <span className="text-[9px] md:text-[10px] font-serif text-[#251101] dark:text-zinc-100 whitespace-nowrap tracking-wider text-right mt-0.5">
                        {new Date(visit.appointmentDate).toLocaleDateString('en-PH', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  ))}
                {patient.history.filter((v) => v.status === 'completed' || v.status === 'confirmed')
                  .length === 0 && (
                  <p className="text-[10px] md:text-[12px] text-zinc-400 font-serif">
                    No confirmed visits.
                  </p>
                )}
              </div>
            </div>
            <div className="lg:col-span-7 bg-white dark:bg-[#050505] p-5 md:p-8 space-y-6 md:space-y-8 flex flex-col">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={`observation-${patient.uniqueId}`}
                  className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif flex items-center gap-2 cursor-pointer"
                >
                  <PencilSquareIcon className="w-3.5 h-3.5" /> Clinical Observation
                </label>
                {savingId === patient.id && (
                  <span className="text-[6px] md:text-[7px] uppercase tracking-[0.3em] animate-pulse text-[#48a9a6] font-medium font-serif">
                    Saving...
                  </span>
                )}
              </div>
              <textarea
                id={`observation-${patient.uniqueId}`}
                name={`observation-${patient.uniqueId}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 w-full bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-100 dark:border-zinc-800/50 p-5 text-[13px] md:text-[14px] text-[#251101] dark:text-zinc-200 focus:outline-none focus:border-zinc-300 dark:focus:border-zinc-600 transition-all min-h-[180px] leading-relaxed font-serif resize-none"
                value={patient.specialistNotes || ''}
                placeholder="Add directives and observations here..."
                onChange={(e) => {
                  const val = e.target.value
                  setAppointments((prev) =>
                    prev.map((a) => (a.id === patient.id ? { ...a, specialistNotes: val } : a)),
                  )
                }}
              />
              <div className="flex justify-end pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSaveNote(patient.id, patient.specialistNotes || '')
                  }}
                  disabled={savingId === patient.id}
                  className="px-8 py-3 bg-[#251101] dark:bg-white text-white dark:text-[#251101] text-[7px] md:text-[8px] uppercase tracking-[0.3em] font-serif transition-all hover:opacity-80 disabled:opacity-50"
                >
                  {savingId === patient.id ? 'Processing...' : 'Save Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DirectorySkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-black pt-32 px-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-20 animate-pulse">
        <div className="space-y-4">
          <div className="h-[1px] bg-zinc-100 dark:bg-zinc-900 w-12" />
          <div className="h-4 bg-zinc-100 dark:bg-zinc-900 w-24" />
          <div className="h-10 bg-zinc-100 dark:bg-zinc-900 w-64" />
        </div>
        <div className="space-y-6">
          <div className="h-20 border-b border-zinc-50 dark:border-zinc-900/50 w-full" />
          <div className="h-20 border-b border-zinc-50 dark:border-zinc-900/50 w-full" />
        </div>
      </div>
    </div>
  )
}
