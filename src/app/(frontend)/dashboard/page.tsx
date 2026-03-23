import { getPayload } from 'payload'
import config from '@/payload.config'
import React from 'react'
import FadeIn from '../components/FadeIn'
import BackToHome from '../components/BackToHome'

// 1. Define Local Interface for Type Safety
interface Appointment {
  id: string
  firstName: string
  surname: string
  email: string
  phone: string
  appointmentDate: string
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  service?: {
    title: string
  }
}

interface MergedAppointment extends Omit<Appointment, 'service'> {
  services: string[]
}

/**
 * Helper to group appointments by Person + Time
 */
function groupAppointments(docs: Appointment[]): MergedAppointment[] {
  const grouped = docs.reduce((acc: Record<string, MergedAppointment>, curr) => {
    // Key includes the date string to ensure different times stay separate
    const key = `${curr.email}-${curr.appointmentDate}`

    if (!acc[key]) {
      acc[key] = {
        ...curr,
        services: [curr.service?.title || 'General Consultation'],
      }
    } else {
      acc[key].services.push(curr.service?.title || 'General Consultation')
    }
    return acc
  }, {})

  return Object.values(grouped)
}

// 2. Formatting Helpers for Philippines Time (PHT)
const formatPHTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString('en-US', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

const formatPHDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

export default async function SpecialistDashboard() {
  const payload = await getPayload({ config })

  const now = new Date()
  const todayStart = new Date(new Date(now).setHours(0, 0, 0, 0)).toISOString()
  const todayEnd = new Date(new Date(now).setHours(23, 59, 59, 999)).toISOString()
  const next7Days = new Date(now)
  next7Days.setDate(next7Days.getDate() + 7)

  const [todayRaw, weekRaw] = await Promise.all([
    payload.find({
      collection: 'appointments',
      where: {
        appointmentDate: { greater_than_equal: todayStart, less_than_equal: todayEnd },
        status: { not_equals: 'cancelled' },
      },
      sort: 'appointmentDate',
      depth: 1,
      limit: 100,
    }),
    payload.find({
      collection: 'appointments',
      where: {
        appointmentDate: { greater_than: todayEnd, less_than_equal: next7Days.toISOString() },
        status: { not_equals: 'cancelled' },
      },
      sort: 'appointmentDate',
      depth: 1,
      limit: 100,
    }),
  ])

  const todayData = groupAppointments(todayRaw.docs as unknown as Appointment[])
  const weekData = groupAppointments(weekRaw.docs as unknown as Appointment[])

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black p-4 pt-10 md:p-8 lg:p-16 font-sans">
      <FadeIn>
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <header className="max-w-7xl overflow-x-hidden bg-white dark:bg-black pb-10">
            <p className="text-[7px] uppercase tracking-[0.6em] text-zinc-400 font-bold mb-3 dark:text-white">
              Clinic
            </p>
            <h2 className="text-2xl md:text-3xl font-light tracking-tight uppercase dark:text-white">
              Schedule
            </h2>
            <div className="mt-6 h-[1px] w-12 bg-zinc-800 dark:bg-zinc-200 opacity-20" />
          </header>

          <header className="mb-8">
            <div className="bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 w-fit">
              <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                {new Date().toLocaleDateString('en-PH', {
                  timeZone: 'Asia/Manila',
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* --- TODAY'S QUEUE --- */}
            <section className="lg:col-span-4 space-y-4">
              <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-zinc-400 flex items-center gap-3">
                <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                Today&apos;s Schedule
              </h2>
              <div className="space-y-3">
                {todayData.length > 0 ? (
                  todayData.map((apt) => (
                    <div
                      key={apt.id}
                      className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-900 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[11px] font-black text-[#006992] bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                          {formatPHTime(apt.appointmentDate)}
                        </span>
                        <StatusBadge status={apt.status} />
                      </div>
                      <h3 className="font-bold text-slate-800 dark:text-zinc-100">
                        {apt.firstName} {apt.surname}
                      </h3>
                      <div className="mt-1 space-y-0.5">
                        {apt.services.map((service, idx) => (
                          <p key={idx} className="text-xs text-slate-500 dark:text-zinc-400">
                            • {service}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center bg-zinc-50/50 dark:bg-zinc-900/20 rounded-2xl border-2 border-dashed border-slate-100 dark:border-zinc-900 text-slate-400 text-sm">
                    No appointments today.
                  </div>
                )}
              </div>
            </section>

            {/* --- WEEKLY VIEW --- */}
            <section className="lg:col-span-8 space-y-4">
              <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-zinc-400">
                Weekly Overview
              </h2>

              {/* MOBILE CARDS (Visible on small screens only) */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {weekData.map((apt) => (
                  <div
                    key={apt.id}
                    className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-slate-100 dark:border-zinc-900"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-zinc-100">
                          {apt.firstName} {apt.surname}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase mt-1">
                          {formatPHDate(apt.appointmentDate)} @ {formatPHTime(apt.appointmentDate)}
                        </p>
                      </div>
                      <StatusBadge status={apt.status} />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-slate-50 dark:border-zinc-900">
                      {apt.services.map((s, i) => (
                        <span
                          key={i}
                          className="text-[9px] text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800 px-2 py-0.5 rounded uppercase"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE (Visible on md and up) */}
              <div className="hidden md:block bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-900 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-900">
                    <tr>
                      <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        Patient
                      </th>
                      <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        Services
                      </th>
                      <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        Time
                      </th>
                      <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-zinc-900">
                    {weekData.map((apt) => (
                      <tr
                        key={apt.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-700 dark:text-zinc-200">
                            {apt.firstName} {apt.surname}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {apt.services.map((s, i) => (
                              <span
                                key={i}
                                className="text-[10px] text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded w-fit uppercase"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-700 dark:text-zinc-200">
                            {formatPHDate(apt.appointmentDate)}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-medium">
                            {formatPHTime(apt.appointmentDate)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={apt.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {weekData.length === 0 && (
                <div className="p-16 text-center text-slate-400 text-[11px] uppercase tracking-widest bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-900">
                  No upcoming bookings.
                </div>
              )}
            </section>
          </div>
          <BackToHome />
        </div>
      </FadeIn>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed:
      'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30',
    pending:
      'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30',
    cancelled:
      'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/30',
    completed:
      'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30',
  }
  return (
    <span
      className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${styles[status] || styles.pending}`}
    >
      {status}
    </span>
  )
}
