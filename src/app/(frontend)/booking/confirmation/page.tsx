import Link from 'next/link'

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Appointment Confirmed!</h1>
        <p className="text-slate-500 mb-8">
          Your clinic visit has been successfully scheduled. We look forward to seeing you!
        </p>
        <Link
          href="/"
          className="block w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
