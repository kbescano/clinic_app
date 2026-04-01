'use client'

import React, { useState, useMemo, useEffect } from 'react'
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

export const dynamic = 'force-dynamic'

export default function MedicalHistoryClient({
  initialData,
  currentPage,
}: {
  initialData: any[]
  currentPage: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'name'>('latest')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [appointments, setAppointments] = useState(initialData)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [showNotification, setShowNotification] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [drawLine, setDrawLine] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setAppointments(initialData)
    const timer = setTimeout(() => setDrawLine(true), 500)
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
    const grouped: Record<string, any> = {}

    appointments.forEach((doc) => {
      const fName = (doc.firstName || '').toLowerCase().trim()
      const lName = (doc.surname || '').toLowerCase().trim()
      const email = (doc.email || '').toLowerCase().trim()
      const uniqueId = `${fName}-${lName}-${email}`

      const serviceName =
        typeof doc.service === 'object'
          ? doc.service?.title || doc.service?.name
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
        (v: any) => v.appointmentDate === doc.appointmentDate,
      )

      if (existingVisit) {
        if (!existingVisit.services.includes(serviceName)) {
          existingVisit.services.push(serviceName)
        }
      } else {
        grouped[uniqueId].history.push({
          ...doc,
          services: [serviceName],
        })
      }
    })

    return Object.values(grouped).map((patient: any) => ({
      ...patient,
      visitCount: patient.uniqueDates.size,
      services: Array.from(patient.allServices),
    }))
  }, [appointments])

  const sortedData = useMemo(() => {
    const dataToSort = [...consolidatedData]
    return dataToSort.sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = `${a.firstName} ${a.surname}`.toLowerCase()
        const nameB = `${b.firstName} ${b.surname}`.toLowerCase()
        return nameA.localeCompare(nameB)
      } else if (sortBy === 'oldest') {
        return new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
      } else {
        return new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
      }
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
    <div className="min-h-screen bg-white dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 pt-24 md:pt-32 pb-32 selection:bg-zinc-100 overflow-x-hidden">
      {showNotification && (
        <Notification
          message="Clinical record updated successfully"
          type="success"
          onClose={() => setShowNotification(false)}
        />
      )}

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
                <p className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-zinc-400 font-serif italic">
                  Clinical
                </p>
                <h1 className="text-[20px] md:text-[24px] font-light tracking-tight font-serif uppercase leading-none">
                  Patient Records
                </h1>
              </div>
            </div>

            {/* SEARCH (REDUCED FONT SCALE) */}
            <div className="relative w-full sm:w-64 group">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-300" />
              <input
                type="text"
                placeholder="SEARCH DATABASE..."
                value={search}
                onChange={(e) => {
                  const val = e.target.value
                  setSearch(val)
                  updateFilters(1, val)
                }}
                className="w-full bg-transparent border border-zinc-100 dark:border-zinc-900 rounded-full py-2.5 pl-10 pr-4 text-[9px] tracking-[0.2em] uppercase focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-all placeholder:text-zinc-300"
              />
            </div>
          </header>

          {/* LIST SECTION */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between mb-8 md:mb-10 border-b border-zinc-900 dark:border-white pb-3">
              <h3 className="text-[9px] md:text-[10px] uppercase tracking-[0.5em] font-medium font-serif italic">
                Database
              </h3>

              <div className="relative group">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as 'latest' | 'oldest' | 'name')
                    updateFilters(1)
                  }}
                  className="appearance-none bg-transparent border-none py-0 pl-0 pr-4 text-[8px] md:text-[9px] uppercase tracking-[0.3em] font-medium font-serif text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer outline-none transition-colors text-right"
                >
                  <option value="latest" className="text-right bg-white dark:bg-black">
                    Latest Visit
                  </option>
                  <option value="oldest" className="text-right bg-white dark:bg-black">
                    Oldest Visit
                  </option>
                  <option value="name" className="text-right bg-white dark:bg-black">
                    Sort by Name
                  </option>
                </select>

                <ChevronDownIcon className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-zinc-400 pointer-events-none group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
              </div>
            </div>

            <div className="divide-y divide-zinc-50 dark:divide-zinc-900/50">
              {paginatedData.length > 0 ? (
                paginatedData.map((patient) => (
                  <div
                    key={patient.uniqueId}
                    className="group transition-colors hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10"
                  >
                    {/* VISIBLE ROW (REDUCED FONT SCALE) */}
                    <div
                      onClick={() =>
                        setExpandedId(expandedId === patient.uniqueId ? null : patient.uniqueId)
                      }
                      className="py-6 md:py-7 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-[14px] md:text-[15px] capitalize font-serif tracking-wide text-zinc-800 dark:text-zinc-100">
                            {patient.firstName} {patient.surname}
                          </h3>
                          {patient.isGuestPatient && (
                            <span className="text-[6px] px-1.5 py-0.5 rounded-sm border border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase tracking-widest font-serif italic">
                              Guest
                            </span>
                          )}
                        </div>
                        <p className="text-[8px] md:text-[9px] text-zinc-400 font-serif tracking-wider uppercase italic">
                          {patient.email}
                        </p>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-10 md:gap-14">
                        <div className="text-left md:text-center">
                          <p className="text-[8px] uppercase tracking-[0.3em] text-zinc-400 font-serif mb-1 italic">
                            Sessions
                          </p>
                          <p className="text-[13px] font-light font-serif tabular-nums text-zinc-800 dark:text-zinc-100">
                            {patient.visitCount.toString().padStart(2, '0')}
                          </p>
                        </div>
                        <div className="flex gap-4">
                          <div className="text-right">
                            <p className="text-[8px] uppercase tracking-[0.3em] text-zinc-400 font-serif mb-1 italic">
                              Latest
                            </p>
                            <p className="text-[9px] md:text-[10px] font-light font-serif text-zinc-400 whitespace-nowrap uppercase tracking-widest">
                              {new Date(patient.appointmentDate).toLocaleDateString('en-PH', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <div className="md:pl-4">
                            {expandedId === patient.uniqueId ? (
                              <ChevronUpIcon className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />
                            ) : (
                              <ChevronDownIcon className="w-3.5 h-3.5 text-zinc-200" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* EXPANDED PANEL (REDUCED FONT SCALE) */}
                    {expandedId === patient.uniqueId && (
                      <div className="pb-8 pt-2 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-zinc-50 dark:bg-zinc-900 border border-zinc-50 dark:border-zinc-900 overflow-hidden shadow-sm">
                          {/* Left: History */}
                          <div className="lg:col-span-5 bg-white dark:bg-black p-6 md:p-8 space-y-6">
                            <h4 className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] text-zinc-400 font-medium font-serif italic flex items-center gap-2">
                              <CalendarIcon className="w-3 h-3" /> Visit Registry
                            </h4>
                            <div className="flex flex-col gap-3">
                              {patient.history
                                .filter(
                                  (v: any) => v.status === 'completed' || v.status === 'confirmed',
                                )
                                .map((visit: any, index: number) => (
                                  <div
                                    key={visit.id || index}
                                    className="flex justify-between items-center gap-4 border-b border-zinc-50 dark:border-zinc-900/30 pb-3"
                                  >
                                    <div className="flex flex-wrap gap-2">
                                      {visit.services?.map((serviceName: string, idx: number) => (
                                        <span
                                          key={idx}
                                          className="text-[7px] md:text-[8px] uppercase tracking-widest border border-zinc-50 dark:border-zinc-800 px-2 py-1 rounded-sm italic font-light text-zinc-500"
                                        >
                                          {serviceName}
                                        </span>
                                      ))}
                                    </div>

                                    <span className="text-[8px] text-zinc-400 font-serif tabular-nums uppercase">
                                      {new Date(visit.appointmentDate).toLocaleDateString('en-PH', {
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </span>
                                  </div>
                                ))}

                              {patient.history.filter(
                                (v: any) => v.status === 'completed' || v.status === 'confirmed',
                              ).length === 0 && (
                                <p className="text-[9px] text-zinc-300 font-serif italic py-1">
                                  No registry found.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right: Notes */}
                          <div className="lg:col-span-7 bg-white dark:bg-black p-6 md:p-8 space-y-6">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] text-zinc-400 font-medium font-serif italic flex items-center gap-2">
                                <PencilSquareIcon className="w-3 h-3" /> Clinical Observation
                              </h4>
                              {savingId === patient.id && (
                                <span className="text-[7px] uppercase tracking-[0.3em] animate-pulse text-zinc-400 font-medium">
                                  Saving...
                                </span>
                              )}
                            </div>
                            <textarea
                              onClick={(e) => e.stopPropagation()}
                              className="w-full bg-zinc-50/30 dark:bg-zinc-900/20 border border-zinc-50 dark:border-zinc-800 p-5 text-[12px] font-light dark:text-zinc-200 focus:outline-none focus:border-zinc-200 transition-all min-h-[160px] leading-relaxed font-serif"
                              value={patient.specialistNotes || ''}
                              placeholder="Directives and observations..."
                              onChange={(e) => {
                                const val = e.target.value
                                setAppointments((prev) =>
                                  prev.map((a) =>
                                    a.id === patient.id ? { ...a, specialistNotes: val } : a,
                                  ),
                                )
                              }}
                            />
                            <div className="flex justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSaveNote(patient.id, patient.specialistNotes)
                                }}
                                disabled={savingId === patient.id}
                                className="px-8 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-[9px] uppercase tracking-[0.3em] font-medium transition-all hover:bg-black dark:hover:bg-zinc-200 disabled:opacity-50"
                              >
                                {savingId === patient.id ? 'Processing...' : 'Save Record'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-20 flex items-center justify-center border border-dashed border-zinc-100 dark:border-zinc-900">
                  <p className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-light text-zinc-300 italic">
                    Registry Empty
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* PAGINATION (REDUCED FONT SCALE) */}
          {totalPages > 1 && (
            <div className="mt-16 flex items-center justify-between pt-8 border-t border-zinc-50 dark:border-zinc-900">
              <button
                disabled={currentPage <= 1}
                onClick={() => updateFilters(currentPage - 1)}
                className="flex items-center gap-3 text-[9px] font-medium uppercase tracking-[0.3em] text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-10 transition-all"
              >
                <ChevronLeftIcon className="w-3.5 h-3.5" /> Previous
              </button>
              <div className="text-[10px] font-medium font-serif text-zinc-500 dark:text-zinc-400 tracking-widest">
                {currentPage} / {totalPages}
              </div>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => updateFilters(currentPage + 1)}
                className="flex items-center gap-3 text-[9px] font-medium uppercase tracking-[0.3em] text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-10 transition-all"
              >
                Next <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="mt-20 pt-10 flex justify-center border-t border-zinc-50 dark:border-zinc-900 opacity-40 hover:opacity-100 transition-opacity">
            <BackToHome />
          </div>
        </div>
      </FadeIn>
    </div>
  )
}

function DirectorySkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-black pt-32 px-6">
      <div className="max-w-5xl mx-auto animate-pulse">
        <div className="h-[1px] bg-zinc-100 dark:bg-zinc-900 mb-12 w-full" />
        <div className="space-y-6">
          <div className="h-20 border-b border-zinc-50 w-full" />
          <div className="h-20 border-b border-zinc-50 w-full" />
        </div>
      </div>
    </div>
  )
}
