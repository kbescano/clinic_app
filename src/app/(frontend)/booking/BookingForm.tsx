'use client'

import React, { useActionState, useState, useEffect, Suspense, useTransition, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createBookingAction, getBusySlots, getCustomerByEmail } from './actions'
import { Service } from '@/payload-types'
import FadeIn from '../components/FadeIn'
import Notification from '../components/Notification'
import { ArrowPathIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline'
import BackToHome from '../components/BackToHome'
import dayjs from '@/lib/dayjs'
import { RegistrySkeleton } from '../components/RegistrySkeleton'

interface BookingEntry {
  serviceId: string
  firstName: string
  surname: string
  email: string
  phone: string
  date: string
  time: string
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const isValidPHPhone = (phone: string) => {
  const cleanPhone = phone.replace(/[\s\-()]/g, '')
  return /^(09|\+639|639)\d{9}$/.test(cleanPhone)
}

export default function BookingForm({
  services,
  initialData,
}: {
  services: Service[]
  initialData: { email: string; fn: string; sn: string; ph: string }
}) {
  return (
    <Suspense fallback={<RegistrySkeleton />}>
      <BookingFormContent services={services} initialData={initialData} />
    </Suspense>
  )
}

function BookingFormContent({
  services,
  initialData,
}: {
  services: Service[]
  initialData: { email: string; fn: string; sn: string; ph: string }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // --- 1. INSTANT INITIALIZATION (Bypasses useSearchParams lag) ---
  const hasPrefillData = !!(initialData.email && initialData.fn)

  const [showModal, setShowModal] = useState(!hasPrefillData)
  const [existingEmail, setExistingEmail] = useState(initialData.email)
  const [personalInfo, setPersonalInfo] = useState({
    firstName: initialData.fn,
    surname: initialData.sn,
    phone: initialData.ph,
    email: initialData.email,
  })

  // --- 2. CORE STATE ---
  const [isExisting, setIsExisting] = useState<boolean | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [errorToast, setErrorToast] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [isPendingTransition, startTransition] = useTransition()
  const [state, formAction] = useActionState(createBookingAction, null)
  const [bookings, setBookings] = useState<BookingEntry[]>([])
  const [drawLine, setDrawLine] = useState(false)

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

  const { todayStr, manilaTimeNow, minSelectableDate } = useMemo(() => {
    const nowPHT = dayjs().tz('Asia/Manila')
    const isAfterCutoff = nowPHT.hour() >= 15
    return {
      todayStr: nowPHT.format('YYYY-MM-DD'),
      manilaTimeNow: nowPHT.format('HH:mm'),
      minSelectableDate: isAfterCutoff
        ? nowPHT.add(1, 'day').format('YYYY-MM-DD')
        : nowPHT.format('YYYY-MM-DD'),
    }
  }, [])

  const activeDate = bookings.length > 0 ? bookings[0].date : currentDate

  // --- 3. EFFECTS ---
  useEffect(() => {
    if (state?.error) setErrorToast(state.error)
  }, [state])

  // Trigger DrawLine immediately for prefilled users
  useEffect(() => {
    if (!showModal || hasPrefillData) {
      setDrawLine(true)
    } else {
      setDrawLine(false)
    }
  }, [showModal, hasPrefillData])

  useEffect(() => {
    async function updateAvailability() {
      if (activeDate) {
        setLoadingSlots(true)
        const taken = await getBusySlots(activeDate)
        setBusySlots(taken)
        setLoadingSlots(false)
      }
    }
    updateAvailability()
  }, [activeDate])

  // Handles dynamic URL changes (Back button, etc.)
  useEffect(() => {
    const email = searchParams.get('email') || ''
    const fn = searchParams.get('fn') || ''
    if (email && fn && (email !== personalInfo.email || fn !== personalInfo.firstName)) {
      setPersonalInfo({
        firstName: fn,
        surname: searchParams.get('sn') || '',
        phone: searchParams.get('ph') || '',
        email: email,
      })
      setExistingEmail(email)
      setShowModal(false)
    }
  }, [searchParams, personalInfo.email, personalInfo.firstName])

  // --- 4. HANDLERS ---
  const handleLookup = async () => {
    if (!isValidEmail(existingEmail)) {
      setModalError('Invalid email format.')
      return
    }

    setIsVerifying(true)
    setModalError(null)

    try {
      const normalizedEmail = existingEmail.trim().toLowerCase()
      const data = (await getCustomerByEmail(normalizedEmail)) as any

      if (!data) {
        setModalError('No record found with this email.')
        setIsVerifying(false)
        return
      }

      if (data.appointments && data.appointments.length > 0) {
        const simplifiedApts = data.appointments.map((apt: any) => ({
          date: apt.date || apt.appointmentDate,
          service: typeof apt.service === 'object' ? apt.service.title : apt.service,
          firstName: apt.firstName,
          surname: apt.surname,
          isGuest: apt.isGuest,
        }))

        const statusParams = new URLSearchParams({
          fn: data.firstName || '',
          sn: data.surname || '',
          email: normalizedEmail,
          ph: data.phone || '',
          apts: JSON.stringify(simplifiedApts),
        })

        startTransition(() => {
          setShowModal(false)
          router.push(`/booking/status?${statusParams.toString()}`)
        })
        return
      }

      const bookingParams = new URLSearchParams({
        fn: data.firstName || '',
        sn: data.surname || '',
        email: normalizedEmail,
        ph: data.phone || '',
      })

      startTransition(() => {
        setShowModal(false)
        router.replace(`/booking?${bookingParams.toString()}`)
      })
    } catch (err) {
      console.error('Lookup Error:', err)
      setModalError('Server error. Please try again.')
      setIsVerifying(false)
    }
  }

  useEffect(() => {
    router.prefetch('/booking/status')
  }, [])

  const handleAddPerson = () => {
    setErrorToast(null)
    if (
      !personalInfo.firstName ||
      !personalInfo.surname ||
      !currentServiceId ||
      !activeDate ||
      !currentTime
    ) {
      setErrorToast('Complete Name, Service, and Time.')
      return
    }
    if (!isValidEmail(personalInfo.email)) {
      setErrorToast('Invalid email.')
      return
    }
    if (!isValidPHPhone(personalInfo.phone)) {
      setErrorToast('Invalid PH phone format.')
      return
    }

    const entry: BookingEntry = {
      ...personalInfo,
      serviceId: currentServiceId,
      date: activeDate,
      time: currentTime,
    }
    const batch = [entry]
    if (showExtraService && extraServiceId) batch.push({ ...entry, serviceId: extraServiceId })
    setBookings([...bookings, ...batch])
    setPersonalInfo((prev) => ({ ...prev, firstName: '', surname: '' }))
    setCurrentServiceId('')
    setExtraServiceId('')
    setShowExtraService(false)
    setCurrentTime('')
  }

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorToast(null)
    const finalEntries = [...bookings]
    if (personalInfo.firstName && currentTime) {
      if (!isValidEmail(personalInfo.email)) {
        setErrorToast('Valid email required.')
        return
      }
      if (!isValidPHPhone(personalInfo.phone)) {
        setErrorToast('Valid PH phone required.')
        return
      }
      const currentPerson = {
        ...personalInfo,
        serviceId: currentServiceId,
        date: activeDate,
        time: currentTime,
      }
      finalEntries.push(currentPerson)
      if (showExtraService && extraServiceId)
        finalEntries.push({ ...currentPerson, serviceId: extraServiceId })
    }
    if (finalEntries.length === 0) {
      setErrorToast('Add at least one appointment.')
      return
    }

    const finalData = new FormData()
    startTransition(() => {
      finalEntries.forEach((b) => {
        finalData.append('firstName', b.firstName)
        finalData.append('surname', b.surname)
        finalData.append('email', b.email)
        finalData.append('phone', b.phone)
        finalData.append('serviceId', b.serviceId)
        finalData.append('appointmentDate', `${b.date}T${b.time}:00`)
      })
      formAction(finalData)
    })
  }

  const handleClearSession = () => {
    if (confirm('Clear all selections?')) {
      setBookings([])
      setCurrentServiceId('')
      setExtraServiceId('')
      setShowExtraService(false)
      setCurrentDate('')
      setCurrentTime('')
      setErrorToast(null)
      setPersonalInfo({ firstName: '', surname: '', phone: '', email: '' })
      setIsExisting(null)
      setShowModal(true)
      router.replace('/booking')
    }
  }

  const getServiceTitle = (id: string) =>
    services.find((s) => String(s.id) === id)?.title || 'Service'

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-[#251101] dark:text-zinc-100 pt-24 md:pt-32 pb-32 selection:bg-zinc-100 overflow-x-hidden">
      {errorToast && (
        <Notification message={errorToast} type="error" onClose={() => setErrorToast(null)} />
      )}

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-white dark:bg-black p-10 md:p-14 border border-zinc-50 dark:border-zinc-900 shadow-2xl text-center">
            {isExisting === null ? (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <h3 className="text-[20px] md:text-[22px] font-light mb-12 font-serif uppercase tracking-tight">
                  Visited us before?
                </h3>
                <div className="space-y-4">
                  <button
                    onClick={() => setIsExisting(true)}
                    className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-black text-[8px] font-medium uppercase tracking-[0.4em] font-serif transition-all hover:bg-zinc-800 dark:hover:bg-zinc-100"
                  >
                    Yes, I&apos;m a current customer
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full py-5 border border-zinc-100 dark:border-zinc-900 text-[#595f72] text-[8px] font-medium uppercase tracking-[0.4em] font-serif transition-all hover:text-[#251101] dark:hover:text-white"
                  >
                    No, I am new customer
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-[18px] md:text-[20px] font-light mb-4 font-serif uppercase tracking-tight">
                  Confirm Email
                </h3>
                {modalError && (
                  <p className="text-[9px] text-rose-500 mb-6 font-serif ">{modalError}</p>
                )}
                <input
                  type="email"
                  value={existingEmail}
                  onChange={(e) => setExistingEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-zinc-100 dark:border-zinc-800 outline-none py-4 mb-10 text-center text-[16px] md:text-[18px] font-serif tracking-tight"
                  placeholder="email@example.com"
                  autoFocus
                />
                <button
                  onClick={handleLookup}
                  disabled={isVerifying}
                  className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-black text-[9px] font-medium uppercase tracking-[0.4em] font-serif mb-8 disabled:opacity-50"
                >
                  {isVerifying ? 'Searching...' : 'Check Schedule'}
                </button>
                <button
                  onClick={() => setIsExisting(null)}
                  className="text-[8px] uppercase tracking-[0.4em] text-[#595f72] font-serif"
                >
                  [ Go Back ]
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <FadeIn>
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-12">
            {hasPrefillData ? (
              <button
                onClick={() => {
                  setShowModal(true)
                  setPersonalInfo({ firstName: '', surname: '', phone: '', email: '' })
                  router.replace('/booking')
                }}
                className="text-[8px] uppercase tracking-[0.35em] text-[#595f72] hover:text-[#251101] dark:hover:text-white transition-colors font-serif "
              >
                &larr; Switch User
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={handleClearSession}
              className="flex items-center gap-3 text-[8px] uppercase tracking-[0.35em] text-[#595f72] hover:text-rose-500 transition-colors font-serif "
            >
              <ArrowPathIcon className="w-3 h-3" />
              Clear Session
            </button>
          </div>

          <header className="mb-16 md:mb-24 flex items-start gap-5">
            <div
              className={`w-[1px] bg-zinc-900 dark:bg-white transition-all duration-1000 ease-out origin-top will-change-[height,opacity] ${drawLine ? 'h-10 md:h-12 opacity-100' : 'h-0 opacity-0'}`}
            />
            <div className="space-y-1">
              <p className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                {bookings.length > 0 ? 'Guest Session' : 'Appointment'}
              </p>
              <h1 className="text-[20px] md:text-[24px] font-light tracking-tight font-serif uppercase leading-none">
                {bookings.length > 0 ? 'Adding Another' : 'New Visit'}
              </h1>
            </div>
          </header>

          <form onSubmit={handleFinalSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-6">
              <div className="grid grid-cols-1 gap-px bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-900">
                <div className="bg-white dark:bg-black py-8 space-y-10">
                  <div className="relative group">
                    <label className="block text-[8px] md:text-[9px] font-medium uppercase tracking-[0.4em] text-[#595f72] mb-3 font-serif ">
                      Service
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={currentServiceId}
                        onChange={(e) => setCurrentServiceId(e.target.value)}
                        className="w-full bg-transparent text-[14px] md:text-[15px] font-serif outline-none py-1 appearance-none border-b border-zinc-100 dark:border-zinc-900 focus:border-zinc-900 dark:focus:border-white transition-colors"
                      >
                        <option value="" className="bg-white dark:bg-black">
                          Select Service...
                        </option>
                        {services.map((s) => (
                          <option key={s.id} value={s.id} className="bg-white dark:bg-black">
                            {s.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#595f72] pointer-events-none" />
                    </div>
                    {!showExtraService && (
                      <button
                        type="button"
                        onClick={() => setShowExtraService(true)}
                        className="mt-4 text-[7px] md:text-[8px] uppercase tracking-[0.35em] text-[#595f72] font-serif"
                      >
                        + Add second service
                      </button>
                    )}
                  </div>

                  {showExtraService && (
                    <div className="relative animate-in fade-in duration-500">
                      <div className="flex justify-between mb-3">
                        <label className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif ">
                          Additional Treatment
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowExtraService(false)
                            setExtraServiceId('')
                          }}
                          className="text-[7px] text-rose-500 uppercase tracking-widest font-serif"
                        >
                          [ Remove ]
                        </button>
                      </div>
                      <div className="relative">
                        <select
                          value={extraServiceId}
                          onChange={(e) => setExtraServiceId(e.target.value)}
                          className="w-full bg-transparent text-[14px] md:text-[15px] font-serif outline-none py-1 appearance-none border-b border-zinc-100 dark:border-zinc-900"
                        >
                          <option value="" className="bg-white dark:bg-black">
                            Select Service...
                          </option>
                          {services.map((s) => (
                            <option
                              key={s.id}
                              value={s.id}
                              disabled={String(s.id) === currentServiceId}
                              className="bg-white dark:bg-black"
                            >
                              {s.title}
                            </option>
                          ))}
                        </select>
                        <ChevronDownIcon className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#595f72] pointer-events-none" />
                      </div>
                    </div>
                  )}

                  <Field
                    label={bookings.length > 0 ? 'Guest First Name' : 'First Name'}
                    value={personalInfo.firstName}
                    onChange={(v) => setPersonalInfo({ ...personalInfo, firstName: v })}
                    placeholder="Juan"
                  />
                  <Field
                    label={bookings.length > 0 ? 'Guest Surname' : 'Surname'}
                    value={personalInfo.surname}
                    onChange={(v) => setPersonalInfo({ ...personalInfo, surname: v })}
                    placeholder="Dela Cruz"
                  />

                  {bookings.length === 0 && (
                    <>
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
                      <div className="relative">
                        <label className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] mb-3 block font-serif ">
                          Date
                        </label>
                        <input
                          type="date"
                          min={minSelectableDate}
                          required
                          value={currentDate}
                          onChange={(e) => {
                            setCurrentDate(e.target.value)
                            setCurrentTime('')
                          }}
                          className="w-full bg-transparent text-[14px] md:text-[15px] font-serif dark:text-white outline-none py-1 border-b border-zinc-100 dark:border-zinc-900"
                        />
                      </div>
                    </>
                  )}

                  <div className="relative">
                    <label className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] mb-3 block font-serif ">
                      Time Slot
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={currentTime}
                        onChange={(e) => setCurrentTime(e.target.value)}
                        disabled={!activeDate || loadingSlots}
                        className="w-full bg-transparent text-[14px] md:text-[15px] font-serif outline-none py-1 appearance-none border-b border-zinc-100 dark:border-zinc-900 disabled:opacity-30"
                      >
                        <option value="" className="bg-white dark:bg-black">
                          {loadingSlots ? 'Refreshing...' : 'Select Slot'}
                        </option>
                        {timeSlots.map((slot) => {
                          const isPast = activeDate === todayStr && slot <= manilaTimeNow
                          const isBusyInDB = busySlots.includes(slot)
                          const isBusyInSession = bookings.some(
                            (b) => b.date === activeDate && b.time === slot,
                          )
                          const isFull = isPast || isBusyInDB || isBusyInSession
                          return (
                            <option
                              key={slot}
                              value={slot}
                              disabled={isFull}
                              className="bg-white dark:bg-black"
                            >
                              {slot} {isFull ? (isPast ? '— PASSED' : '— FULLY BOOKED') : ''}
                            </option>
                          )
                        })}
                      </select>
                      <ChevronDownIcon className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#595f72] pointer-events-none" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPerson}
                    className="w-full py-8 border border-dashed border-zinc-100 dark:border-zinc-900 text-[8px] uppercase tracking-[0.45em] text-[#595f72] hover:text-[#251101] dark:hover:text-white transition-all font-serif "
                  >
                    + Add Guest
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-12">
              <div className="flex items-baseline justify-between mb-8 border-b border-zinc-900 dark:border-white pb-3">
                <h2 className="text-[9px] md:text-[10px] uppercase tracking-[0.5em] font-medium font-serif  flex items-center gap-3">
                  Booking Summary
                </h2>
                <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-[#595f72] font-serif tabular-nums whitespace-nowrap">
                  Entry Count: {bookings.length + (currentTime ? 1 : 0)}
                </span>
              </div>
              <div className="space-y-6">
                {Object.values(
                  bookings.reduce(
                    (acc, b) => {
                      const key = `${b.firstName}-${b.surname}-${b.time}`
                      if (!acc[key]) acc[key] = { ...b, services: [b.serviceId] }
                      else acc[key].services.push(b.serviceId)
                      return acc
                    },
                    {} as Record<string, any>,
                  ),
                ).map((group, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-black border border-zinc-50 dark:border-zinc-900 p-8 flex items-start justify-between shadow-sm animate-in slide-in-from-right-4 duration-500"
                  >
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <p className="text-[8px] uppercase tracking-[0.35em] text-[#595f72] font-serif  mb-2">
                          {group.date} • {group.time}
                        </p>
                        <h4 className="text-[16px] md:text-[18px] font-light font-serif uppercase tracking-tight">
                          {group.firstName} {group.surname}
                        </h4>
                      </div>
                      <div className="flex flex-col gap-2">
                        {group.services.map((sId: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="w-0.5 h-[1px] bg-zinc-200 dark:bg-zinc-800" />
                            <span className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-[#595f72] font-serif ">
                              {getServiceTitle(sId)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBookings(bookings.filter((b) => b.time !== group.time))}
                      className="text-[#595f72] hover:text-rose-500 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {currentTime && (
                  <div className="bg-zinc-900 text-white dark:bg-white dark:text-black p-8 md:p-12 flex flex-col justify-between min-h-[220px] shadow-sm relative overflow-hidden animate-in fade-in duration-500">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-500/30" />
                    <div className="flex justify-between items-start">
                      <p className="text-[8px] uppercase tracking-[0.4em] font-serif  opacity-50">
                        Booking Draft
                      </p>
                      <p className="text-[20px] md:text-[24px] font-light font-serif tabular-nums tracking-tighter">
                        {currentTime}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[18px] md:text-[22px] font-light font-serif uppercase tracking-tight leading-none">
                        {personalInfo.firstName || 'New'} {personalInfo.surname || 'Patient'}
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        <span className="text-[7px] md:text-[8px] uppercase tracking-[0.3em] font-serif border border-white/20 dark:border-black/20 px-2.5 py-0.5 ">
                          {getServiceTitle(currentServiceId)}
                        </span>
                        {showExtraService && extraServiceId && (
                          <span className="text-[7px] md:text-[8px] uppercase tracking-[0.3em] font-serif border border-white/20 dark:border-black/20 px-2.5 py-0.5 ">
                            {getServiceTitle(extraServiceId)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-10">
                <button
                  type="submit"
                  disabled={isPendingTransition || (!currentTime && bookings.length === 0)}
                  className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black text-[9px] md:text-[10px] font-medium py-6 uppercase tracking-[0.45em] font-serif disabled:opacity-20 shadow-sm flex items-center justify-center gap-4 transition-all hover:tracking-[0.5em]"
                >
                  {isPendingTransition ? (
                    <>
                      <ArrowPathIcon className="animate-spin h-3.5 w-3.5" />
                      Processing ...
                    </>
                  ) : (
                    'Confirm Appointment(s)'
                  )}
                </button>
              </div>
            </div>
          </form>
          <div className="mt-24 flex justify-center border-t border-zinc-50 dark:border-zinc-900/50 pt-10 opacity-30 hover:opacity-100 transition-opacity">
            <BackToHome />
          </div>
        </div>
      </FadeIn>
    </div>
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
    <div className="group relative">
      <label className="block text-[8px] md:text-[9px] font-medium uppercase tracking-[0.4em] text-[#595f72] mb-3 font-serif ">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full bg-transparent text-[14px] md:text-[15px] font-serif outline-none py-1 border-b border-zinc-100 dark:border-zinc-900 focus:border-zinc-900 dark:focus:border-white transition-colors placeholder:text-[#595f72]"
      />
    </div>
  )
}
