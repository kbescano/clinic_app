'use client'

import React, { useActionState, useState, useEffect, Suspense, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createBookingAction, getBusySlots, getCustomerByEmail } from './actions'
import { Service } from '@/payload-types'
import FadeIn from '../components/FadeIn'
import { TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface BookingEntry {
  serviceId: string
  firstName: string
  surname: string
  email: string
  phone: string
  date: string
  time: string
}

// --- VALIDATION HELPERS ---
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const isValidPHPhone = (phone: string) => {
  const cleanPhone = phone.replace(/\s/g, '')
  return /^(09|\+639)\d{9}$/.test(cleanPhone)
}

export default function BookingForm({ services }: { services: Service[] }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-zinc-400 text-[9px] uppercase tracking-[0.4em]">
            Loading...
          </div>
        </div>
      }
    >
      <BookingFormContent services={services} />
    </Suspense>
  )
}

function BookingFormContent({ services }: { services: Service[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [showModal, setShowModal] = useState(() => searchParams.get('prefill') !== 'true')
  const [existingEmail, setExistingEmail] = useState(searchParams.get('email') || '')
  const [isExisting, setIsExisting] = useState<boolean | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const [isPendingTransition, startTransition] = useTransition()
  const [state, formAction] = useActionState(createBookingAction, null)

  const [bookings, setBookings] = useState<BookingEntry[]>([])

  const [personalInfo, setPersonalInfo] = useState({
    firstName: searchParams.get('fn') || '',
    surname: searchParams.get('sn') || '',
    phone: searchParams.get('ph') || '',
    email: searchParams.get('email') || '',
  })

  const [currentServiceId, setCurrentServiceId] = useState('')
  const [extraServiceId, setExtraServiceId] = useState('')
  const [showExtraService, setShowExtraService] = useState(false)
  const [currentDate, setCurrentDate] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const [busySlots, setBusySlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const timeSlots = [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
  ]

  // --- NEW: CLEAR SESSION LOGIC ---
  const handleClearSession = () => {
    if (confirm('Clear all selections and guest lists?')) {
      setBookings([])
      setCurrentServiceId('')
      setExtraServiceId('')
      setShowExtraService(false)
      setCurrentDate('')
      setCurrentTime('')
      setLocalError(null)
    }
  }

  useEffect(() => {
    const isPrefill = searchParams.get('prefill') === 'true'
    const email = searchParams.get('email')

    if (isPrefill && email) {
      setShowModal(false)
      const loadUser = async () => {
        try {
          const data = (await getCustomerByEmail(email)) as any
          if (data) {
            setPersonalInfo({
              firstName: data.firstName || searchParams.get('fn') || '',
              surname: data.surname || searchParams.get('sn') || '',
              phone: data.phone || searchParams.get('ph') || '',
              email: email,
            })
            setCurrentDate('')
            setCurrentTime('')
          }
        } catch (err) {
          console.error('Silent prefill failed', err)
        }
      }
      loadUser()
    }
  }, [searchParams])

  useEffect(() => {
    const idFromUrl = searchParams.get('serviceId')
    if (idFromUrl && services.length > 0) setCurrentServiceId(String(idFromUrl))
  }, [searchParams, services])

  useEffect(() => {
    async function updateAvailability() {
      if (currentDate) {
        setLoadingSlots(true)
        const taken = await getBusySlots(currentDate)
        setBusySlots(taken)
        setLoadingSlots(false)
      }
    }
    updateAvailability()
  }, [currentDate])

  const handleLookup = async () => {
    if (!isValidEmail(existingEmail)) {
      setModalError('Invalid email format.')
      return
    }
    setIsVerifying(true)
    setModalError(null)
    try {
      const data = (await getCustomerByEmail(existingEmail)) as any
      if (data && data.appointments?.length > 0) {
        const params = new URLSearchParams({
          fn: data.firstName || '',
          email: existingEmail,
          sn: data.surname || '',
          ph: data.phone || '',
          apts: JSON.stringify(data.appointments),
        })
        router.push(`/booking/status?${params.toString()}`)
      } else if (data) {
        setPersonalInfo({
          firstName: data.firstName || '',
          surname: data.surname || '',
          phone: data.phone || '',
          email: existingEmail,
        })
        setCurrentDate('')
        setCurrentTime('')
        setShowModal(false)
      } else {
        setModalError('No record found. Please continue as a new customer.')
      }
    } catch {
      setModalError('Error connecting to server.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleAddPerson = () => {
    setLocalError(null)
    if (!currentServiceId || !currentDate || !currentTime) {
      setLocalError('Complete current booking first.')
      return
    }
    if (!isValidEmail(personalInfo.email)) {
      setLocalError('Invalid email format.')
      return
    }
    if (!isValidPHPhone(personalInfo.phone)) {
      setLocalError('Invalid PH phone number (09XXXXXXXXX).')
      return
    }

    const primaryBooking: BookingEntry = {
      ...personalInfo,
      serviceId: currentServiceId,
      date: currentDate,
      time: currentTime,
    }
    const newBatch = [primaryBooking]
    if (showExtraService && extraServiceId)
      newBatch.push({ ...primaryBooking, serviceId: extraServiceId })

    setBookings([...bookings, ...newBatch])
    setPersonalInfo({ ...personalInfo, firstName: '', surname: '', phone: '' })
    setCurrentServiceId('')
    setExtraServiceId('')
    setShowExtraService(false)
    setCurrentDate('')
    setCurrentTime('')
  }

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!isValidEmail(personalInfo.email)) {
      setLocalError('Invalid email format.')
      return
    }
    if (!isValidPHPhone(personalInfo.phone)) {
      setLocalError('Invalid PH phone format.')
      return
    }

    const currentEntries: BookingEntry[] = [
      { ...personalInfo, serviceId: currentServiceId, date: currentDate, time: currentTime },
    ]
    if (showExtraService && extraServiceId)
      currentEntries.push({ ...currentEntries[0], serviceId: extraServiceId })

    const finalData = new FormData()
    startTransition(() => {
      ;[...bookings, ...currentEntries].forEach((b) => {
        finalData.append('serviceId', b.serviceId)
        finalData.append('firstName', b.firstName)
        finalData.append('surname', b.surname)
        finalData.append('email', b.email)
        finalData.append('phone', b.phone)
        const localDateTime = new Date(`${b.date}T${b.time}:00`)
        finalData.append('appointmentDate', localDateTime.toISOString())
      })
      formAction(finalData)
    })
  }

  const todayStr = new Date().toLocaleDateString('en-CA')
  const nowStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const getServiceTitle = (id: string) =>
    services.find((s) => String(s.id) === id)?.title || 'Service'

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-black dark:text-white">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 p-10 border border-zinc-100 dark:border-zinc-900 rounded-[2.5rem] shadow-2xl">
            {isExisting === null ? (
              <div className="space-y-6 text-center">
                <h3 className="text-2xl font-light">Visited us before?</h3>
                <div className="flex flex-col gap-3 pt-4">
                  <button
                    onClick={() => setIsExisting(true)}
                    className="w-full py-5 bg-black dark:bg-white text-white dark:text-black text-[8px] font-bold uppercase tracking-[0.3em] rounded-full active:scale-[0.98] transition-all"
                  >
                    Yes, I&apos;m a current customer.
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full py-5 border border-zinc-200 dark:border-zinc-800 text-[8px] font-bold uppercase tracking-[0.3em] rounded-full dark:text-white transition-all active:scale-[0.98]"
                  >
                    No, I am new customer.
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 text-center">
                <h3 className="text-2xl font-light">Confirm Email</h3>
                {modalError && (
                  <p className="text-[10px] text-red-500 font-bold border-l-2 border-red-500 pl-3 text-left">
                    {modalError}
                  </p>
                )}
                <input
                  type="email"
                  value={existingEmail}
                  onChange={(e) => {
                    setExistingEmail(e.target.value)
                    setModalError(null)
                  }}
                  className="w-full bg-transparent border-b border-zinc-100 dark:border-zinc-800 outline-none py-4 text-sm text-center"
                  placeholder="email@example.com"
                  autoFocus
                />
                <button
                  onClick={handleLookup}
                  disabled={isVerifying}
                  className="w-full py-5 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-[0.3em] rounded-full transition-all"
                >
                  {isVerifying ? 'Searching...' : 'Check Schedule'}
                </button>
                <button
                  onClick={() => setIsExisting(null)}
                  className="w-full text-[9px] uppercase tracking-[0.4em] text-zinc-400 py-4"
                >
                  Go Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <FadeIn>
        <div className="flex items-start justify-center min-h-screen bg-white dark:bg-black md:pt-24 pb-20 text-black dark:text-white px-6">
          <div className="w-full max-w-[700px]">
            <div className="flex items-center justify-between mb-10">
              {searchParams.get('prefill') === 'true' ? (
                <button
                  onClick={() => {
                    setShowModal(true)
                    setPersonalInfo({ firstName: '', surname: '', phone: '', email: '' })
                  }}
                  className="text-[8px] uppercase tracking-[0.4em] text-zinc-300 dark:text-white hover:text-black dark:hover:text-white transition-colors"
                >
                  &larr; Switch User
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={handleClearSession}
                className="flex items-center gap-2 text-[8px] uppercase tracking-[0.4em] text-zinc-300 hover:text-red-500 transition-colors"
              >
                <ArrowPathIcon className="w-3 h-3" />
                Clear Session
              </button>
            </div>

            <header className="mb-10 text-left">
              <p className="text-[10px] uppercase tracking-[0.8em] text-zinc-400 font-medium mb-6 uppercase">
                {bookings.length > 0 ? 'Guest Session' : 'Appointment'}
              </p>
              <h1 className="text-4xl md:text-4xl font-light tracking-tight leading-tight uppercase dark:text-white">
                {bookings.length > 0 ? 'Adding Another' : 'New Visit'}
              </h1>
            </header>

            <form onSubmit={handleFinalSubmit} className="space-y-12">
              {(state?.error || localError) && (
                <div className="text-[10px] uppercase text-red-500 border-l-2 border-red-500 pl-4 py-1">
                  {state?.error || localError}
                </div>
              )}

              <div className="flex flex-col gap-y-12">
                <div className="group border-b border-zinc-100 dark:border-zinc-900 pb-2">
                  <label className="block text-[8px] font-bold uppercase tracking-[0.4em] text-zinc-400 mb-3">
                    Service
                  </label>
                  <select
                    required
                    value={currentServiceId}
                    onChange={(e) => setCurrentServiceId(e.target.value)}
                    className="w-full bg-transparent text-[15px] outline-none py-1 appearance-none cursor-pointer"
                  >
                    <option value="">Select Service...</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                  {!showExtraService && (
                    <button
                      type="button"
                      onClick={() => setShowExtraService(true)}
                      className="mt-4 text-[7px] uppercase tracking-widest text-zinc-400 hover:text-black transition-colors font-bold"
                    >
                      + Add second service
                    </button>
                  )}
                </div>

                {showExtraService && (
                  <div className="group border-b border-zinc-100 dark:border-zinc-900 pb-2 animate-in fade-in slide-in-from-top-1">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[8px] font-bold uppercase tracking-[0.4em] text-zinc-400">
                        Additional Treatment
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowExtraService(false)
                          setExtraServiceId('')
                        }}
                        className="text-[7px] text-red-400 uppercase tracking-widest font-bold"
                      >
                        Remove
                      </button>
                    </div>
                    <select
                      value={extraServiceId}
                      onChange={(e) => setExtraServiceId(e.target.value)}
                      className="w-full bg-transparent text-[15px] outline-none py-1 appearance-none cursor-pointer"
                    >
                      <option value="">Select Service...</option>
                      {services.map((s) => (
                        <option
                          key={s.id}
                          value={s.id}
                          disabled={String(s.id) === currentServiceId}
                        >
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Field
                  label="First Name"
                  value={personalInfo.firstName}
                  onChange={(v) => setPersonalInfo({ ...personalInfo, firstName: v })}
                  placeholder="Juan"
                />
                <Field
                  label="Surname"
                  value={personalInfo.surname}
                  onChange={(v) => setPersonalInfo({ ...personalInfo, surname: v })}
                  placeholder="Dela Cruz"
                />
                <Field
                  label="Phone"
                  value={personalInfo.phone}
                  onChange={(v) => setPersonalInfo({ ...personalInfo, phone: v })}
                  placeholder="0917 123 4567"
                />
                <Field
                  label="Email"
                  value={personalInfo.email}
                  onChange={(v) => setPersonalInfo({ ...personalInfo, email: v })}
                  placeholder="hello@example.com"
                />

                <div className="group border-b border-zinc-100 dark:border-zinc-900 pb-2">
                  <label className="block text-[8px] font-bold uppercase tracking-[0.4em] text-zinc-400 mb-3">
                    Date
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    required
                    value={currentDate}
                    onChange={(e) => {
                      setCurrentDate(e.target.value)
                      setCurrentTime('')
                    }}
                    className="w-full bg-transparent text-[15px] outline-none py-1 dark:invert"
                  />
                </div>

                <div className="group border-b border-zinc-100 dark:border-zinc-900 pb-2">
                  <label className="block text-[8px] font-bold uppercase tracking-[0.4em] text-zinc-400 mb-3">
                    Time Slot
                  </label>
                  <select
                    required
                    value={currentTime}
                    onChange={(e) => setCurrentTime(e.target.value)}
                    disabled={!currentDate || loadingSlots}
                    className="w-full bg-transparent text-[15px] outline-none py-1 appearance-none cursor-pointer"
                  >
                    <option value="">{loadingSlots ? 'Refreshing...' : 'Select Slot'}</option>
                    {timeSlots.map((slot) => {
                      const isPast = currentDate === todayStr && slot <= nowStr
                      const isBusyInDB = busySlots.includes(slot)
                      const isBusyInSession = bookings.some(
                        (b) => b.date === currentDate && b.time === slot,
                      )
                      const isFull = isPast || isBusyInDB || isBusyInSession
                      return (
                        <option key={slot} value={slot} disabled={isFull}>
                          {slot} {isFull ? '— Fully booked' : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>

                {bookings.length < 1 && (
                  <button
                    type="button"
                    onClick={handleAddPerson}
                    className="w-full py-7 border border-dashed border-zinc-100 dark:border-zinc-900 text-[8px] uppercase tracking-[0.5em] text-zinc-400 hover:text-black dark:hover:text-white rounded-[2rem] transition-all font-bold"
                  >
                    + Add Guest
                  </button>
                )}

                {(bookings.length > 0 || currentTime) && (
                  <div className="pt-20 border-t border-zinc-100 dark:border-zinc-900 space-y-16">
                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4">
                      <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-zinc-400">
                        Booking Summary
                      </p>
                    </div>

                    <div className="space-y-10">
                      {bookings.map((b, i) => (
                        <div
                          key={i}
                          className="flex flex-row items-center justify-between group gap-4"
                        >
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 truncate">
                              {getServiceTitle(b.serviceId)}
                            </span>
                            <span className="text-xl md:text-2xl font-light tracking-tight truncate">
                              {b.firstName} {b.surname}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 md:gap-8 shrink-0">
                            <span className="text-[10px] md:text-[11px] text-zinc-400 uppercase tracking-[0.3em] font-medium whitespace-nowrap">
                              {b.date} @ {b.time}
                            </span>
                            <button
                              type="button"
                              onClick={() => setBookings(bookings.filter((_, idx) => idx !== i))}
                              className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {currentTime && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-row items-center justify-between p-6 md:p-14 border border-zinc-100 dark:border-zinc-900 rounded-[2.5rem] md:rounded-[3.5rem] bg-zinc-50/30 dark:bg-white/[0.02] gap-4">
                        <div className="flex flex-col gap-4 text-left min-w-0">
                          <span className="text-xl md:text-4xl font-light tracking-tight truncate">
                            {personalInfo.firstName || 'Patient'} {personalInfo.surname}
                          </span>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 md:gap-3">
                              <span className="w-1 h-1 md:w-1.5 md:h-1.5 shrink-0 bg-blue-600 rounded-full animate-pulse"></span>
                              <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] dark:text-zinc-200 truncate">
                                {getServiceTitle(currentServiceId)}
                              </span>
                            </div>
                            {showExtraService && extraServiceId && (
                              <div className="flex items-center gap-2 md:gap-3">
                                <span className="w-1 h-1 md:w-1.5 md:h-1.5 shrink-0 bg-blue-600 rounded-full"></span>
                                <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] dark:text-zinc-200 truncate">
                                  {getServiceTitle(extraServiceId)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end shrink-0">
                          <p className="text-[32px] md:text-[64px] font-extralight dark:text-white tracking-tighter leading-none">
                            {currentTime}
                          </p>
                          <p className="text-[8px] md:text-[10px] text-zinc-400 uppercase tracking-[0.3em] md:tracking-[0.5em] mt-2 md:mt-4 font-medium whitespace-nowrap">
                            {currentDate}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="max-w-[500px] mx-auto pt-10">
                <button
                  type="submit"
                  disabled={isPendingTransition || !currentTime}
                  className="w-full bg-black dark:bg-white text-white dark:text-black text-[11px] font-bold py-7 rounded-full uppercase tracking-[0.4em] disabled:opacity-30 transition-all active:scale-[0.98] shadow-sm"
                >
                  {isPendingTransition ? 'Processing...' : 'Confirm Appointment(s)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </FadeIn>
    </>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="group border-b border-zinc-100 dark:border-zinc-900 pb-2 relative transition-all focus-within:border-black dark:focus-within:border-white">
      <label className="block text-[8px] font-bold uppercase tracking-[0.4em] text-zinc-400 mb-3">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full bg-transparent text-[15px] outline-none py-1 placeholder-zinc-200 dark:placeholder-zinc-800"
      />
    </div>
  )
}
