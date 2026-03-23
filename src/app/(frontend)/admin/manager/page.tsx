// src/app/(frontend)/booking/BookingPage.tsx
import FadeIn from '../../components/FadeIn'
import { getPayload } from 'payload'
import config from '@/payload.config'
import BookingActions from './actions'
import { CalendarIcon, ClockIcon, TableCellsIcon } from '@heroicons/react/24/outline'
import MassUpload from '../../components/MassUpload'

export default async function BookingPage() {
  const payload = await getPayload({ config })
  const now = new Date()

  const startOfToday = new Date(now.setHours(0, 0, 0, 0)).toISOString()
  const endOfToday = new Date(now.setHours(23, 59, 59, 999)).toISOString()
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(now.getDate() + 7)
  const endOfWeek = sevenDaysFromNow.toISOString()

  const data = await payload.find({
    collection: 'appointments',
    where: {
      and: [
        { appointmentDate: { greater_than_equal: startOfToday } },
        { appointmentDate: { less_than_equal: endOfWeek } },
        { status: { not_equals: 'cancelled' } },
      ],
    },
    sort: 'appointmentDate',
    limit: 100,
  })

  const appointments = data.docs
  const todayAppts = appointments.filter((a) => new Date(a.appointmentDate) <= new Date(endOfToday))
  const upcomingAppts = appointments.filter(
    (a) => new Date(a.appointmentDate) > new Date(endOfToday),
  )

  return (
    <FadeIn>
      <div className="min-h-screen bg-white dark:bg-black text-black p-2 pt-10 md:p-8 lg:p-16 font-sans">
        <div className="max-w-7xl mx-auto px-6 py-10 sm:px-6 lg:px-8">
          {/* HEADER */}
          <header className="max-w-4xl pb-10">
            <p className="text-[7px] uppercase tracking-[0.6em] text-zinc-400 font-bold mb-3">
              Agenda
            </p>
            <h1 className="text-2xl md:text-3xl font-light tracking-tight uppercase dark:text-white">
              Clinic Schedule
            </h1>
            <div className="mt-6 h-[1px] w-12 bg-zinc-800 dark:bg-zinc-200 opacity-20" />
          </header>

          {/* SECTION: TODAY */}
          <section className="mb-24">
            <div className="flex items-center gap-3 mb-10 px-2 md:justify-start">
              <ClockIcon className="w-4 h-4 text-zinc-400" />
              <h2 className="text-[10px] uppercase tracking-[0.4em] font-bold dark:text-zinc-200">
                Today&apos;s Sessions
              </h2>
            </div>
            <div className="space-y-4">
              {todayAppts.length > 0 ? (
                todayAppts.map((apt: any) => (
                  <AppointmentCard key={apt.id} apt={apt} isToday={true} />
                ))
              ) : (
                <p className="text-[9px] uppercase tracking-widest text-zinc-300 py-16 border border-dashed border-zinc-100 dark:border-zinc-900 rounded-2xl text-center">
                  No sessions today
                </p>
              )}
            </div>
          </section>

          {/* SECTION: UPCOMING WEEK */}
          <section className="mb-32">
            <div className="flex items-center gap-3 mb-10 px-2 md:justify-start">
              <CalendarIcon className="w-4 h-4 text-zinc-400" />
              <h2 className="text-[10px] uppercase tracking-[0.4em] font-bold dark:text-zinc-200">
                Next 7 Days
              </h2>
            </div>
            <div className="space-y-4">
              {upcomingAppts.map((apt: any) => (
                <AppointmentCard key={apt.id} apt={apt} isToday={false} />
              ))}
            </div>
          </section>

          {/* SYSTEM TOOLS (Formerly Sidebar) */}
          <section className="pt-20 border-t border-zinc-100 dark:border-zinc-900">
            <div className="max-w-7xl mx-auto">
              <header className="mb-12">
                <p className="text-[7px] uppercase tracking-[0.6em] text-zinc-400 font-bold mb-3 flex items-center gap-2">
                  <TableCellsIcon className="w-3 h-3" />
                  Database
                </p>
                <h2 className="text-xl font-light uppercase tracking-tight dark:text-white">
                  System Tools
                </h2>
              </header>

              <MassUpload />

              <p className="text-[9px] text-zinc-400 uppercase tracking-widest leading-relaxed text-center mt-8 px-6">
                Use the tool above to import bulk patient data. Ensure JSON format matches clinic
                standards.
              </p>
            </div>
          </section>
        </div>
      </div>
    </FadeIn>
  )
}

function AppointmentCard({ apt, isToday }: { apt: any; isToday: boolean }) {
  return (
    <div
      className={`p-6 md:p-8 rounded-2xl border transition-all duration-300 ${
        isToday
          ? 'bg-zinc-50/50 border-zinc-100 dark:bg-white/[0.02] dark:border-zinc-900 shadow-sm'
          : 'border-zinc-50 dark:border-zinc-900/50 hover:bg-zinc-50/30'
      }`}
    >
      <div className="flex flex-col gap-6">
        {/* ROW 1: TIME & PATIENT */}
        <div className="grid grid-cols-2 md:flex md:items-center gap-4 md:gap-10">
          <div className="flex flex-col gap-1 md:block md:min-w-[70px]">
            <span className="md:hidden text-[7px] uppercase tracking-[0.4em] text-zinc-400 font-bold">
              Time
            </span>
            <p className="text-xl md:text-2xl font-light dark:text-white tabular-nums leading-none">
              {new Date(apt.appointmentDate).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </p>
          </div>

          <div className="hidden md:block h-8 w-[1px] bg-zinc-200 dark:bg-zinc-800 opacity-50" />

          <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-4 min-w-0">
            <div className="flex flex-col md:flex-row md:items-baseline md:gap-4">
              <p className="text-base font-bold uppercase tracking-tight dark:text-white truncate">
                {apt.firstName} {apt.surname}
              </p>
              <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-400 truncate font-medium">
                <span className="hidden md:inline">• </span>
                {apt.service?.title || 'General Service'}
              </p>
            </div>
          </div>
        </div>

        {/* ROW 2: ACTIONS */}
        <div className="flex items-center pt-6 border-t border-zinc-100 dark:border-zinc-900/30">
          <BookingActions appointmentId={apt.id} currentStatus={apt.status} />
        </div>
      </div>
    </div>
  )
}
