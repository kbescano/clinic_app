import Link from 'next/link'
import FadeIn from '@/components/shared/FadeIn'
import BackToHome from '@/components/shared/BackToHome'
import { clinicPath, isClinicSlug } from '@/lib/clinics'

type Props = {
  params: Promise<{ clinic: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ConfirmationPage({ params, searchParams }: Props) {
  const resolvedSearchParams = await searchParams
  const { clinic } = await params
  const href = (path: string) => (isClinicSlug(clinic) ? clinicPath(clinic, path) : path)

  const date =
    typeof resolvedSearchParams.date === 'string' ? resolvedSearchParams.date : 'Pending Date'
  const time =
    typeof resolvedSearchParams.time === 'string' ? resolvedSearchParams.time : 'Pending Time'
  const fn = typeof resolvedSearchParams.fn === 'string' ? resolvedSearchParams.fn : 'Valued'
  const sn = typeof resolvedSearchParams.sn === 'string' ? resolvedSearchParams.sn : 'Patient'
  const service =
    typeof resolvedSearchParams.service === 'string'
      ? resolvedSearchParams.service
      : 'Clinical Treatment'
  const email = typeof resolvedSearchParams.email === 'string' ? resolvedSearchParams.email : ''
  const ph = typeof resolvedSearchParams.ph === 'string' ? resolvedSearchParams.ph : ''

  const rawGuests = resolvedSearchParams.guests
  const guestsList = Array.isArray(rawGuests)
    ? rawGuests
    : typeof rawGuests === 'string'
      ? [rawGuests]
      : []

  const last4Digits = ph.length >= 4 ? ph.slice(-4) : '****'

  return (
    // UPDATED: Added pt-24 md:pt-32 for navbar clearance and changed to min-h-screen
    <div className="min-h-screen bg-white dark:bg-[#050505] text-zinc-950 dark:text-zinc-100 flex items-start justify-center pt-24 md:pt-32 pb-24 p-4 md:p-8 font-sans selection:bg-zinc-100 overflow-x-hidden">
      <BackToHome />
      <FadeIn>
        <div className="max-w-[360px] md:max-w-sm w-full mx-auto relative flex flex-col gap-5 md:gap-6">
          {/* TICKET CONTAINER */}
          <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-300 dark:border-zinc-800 shadow-2xl rounded-none overflow-hidden relative z-10">
            {/* TICKET HEADER */}
            <div className="bg-zinc-950 dark:bg-white p-8 text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full border border-white/20 dark:border-zinc-950/20 flex items-center justify-center mb-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-white dark:text-zinc-950"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white dark:text-zinc-950 leading-none tracking-tighter mb-2.5">
                Session Confirmed
              </h1>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60 dark:text-zinc-950/60">
                Digital Itinerary
              </p>
            </div>

            {/* TICKET BODY */}
            <div className="p-6 md:p-8 space-y-6 bg-white dark:bg-[#050505]">
              {/* DATE & TIME GRID */}
              <div className="flex justify-between items-center pb-6 border-b border-dashed border-zinc-300 dark:border-zinc-800">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-1.5">
                    Date
                  </p>
                  <p className="text-base tracking-tight text-zinc-950 dark:text-zinc-100">
                    {date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-1.5">
                    Time
                  </p>
                  <p className="text-base tracking-tight text-zinc-950 dark:text-zinc-100 tabular-nums">
                    {time}
                  </p>
                </div>
              </div>

              {/* PATIENT & TREATMENT */}
              <div className="space-y-5 pb-6 border-b border-dashed border-zinc-300 dark:border-zinc-800">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-1.5">
                    Primary Patient
                  </p>
                  <p className="text-base capitalize tracking-tight text-zinc-950 dark:text-zinc-100 leading-none">
                    {fn} {sn}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-1.5">
                    Treatment
                  </p>
                  <p className="text-sm text-zinc-950 dark:text-zinc-100 leading-snug">
                    {service}
                  </p>
                </div>

                {/* GUEST DETAILS */}
                {guestsList.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2.5">
                      Guest
                    </p>
                    <div className="space-y-2">
                      {guestsList.map((guestString, index) => (
                        <p
                          key={index}
                          className="text-sm capitalize text-zinc-950 dark:text-zinc-100 leading-snug"
                        >
                          {guestString}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ACCOUNT ACCESS & PRE-ARRIVAL */}
              <div className="space-y-4">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-none border border-zinc-300 dark:border-zinc-800/50">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-950 dark:text-zinc-300 mb-2.5">
                    Client Portal Access
                  </p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Your account is now active. To manage future sessions, log in using{' '}
                    <strong className="font-medium text-zinc-950 dark:text-zinc-300">
                      {email || 'your email'}
                    </strong>{' '}
                    and the last 4 digits of your mobile (
                    <strong className="font-medium text-zinc-950 dark:text-zinc-300">
                      {last4Digits}
                    </strong>
                    ) as your password.
                  </p>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-none border border-zinc-300 dark:border-zinc-800/50">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2.5">
                    Pre-Arrival Note
                  </p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Please arrive 10 minutes prior to your scheduled time. If you need to manage or
                    modify your session, kindly access your records via the portal.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="space-y-3">
            <Link
              href={`${href('/appointments')}?email=${email}&ph=${ph}`}
              className="block w-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs md:text-xs py-6 rounded-none uppercase tracking-[0.2em] text-center transition-all hover:opacity-90 active:scale-[0.98] shadow-xl"
            >
              View Upcoming Schedule
            </Link>
            <Link
              href={href('/')}
              className="block w-full bg-transparent border border-zinc-300 dark:border-zinc-800 text-zinc-950 dark:text-white text-xs md:text-xs py-6 rounded-none uppercase tracking-[0.2em] text-center transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-[0.98]"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
