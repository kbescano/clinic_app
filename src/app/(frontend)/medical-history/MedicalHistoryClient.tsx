'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import FadeIn from '../components/FadeIn'
import BackToHome from '../components/BackToHome'
import { useRouter, useSearchParams } from 'next/navigation'

export default function MedicalHistoryClient({
  initialData,
  totalPages,
  currentPage,
}: {
  initialData: any[]
  totalPages: number
  currentPage: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null)
  const [appointments, setAppointments] = useState(initialData)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    setAppointments(initialData)
  }, [initialData])

  const handleSaveNote = async (id: string, note: string) => {
    setSavingId(id)
    try {
      await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialistNotes: note }),
      })
    } catch (error) {
      console.error('Save failed', error)
    } finally {
      setTimeout(() => setSavingId(null), 800)
    }
  }

  const consolidatedData = useMemo(() => {
    const grouped: Record<string, any> = {}
    appointments.forEach((doc) => {
      const email = doc.email.toLowerCase()
      if (!grouped[email]) {
        grouped[email] = { ...doc, history: [], visitCount: 0 }
      }
      grouped[email].history.push(doc)
      grouped[email].visitCount += 1
    })
    return Object.values(grouped)
  }, [appointments])

  const updateFilters = (newPage?: number, newSearch?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newPage) params.set('page', newPage.toString())
    if (newSearch !== undefined) {
      params.set('search', newSearch)
      params.set('page', '1')
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black p-2 pt-10 md:p-8 lg:p-16 font-sans">
      <FadeIn>
        <div className="max-w-7xl mx-auto px-6 py-10 sm:px-6 lg:px-8">
          <header className="max-w-7xl overflow-x-hidden bg-white dark:bg-black pb-10">
            <p className="text-[7px] uppercase tracking-[0.6em] text-zinc-400 font-bold mb-3 dark:text-white">
              Medical
            </p>
            <h2 className="text-2xl md:text-3xl font-light tracking-tight uppercase dark:text-white">
              Records
            </h2>
            <div className="mt-6 h-[1px] w-12 bg-zinc-800 dark:bg-zinc-200 opacity-20" />
          </header>

          {/* Search Bar */}
          <div className="relative w-full lg:w-72 mb-10">
            <MagnifyingGlassIcon className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="text"
              placeholder="SEARCH PATIENTS..."
              value={search}
              onChange={(e) => {
                const val = e.target.value
                setSearch(val)
                // Optional: If you want it to trigger on every change, uncomment below:
                updateFilters(1, val)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateFilters(1, search)
                }
              }}
              className="w-full bg-transparent border-b border-gray-100 dark:border-zinc-800 py-2 pl-8 pr-4 text-[10px] dark:text-white tracking-widest uppercase focus:outline-none focus:border-black dark:focus:border-white transition-all placeholder:text-gray-200"
            />
          </div>

          <div className="space-y-2 mb-20">
            {/* TABLE HEADER: 12-Column Grid */}
            <div className="hidden md:grid grid-cols-12 pb-4 border-b border-gray-100 uppercase text-[9px] tracking-[0.4em] text-gray-400 font-bold px-4">
              <div className="col-span-1"></div>
              <div className="col-span-7">Patient & Details</div>
              <div className="col-span-2 text-center">Visits</div>
              <div className="col-span-2 text-right">Last Visit</div>
            </div>

            {consolidatedData.map((patient) => (
              <div
                key={patient.email}
                className="border-b border-gray-50 last:border-0 dark:border-zinc-900"
              >
                <div
                  onClick={() =>
                    setExpandedEmail(expandedEmail === patient.email ? null : patient.email)
                  }
                  className="grid grid-cols-1 md:grid-cols-12 py-6 cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-white/5 transition-colors items-center px-4 rounded-xl"
                >
                  {/* Column 1: Icon */}
                  <div className="md:col-span-1">
                    {expandedEmail === patient.email ? (
                      <ChevronUpIcon className="w-4 h-4" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-gray-300" />
                    )}
                  </div>

                  {/* Column 2: Name */}
                  <div className="md:col-span-7">
                    <p className="text-sm font-semibold uppercase tracking-tight dark:text-white">
                      {patient.firstName} {patient.surname}
                    </p>
                  </div>

                  {/* Columns 3 & 4: Stats (Uses md:contents to align with parent grid) */}
                  <div className="col-span-1 md:col-span-4 flex items-center justify-between md:contents mt-4 md:mt-0">
                    <div className="md:col-span-2 md:text-center flex items-center gap-3 md:justify-center">
                      <span className="md:hidden text-[7px] uppercase tracking-[0.3em] text-zinc-400 font-bold">
                        Visits
                      </span>
                      <span className="text-xs font-bold dark:text-white tabular-nums">
                        {patient.visitCount}
                      </span>
                    </div>

                    <div className="md:col-span-2 md:text-right flex items-center gap-3 md:justify-end">
                      <span className="md:hidden text-[7px] uppercase tracking-[0.3em] text-zinc-400 font-bold">
                        Last Visit
                      </span>
                      <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300 tabular-nums">
                        {new Date(patient.appointmentDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* EXPANDED SECTION */}
                {expandedEmail === patient.email && (
                  <div className="bg-zinc-50/30 dark:bg-zinc-900/40 px-6 py-8 md:ml-12 border-l border-black dark:border-white animate-in fade-in duration-300">
                    <div className="max-w-xl space-y-8">
                      <div className="space-y-4">
                        <h4 className="text-[8px] uppercase tracking-[0.3em] text-gray-400 font-bold flex items-center gap-2">
                          <CalendarIcon className="w-3 h-3" /> Timeline
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {patient.history.map((visit: any) => (
                            <div
                              key={visit.id}
                              className="bg-white dark:bg-black p-3 rounded-lg border border-gray-100 dark:border-zinc-800 flex items-center justify-between text-[10px]"
                            >
                              <span className="font-medium dark:text-white uppercase tracking-tighter">
                                {visit.service?.title || 'General'}
                              </span>
                              <span className="text-zinc-400 tabular-nums">
                                {new Date(visit.appointmentDate).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[8px] uppercase tracking-[0.3em] text-black dark:text-white font-bold flex items-center gap-2">
                            <PencilSquareIcon className="w-3 h-3" /> Clinical Record
                          </h4>
                          {savingId === patient.id && (
                            <span className="text-[7px] text-zinc-400 animate-pulse uppercase tracking-widest">
                              SAVING...
                            </span>
                          )}
                        </div>
                        <textarea
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-white dark:bg-black border border-gray-100 dark:border-zinc-800 rounded-xl p-4 text-xs font-light focus:outline-none focus:border-black transition-all min-h-[150px] leading-relaxed"
                          value={patient.specialistNotes || ''}
                          onChange={(e) => {
                            const val = e.target.value
                            setAppointments((prev) =>
                              prev.map((a) =>
                                a.id === patient.id ? { ...a, specialistNotes: val } : a,
                              ),
                            )
                          }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSaveNote(patient.id, patient.specialistNotes)
                          }}
                          className="w-full md:w-auto bg-black dark:bg-white text-white dark:text-black text-[8px] uppercase tracking-[0.3em] px-10 py-4 rounded-full transition-all active:scale-95 shadow-lg"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex justify-center border-t border-zinc-50 dark:border-zinc-900 pt-16 mb-20">
              <div className="flex items-center gap-12">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => updateFilters(currentPage - 1)}
                  className="text-[8px] uppercase tracking-[0.5em] text-zinc-400 hover:text-black disabled:opacity-10 transition-all"
                >
                  Prev
                </button>
                <div className="flex items-center gap-4 font-light text-[11px]">
                  <span className="text-zinc-300">{currentPage.toString().padStart(2, '0')}</span>
                  <div className="w-8 h-[1px] bg-zinc-100 dark:bg-zinc-800" />
                  <span className="dark:text-white">{totalPages.toString().padStart(2, '0')}</span>
                </div>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => updateFilters(currentPage + 1)}
                  className="text-[8px] uppercase tracking-[0.5em] text-zinc-400 hover:text-black disabled:opacity-10 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          <BackToHome />
        </div>
      </FadeIn>
    </div>
  )
}
