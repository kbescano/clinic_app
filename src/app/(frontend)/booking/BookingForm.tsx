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

  // --- INITIALIZATION ---
  const hasPrefillData = !!(initialData.email && initialData.fn)
  const [showModal, setShowModal] = useState(!hasPrefillData)
  const [existingEmail, setExistingEmail] = useState(initialData.email)

  // Initialize state with prefilled data immediately
  const [personalInfo, setPersonalInfo] = useState({
    firstName: initialData.fn || '',
    surname: initialData.sn || '',
    phone: initialData.ph || '',
    email: initialData.email || '',
  })

  // --- CORE STATE ---
  const [isExisting, setIsExisting] = useState<boolean | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [errorToast, setErrorToast] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [isPendingTransition, startTransition] = useTransition()
  const [state, formAction] = useActionState(createBookingAction, null)
  const [bookings, setBookings] = useState<BookingEntry[]>([])
  const [drawLine, setDrawLine] = useState(false)

  const [currentServiceId, setCurrentServiceId] = useState(searchParams.get('serviceId') || '')
  const [extraServiceId, setExtraServiceId] = useState('')
  const [showExtraService, setShowExtraService] = useState(false)
  const [currentDate, setCurrentDate] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const [busySlots, setBusySlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // --- PROGRESSIVE DISCLOSURE LOGIC ---
  const isAddingGuest = bookings.length > 0
  const showIdentitySection = !hasPrefillData || isAddingGuest

  const showFirstName = currentServiceId !== ''
  const showSurname = showFirstName && personalInfo.firstName.trim().length > 0

  const showPhone = showIdentitySection && showSurname && !initialData.ph
  const showEmail =
    showIdentitySection &&
    (initialData.ph ? showSurname : showPhone && isValidPHPhone(personalInfo.phone)) &&
    !initialData.email

  const identitySatisfied =
    hasPrefillData && !isAddingGuest
      ? currentServiceId !== ''
      : personalInfo.firstName.trim().length > 0 &&
        personalInfo.surname.trim().length > 0 &&
        (initialData.ph || isValidPHPhone(personalInfo.phone)) &&
        (initialData.email || isValidEmail(personalInfo.email))

  const showDate = identitySatisfied && bookings.length === 0
  const showTime = bookings.length > 0 || currentDate !== ''

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

  // --- EFFECTS ---
  useEffect(() => {
    if (state?.error) setErrorToast(state.error)
  }, [state])

  useEffect(() => {
    if (!showModal || hasPrefillData) {
      const timer = setTimeout(() => setDrawLine(true), 500)
      return () => clearTimeout(timer)
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

  // Sync from URL only if we are on the first booking and fields are empty
  useEffect(() => {
    if (bookings.length > 0) return
    const fn = searchParams.get('fn')
    const sn = searchParams.get('sn')
    if (fn && !personalInfo.firstName) {
      setPersonalInfo((prev) => ({
        ...prev,
        firstName: fn,
        surname: sn || prev.surname,
        email: searchParams.get('email') || prev.email,
        phone: searchParams.get('ph') || prev.phone,
      }))
    }
  }, [searchParams, bookings.length])

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
        if (currentServiceId) statusParams.append('serviceId', currentServiceId)
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
      if (currentServiceId) bookingParams.append('serviceId', currentServiceId)
      startTransition(() => {
        setShowModal(false)
        router.replace(`/booking?${bookingParams.toString()}`)
      })
    } catch (err) {
      setModalError('Server error. Please try again.')
      setIsVerifying(false)
    }
  }

  const handleAddPerson = () => {
    setErrorToast(null)
    if (
      !personalInfo.firstName ||
      !personalInfo.surname ||
      !currentServiceId ||
      !activeDate ||
      !currentTime
    ) {
      setErrorToast('Complete missing fields.')
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

    // Clear name but keep primary contact info for next guest
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
      setPersonalInfo({ firstName: '', surname: '', phone: '', email: '' })
      setIsExisting(null)
      setShowModal(true)
      router.replace('/booking')
    }
  }

  const getServiceTitle = (id: string) =>
    services.find((s) => String(s.id) === id)?.title || 'Service'

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-[#251101] dark:text-zinc-100 pt-24 md:pt-32 pb-32 px-4 md:px-8 selection:bg-zinc-100 overflow-x-hidden font-sans">
      {errorToast && (
        <Notification message={errorToast} type="error" onClose={() => setErrorToast(null)} />
      )}

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-xl p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#050505] p-10 md:p-16 border border-zinc-100 dark:border-zinc-900 shadow-2xl text-center">
            {isExisting === null ? (
              <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
                <p className="text-[8px] md:text-[9px] uppercase tracking-[0.5em] text-[#595f72] font-serif mb-4">
                  Welcome!
                </p>
                <h3 className="text-[24px] md:text-[32px] font-light mb-14 font-serif tracking-tighter text-[#251101] dark:text-zinc-100 leading-none">
                  Visited us before?
                </h3>
                <div className="flex flex-col gap-4 w-full">
                  <button
                    onClick={() => setIsExisting(true)}
                    className="w-full py-5 bg-[#251101] dark:bg-white text-white dark:text-[#251101] text-[8px] md:text-[9px] font-medium uppercase tracking-[0.4em] font-serif transition-all hover:opacity-90"
                  >
                    Yes, I&apos;m a current customer
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full py-5 border border-zinc-100 dark:border-zinc-900 text-[#595f72] text-[8px] md:text-[9px] font-medium uppercase tracking-[0.4em] font-serif transition-all hover:text-[#251101] dark:hover:text-white"
                  >
                    No, I am new customer
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                <p className="text-[8px] md:text-[9px] uppercase tracking-[0.5em] text-[#595f72] font-serif mb-4">
                  Verification
                </p>
                <h3 className="text-[24px] md:text-[32px] font-light mb-4 font-serif tracking-tighter text-[#251101] dark:text-zinc-100 leading-none">
                  Confirm Email
                </h3>
                <input
                  type="email"
                  value={existingEmail}
                  onChange={(e) => setExistingEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-zinc-100 dark:border-zinc-800 outline-none py-6 mb-12 text-center text-[18px] md:text-[22px] font-serif tracking-tight"
                  placeholder="email@example.com"
                  autoFocus
                />
                <button
                  onClick={handleLookup}
                  disabled={isVerifying}
                  className="w-full py-5 bg-[#251101] dark:bg-white text-white dark:text-[#251101] text-[9px] font-medium uppercase tracking-[0.4em] font-serif mb-10 disabled:opacity-50"
                >
                  {isVerifying ? 'Searching Archive...' : 'Access Records'}
                </button>
                <button
                  onClick={() => setIsExisting(null)}
                  className="text-[7px] md:text-[8px] uppercase tracking-[0.4em] text-[#595f72] font-serif hover:text-[#251101] transition-colors"
                >
                  [ Return ]
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <FadeIn>
        <div className="max-w-4xl mx-auto flex flex-col gap-14 md:gap-20">
          <div className="flex items-center justify-between">
            <button
              onClick={handleClearSession}
              className="flex items-center gap-3 text-[7px] md:text-[8px] uppercase tracking-[0.4em] text-[#595f72] hover:text-[#d7263d] transition-colors font-serif"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              Clear Session
            </button>
          </div>

          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12">
            <div className="space-y-4 relative">
              <div
                className={`absolute -left-4 md:-left-8 top-0 w-[1px] bg-zinc-900 dark:bg-white transition-all duration-1000 ease-out origin-top ${drawLine ? 'h-full opacity-100' : 'h-0 opacity-0'}`}
              />
              <p className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                {bookings.length > 0 ? 'Guest Session' : 'Appointment Registry'}
              </p>
              <h1 className="text-[28px] md:text-[48px] font-light tracking-tighter font-serif leading-none">
                {bookings.length > 0 ? 'Adding Another' : 'New Visit'}
              </h1>
            </div>
          </header>

          <form
            onSubmit={handleFinalSubmit}
            className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20"
          >
            <div className="lg:col-span-6 flex flex-col gap-10">
              <div className="grid grid-cols-1 gap-px bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50 shadow-sm">
                <div className="bg-white dark:bg-[#050505] p-6 md:p-8 space-y-10">
                  {/* STEP 1: SERVICE */}
                  <div className="relative group animate-in fade-in duration-700">
                    <label className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] mb-3 block font-serif">
                      Service
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={currentServiceId}
                        onChange={(e) => setCurrentServiceId(e.target.value)}
                        className="w-full bg-transparent text-[15px] md:text-[16px] font-serif outline-none py-1.5 appearance-none border-b border-zinc-100 dark:border-zinc-900 focus:border-zinc-300 transition-colors text-[#251101] dark:text-zinc-100"
                      >
                        <option value="" className="bg-white dark:bg-[#050505]">
                          Select Service...
                        </option>
                        {services.map((s) => (
                          <option key={s.id} value={s.id} className="bg-white dark:bg-[#050505]">
                            {s.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#595f72] pointer-events-none" />
                    </div>
                    {currentServiceId && !showExtraService && (
                      <button
                        type="button"
                        onClick={() => setShowExtraService(true)}
                        className="mt-4 text-[6px] md:text-[7px] uppercase tracking-[0.3em] text-[#595f72] font-serif hover:text-[#251101] dark:hover:text-zinc-100 animate-in fade-in slide-in-from-top-1"
                      >
                        + Add second service
                      </button>
                    )}
                  </div>

                  {showExtraService && (
                    <div className="relative animate-in fade-in slide-in-from-top-2 duration-500">
                      <div className="flex justify-between mb-3">
                        <label className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                          Additional Treatment
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowExtraService(false)
                            setExtraServiceId('')
                          }}
                          className="text-[7px] text-[#d7263d] uppercase tracking-[0.2em] font-serif"
                        >
                          [ Remove ]
                        </button>
                      </div>
                      <div className="relative">
                        <select
                          value={extraServiceId}
                          onChange={(e) => setExtraServiceId(e.target.value)}
                          className="w-full bg-transparent text-[15px] md:text-[16px] font-serif outline-none py-1.5 appearance-none border-b border-zinc-100 dark:border-zinc-900 focus:border-zinc-300 transition-colors"
                        >
                          <option value="" className="bg-white dark:bg-[#050505]">
                            Select Service...
                          </option>
                          {services.map((s) => (
                            <option
                              key={s.id}
                              value={s.id}
                              disabled={String(s.id) === currentServiceId}
                              className="bg-white dark:bg-[#050505]"
                            >
                              {s.title}
                            </option>
                          ))}
                        </select>
                        <ChevronDownIcon className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#595f72] pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {/* STEP 2: IDENTITY (Skipped for prefilled patients) */}
                  {showIdentitySection && showFirstName && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
                      <Field
                        label={isAddingGuest ? 'Guest First Name' : 'First Name'}
                        value={personalInfo.firstName}
                        onChange={(v) => setPersonalInfo({ ...personalInfo, firstName: v })}
                        placeholder="Juan"
                      />
                      {showSurname && (
                        <Field
                          label={isAddingGuest ? 'Guest Surname' : 'Surname'}
                          value={personalInfo.surname}
                          onChange={(v) => setPersonalInfo({ ...personalInfo, surname: v })}
                          placeholder="Dela Cruz"
                        />
                      )}
                      {showPhone && (
                        <Field
                          label="Phone"
                          value={personalInfo.phone}
                          onChange={(v) => setPersonalInfo({ ...personalInfo, phone: v })}
                          placeholder="0917 123 4567"
                        />
                      )}
                      {showEmail && (
                        <Field
                          label="Email"
                          value={personalInfo.email}
                          onChange={(v) => setPersonalInfo({ ...personalInfo, email: v })}
                          placeholder="hello@example.com"
                        />
                      )}
                    </div>
                  )}

                  {/* STEP 3: DATE & TIME */}
                  {showDate && (
                    <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-700">
                      <label className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] mb-3 block font-serif">
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
                        className="w-full bg-transparent text-[15px] md:text-[16px] font-serif outline-none py-1.5 border-b border-zinc-100 dark:border-zinc-900 focus:border-zinc-300 transition-colors text-[#251101] dark:text-zinc-100"
                      />
                    </div>
                  )}

                  {showTime && (
                    <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-700">
                      <label className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] mb-3 block font-serif">
                        Time Slot
                      </label>
                      <div className="relative">
                        <select
                          required
                          value={currentTime}
                          onChange={(e) => setCurrentTime(e.target.value)}
                          disabled={!activeDate || loadingSlots}
                          className="w-full bg-transparent text-[15px] md:text-[16px] font-serif outline-none py-1.5 appearance-none border-b border-zinc-100 dark:border-zinc-900 disabled:opacity-30 text-[#251101] dark:text-zinc-100"
                        >
                          <option value="" className="bg-white dark:bg-[#050505]">
                            {loadingSlots ? 'Checking Availability...' : 'Select Slot'}
                          </option>
                          {timeSlots.map((slot) => {
                            const isFull =
                              (activeDate === todayStr && slot <= manilaTimeNow) ||
                              busySlots.includes(slot) ||
                              bookings.some((b) => b.date === activeDate && b.time === slot)
                            return (
                              <option
                                key={slot}
                                value={slot}
                                disabled={isFull}
                                className="bg-white dark:bg-[#050505]"
                              >
                                {slot} {isFull ? '— FULL' : ''}
                              </option>
                            )
                          })}
                        </select>
                        <ChevronDownIcon className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#595f72] pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {currentTime && (
                    <button
                      type="button"
                      onClick={handleAddPerson}
                      className="w-full py-6 md:py-8 border border-dashed border-zinc-200 dark:border-zinc-800 text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] hover:text-[#251101] transition-all font-serif animate-in fade-in slide-in-from-top-2"
                    >
                      + Add Guest to Manifest
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* SUMMARY PANEL */}
            <div className="lg:col-span-6 flex flex-col gap-10">
              <div className="flex items-baseline justify-between border-b border-zinc-100 dark:border-zinc-900/50 pb-3">
                <h2 className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                  Booking Manifest
                </h2>
                <span className="text-[10px] md:text-[12px] font-serif text-[#251101] dark:text-zinc-100 tabular-nums">
                  {bookings.length + (currentTime ? 1 : 0)} Entries
                </span>
              </div>

              <div className="flex flex-col gap-6">
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
                    className="bg-white dark:bg-[#050505] border border-zinc-100 dark:border-zinc-800 p-6 md:p-8 flex items-start justify-between shadow-sm animate-in slide-in-from-right-4 duration-500"
                  >
                    <div className="space-y-4">
                      <p className="text-[7px] md:text-[8px] uppercase tracking-[0.3em] text-[#595f72] font-serif">
                        {group.date} • {group.time}
                      </p>
                      <h4 className="text-[16px] md:text-[18px] font-serif tracking-tight text-[#251101] dark:text-zinc-100 capitalize">
                        {group.firstName} {group.surname}
                      </h4>
                      <div className="flex flex-col gap-1.5">
                        {group.services.map((sId: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[7px] md:text-[8px] uppercase tracking-[0.2em] text-[#595f72] font-serif"
                          >
                            / {getServiceTitle(sId)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBookings(bookings.filter((b) => b.time !== group.time))}
                      className="text-[#595f72] hover:text-[#d7263d] transition-colors p-1"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {currentTime && (
                  <div className="bg-[#251101] dark:bg-white text-white dark:text-[#251101] p-8 md:p-10 flex flex-col justify-between min-h-[200px] shadow-sm relative overflow-hidden animate-in fade-in duration-500">
                    <div className="absolute top-0 left-0 w-full h-[1.5px] bg-[#48a9a6]/50" />
                    <div className="flex justify-between items-start">
                      <p className="text-[7px] md:text-[8px] uppercase tracking-[0.4em] font-serif opacity-60">
                        Session Draft
                      </p>
                      <p className="text-[20px] md:text-[28px] font-light font-serif tabular-nums tracking-tighter">
                        {currentTime}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[20px] md:text-[24px] font-serif tracking-tight leading-none capitalize">
                        {personalInfo.firstName ||
                          (hasPrefillData && bookings.length === 0 ? initialData.fn : 'New')}{' '}
                        {personalInfo.surname ||
                          (hasPrefillData && bookings.length === 0 ? initialData.sn : 'Patient')}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[6px] md:text-[7px] uppercase tracking-[0.2em] font-serif border border-white/20 dark:border-[#251101]/20 px-2 py-0.5">
                          {getServiceTitle(currentServiceId)}
                        </span>
                        {showExtraService && extraServiceId && (
                          <span className="text-[6px] md:text-[7px] uppercase tracking-[0.2em] font-serif border border-white/20 dark:border-[#251101]/20 px-2 py-0.5">
                            {getServiceTitle(extraServiceId)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isPendingTransition || (!currentTime && bookings.length === 0)}
                  className="w-full bg-[#251101] dark:bg-white text-white dark:text-[#251101] text-[8px] md:text-[10px] font-serif py-6 uppercase tracking-[0.4em] transition-all hover:tracking-[0.5em] disabled:opacity-20 flex items-center justify-center gap-4 shadow-sm"
                >
                  {isPendingTransition ? (
                    <>
                      <ArrowPathIcon className="animate-spin h-3.5 w-3.5" /> Processing Registry...
                    </>
                  ) : (
                    'Confirm Appointment(s)'
                  )}
                </button>
              </div>
            </div>
          </form>

          <div className="pt-8 md:pt-12 flex justify-center border-t border-zinc-50 dark:border-zinc-900/50 opacity-40 hover:opacity-100 transition-opacity">
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
    <div className="group relative animate-in fade-in slide-in-from-bottom-2 duration-700">
      <label className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] mb-3 block font-serif">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full bg-transparent text-[15px] md:text-[16px] font-serif outline-none py-1.5 border-b border-zinc-100 dark:border-zinc-900 focus:border-zinc-300 dark:focus:border-zinc-600 transition-colors text-[#251101] dark:text-zinc-100 placeholder:text-zinc-200"
      />
    </div>
  )
}
