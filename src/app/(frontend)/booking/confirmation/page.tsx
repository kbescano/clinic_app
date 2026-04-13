import Link from 'next/link'
import FadeIn from '../../components/FadeIn'

export default function ConfirmationPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  // Extracting potential data passed from the booking redirect
  const date = typeof searchParams?.date === 'string' ? searchParams.date : 'Pending Date'
  const time = typeof searchParams?.time === 'string' ? searchParams.time : 'Pending Time'
  const fn = typeof searchParams?.fn === 'string' ? searchParams.fn : 'Valued'
  const sn = typeof searchParams?.sn === 'string' ? searchParams.sn : 'Patient'
  const service =
    typeof searchParams?.service === 'string' ? searchParams.service : 'Clinical Treatment'

  // Safely capture multiple guests as an array
  const rawGuests = searchParams?.guests
  const guestsList = Array.isArray(rawGuests)
    ? rawGuests
    : typeof rawGuests === 'string'
      ? [rawGuests]
      : []

  return (
    <div className="min-h-[80vh] bg-white dark:bg-[#050505] text-[#251101] dark:text-zinc-100 flex items-center justify-center p-4 md:p-8 font-sans selection:bg-zinc-100">
      <FadeIn>
        <div className="max-w-[360px] max-h-[300px] md:max-w-sm w-full mx-auto relative mt-10 md:mt-0">
          {/* TICKET CONTAINER */}
          <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-100 dark:border-zinc-900 shadow-2xl rounded-2xl overflow-hidden relative z-10">
            {/* TICKET HEADER */}
            <div className="bg-[#251101] dark:bg-white p-8 text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full border border-white/20 dark:border-[#251101]/20 flex items-center justify-center mb-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-white dark:text-[#251101]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h1 className="text-[24px] md:text-[26px] font-light font-serif text-white dark:text-[#251101] leading-none tracking-tight mb-2.5">
                Session Confirmed
              </h1>
              <p className="text-[8px] uppercase tracking-[0.4em] text-white/60 dark:text-[#251101]/60 font-serif">
                Digital Itinerary
              </p>
            </div>

            {/* TICKET BODY */}
            <div className="p-6 md:p-8 space-y-6 bg-white dark:bg-[#050505]">
              {/* DATE & TIME GRID */}
              <div className="flex justify-between items-center pb-6 border-b border-dashed border-zinc-200 dark:border-zinc-800">
                <div>
                  <p className="text-[7px] uppercase tracking-[0.4em] text-[#595f72] font-serif mb-1.5">
                    Date
                  </p>
                  <p className="text-[15px] font-serif tracking-tight text-[#251101] dark:text-zinc-100">
                    {date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[7px] uppercase tracking-[0.4em] text-[#595f72] font-serif mb-1.5">
                    Time
                  </p>
                  <p className="text-[15px] font-serif tracking-tight text-[#251101] dark:text-zinc-100 tabular-nums">
                    {time}
                  </p>
                </div>
              </div>

              {/* PATIENT & TREATMENT */}
              <div className="space-y-5 pb-6 border-b border-dashed border-zinc-200 dark:border-zinc-800">
                <div>
                  <p className="text-[7px] uppercase tracking-[0.4em] text-[#595f72] font-serif mb-1.5">
                    Primary Patient
                  </p>
                  <p className="text-[16px] font-serif capitalize tracking-tight text-[#251101] dark:text-zinc-100 leading-none">
                    {fn} {sn}
                  </p>
                </div>
                <div>
                  <p className="text-[7px] uppercase tracking-[0.4em] text-[#595f72] font-serif mb-1.5">
                    Treatment
                  </p>
                  <p className="text-[13px] font-serif text-[#251101] dark:text-zinc-100 leading-snug">
                    {service}
                  </p>
                </div>

                {/* GUEST DETAILS */}
                {guestsList.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[7px] uppercase tracking-[0.4em] text-[#595f72] font-serif mb-2.5">
                      Guest
                    </p>
                    <div className="space-y-2">
                      {guestsList.map((guestString, index) => (
                        <p
                          key={index}
                          className="text-[12px] font-serif capitalize text-[#251101] dark:text-zinc-100 leading-snug"
                        >
                          {guestString}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PRE-ARRIVAL INSTRUCTIONS */}
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                <p className="text-[8px] uppercase tracking-[0.3em] text-[#595f72] font-serif mb-2.5">
                  Pre-Arrival Note
                </p>
                <p className="text-[10px] font-serif text-[#595f72] leading-relaxed italic">
                  Please arrive 10 minutes prior to your scheduled time. If you need to manage or
                  modify your session, kindly access your records using the email address provided
                  during booking.
                </p>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-5 md:mt-6 space-y-3">
            <Link
              href={`/appointments?email=${searchParams?.email || ''}&ph=${searchParams?.ph || ''}`}
              className="block w-full bg-[#251101] dark:bg-white text-white dark:text-[#251101] text-[8px] md:text-[9px] py-6 rounded-full uppercase tracking-[0.4em] text-center transition-all hover:opacity-90 active:scale-[0.98] shadow-xl font-serif"
            >
              View Upcoming Schedule
            </Link>
            <Link
              href="/"
              className="block w-full bg-transparent border border-zinc-200 dark:border-zinc-800 text-[#251101] dark:text-white text-[8px] md:text-[9px] py-6 rounded-full uppercase tracking-[0.4em] text-center transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-[0.98] font-serif"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
