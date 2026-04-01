import Link from 'next/link'
import FadeIn from '../../components/FadeIn'

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F8] dark:bg-[#09090b] flex items-center justify-center p-6 selection:bg-blue-100">
      <FadeIn>
        <div className="max-w-md w-full bg-white/80 dark:bg-[#121212]/60 p-10 md:p-12 rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-white dark:border-zinc-800/30 text-center backdrop-blur-sm">
          {/* SUCCESS INDICATOR */}
          <div className="w-20 h-20 bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-100/50 dark:border-emerald-800/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>

          {/* STANDARDIZED HEADER PATTERN */}
          <div className="space-y-2 mb-10">
            <h1 className="text-3xl font-light font-serif text-zinc-800 dark:text-white leading-tight">
              Appointment <br /> Confirmed!
            </h1>
          </div>

          <p className="text-[13px] font-light font-serif text-zinc-500 dark:text-zinc-400 leading-relaxed mb-12 px-2">
            Your clinic visit has been successfully scheduled. We look forward to seeing you soon.
          </p>

          <div className="space-y-6">
            <Link
              href="/"
              className="block w-full bg-[#18181b] dark:bg-white text-white dark:text-[#09090b] text-[11px] font-medium py-6 rounded-full uppercase tracking-[0.2em] transition-all hover:opacity-90 active:scale-[0.98] shadow-lg font-serif"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
