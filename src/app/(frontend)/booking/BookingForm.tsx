'use client'

import React, {
  useActionState,
  useState,
  useEffect,
  Suspense,
  useTransition,
  useMemo,
  Fragment,
} from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from '@headlessui/react'
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

  const hasPrefillData = !!(initialData.email && initialData.fn)
  const [showModal, setShowModal] = useState(!hasPrefillData)
  const [existingEmail, setExistingEmail] = useState(initialData.email)

  const [personalInfo, setPersonalInfo] = useState({
    firstName: initialData.fn || '',
    surname: initialData.sn || '',
    phone: initialData.ph || '',
    email: initialData.email || '',
  })

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

  const [viewDate, setViewDate] = useState(dayjs(minSelectableDate).startOf('month'))

  const availableMonths = useMemo(() => {
    return [...Array(6)].map((_, i) => dayjs(minSelectableDate).startOf('month').add(i, 'month'))
  }, [minSelectableDate])

  const calendarGrid = useMemo(() => {
    const startOfMonth = viewDate.startOf('month')
    const startDay = startOfMonth.day()
    return [...Array(35)].map((_, i) => startOfMonth.subtract(startDay, 'day').add(i, 'day'))
  }, [viewDate])

  // --- REFINED PROGRESSIVE DISCLOSURE LOGIC ---
  const isAddingGuest = bookings.length > 0
  const showIdentitySection = !hasPrefillData || isAddingGuest
  const showFirstName = currentServiceId !== ''
  const showSurname = showFirstName && personalInfo.firstName.trim().length > 0

  // Logic: Only show contact fields for the primary booker
  const showPhone = !isAddingGuest && showIdentitySection && showSurname && !initialData.ph
  const showEmail =
    !isAddingGuest &&
    showIdentitySection &&
    (initialData.ph ? showSurname : showPhone && isValidPHPhone(personalInfo.phone)) &&
    !initialData.email

  // Fix: Guest only needs name and service to satisfy identity
  const identitySatisfied =
    hasPrefillData && !isAddingGuest
      ? currentServiceId !== ''
      : personalInfo.firstName.trim().length > 0 &&
        personalInfo.surname.trim().length > 0 &&
        (isAddingGuest || initialData.ph || isValidPHPhone(personalInfo.phone)) &&
        (isAddingGuest || initialData.email || isValidEmail(personalInfo.email))

  const showDateSection = identitySatisfied

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

  useEffect(() => {
    if (state?.error) setErrorToast(state.error)
  }, [state])

  useEffect(() => {
    if (!showModal || hasPrefillData) {
      const timer = setTimeout(() => setDrawLine(true), 500)
      return () => clearTimeout(timer)
    }
  }, [showModal, hasPrefillData])

  useEffect(() => {
    async function updateAvailability() {
      const activeDate = currentDate || (bookings.length > 0 ? bookings[0].date : null)
      if (activeDate) {
        setLoadingSlots(true)
        const taken = await getBusySlots(activeDate)
        setBusySlots(taken)
        setLoadingSlots(false)
      }
    }
    updateAvailability()
  }, [currentDate, bookings])

  const handleLookup = async () => {
    if (!isValidEmail(existingEmail)) {
      setModalError('Invalid email format.')
      return
    }
    setIsVerifying(true)
    try {
      const data = (await getCustomerByEmail(existingEmail.trim().toLowerCase())) as any
      if (!data) {
        setModalError('No record found.')
        setIsVerifying(false)
        return
      }
      const params = new URLSearchParams({
        fn: data.firstName,
        sn: data.surname,
        email: data.email,
        ph: data.phone,
      })
      if (currentServiceId) params.append('serviceId', currentServiceId)
      window.location.href = `/booking?${params.toString()}`
    } catch {
      setModalError('Server error.')
      setIsVerifying(false)
    }
  }

  const handleAddPerson = () => {
    const entry = {
      ...personalInfo,
      serviceId: currentServiceId,
      date: currentDate,
      time: currentTime,
    }
    const batch = [entry]
    if (showExtraService && extraServiceId) batch.push({ ...entry, serviceId: extraServiceId })
    setBookings([...bookings, ...batch])
    setPersonalInfo({
      ...personalInfo,
      firstName: '',
      surname: '',
    })
    setCurrentServiceId('')
    setExtraServiceId('')
    setShowExtraService(false)
    setCurrentTime('')
    // currentDate is preserved so the guest stays on the same day
  }

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const finalEntries = [...bookings]
    if (personalInfo.firstName && currentTime) {
      const current = {
        ...personalInfo,
        serviceId: currentServiceId,
        date: currentDate,
        time: currentTime,
      }
      finalEntries.push(current)
      if (showExtraService && extraServiceId)
        finalEntries.push({ ...current, serviceId: extraServiceId })
    }
    const fd = new FormData()
    startTransition(() => {
      finalEntries.forEach((b) => {
        fd.append('firstName', b.firstName)
        fd.append('surname', b.surname)
        fd.append('email', b.email)
        fd.append('phone', b.phone)
        fd.append('serviceId', b.serviceId)
        fd.append('appointmentDate', `${b.date}T${b.time}:00`)
      })
      formAction(fd)
    })
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
          <div className="w-full max-w-lg bg-white dark:bg-[#050505] p-10 md:p-16 border border-zinc-100 dark:border-zinc-900 rounded-2xl shadow-2xl text-center">
            {isExisting === null ? (
              <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
                <p className="text-[8px] md:text-[9px] uppercase tracking-[0.5em] text-[#595f72] font-serif mb-4">
                  Welcome!
                </p>
                <h3 className="text-[24px] md:text-[32px] font-light mb-14 font-serif tracking-tighter leading-none">
                  Visited us before?
                </h3>
                <div className="flex flex-col gap-4 w-full">
                  <button
                    onClick={() => setIsExisting(true)}
                    className="w-full py-5 bg-[#251101] dark:bg-white text-white dark:text-[#251101] text-[8px] md:text-[9px] font-medium uppercase tracking-[0.4em] font-serif rounded-full transition-all hover:opacity-90"
                  >
                    Yes, I&apos;m a current customer
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full py-5 border border-zinc-100 dark:border-zinc-900 text-[#595f72] text-[8px] md:text-[9px] font-medium uppercase tracking-[0.4em] font-serif rounded-full transition-all hover:text-[#251101] dark:hover:text-white"
                  >
                    No, I am a new customer
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                <p className="text-[8px] md:text-[9px] uppercase tracking-[0.5em] text-[#595f72] font-serif mb-4">
                  Verification
                </p>
                <h3 className="text-[24px] md:text-[32px] font-light mb-4 font-serif tracking-tighter leading-none">
                  Confirm Email
                </h3>
                {modalError && (
                  <p className="text-[10px] text-red-500 mb-4 font-serif">{modalError}</p>
                )}
                <input
                  type="email"
                  value={existingEmail}
                  onChange={(e) => {
                    setExistingEmail(e.target.value)
                    setModalError(null)
                  }}
                  className="w-full bg-transparent border-b border-zinc-100 dark:border-zinc-800 outline-none py-6 mb-12 text-center text-[18px] md:text-[22px] font-serif"
                  placeholder="email@example.com"
                />
                <button
                  onClick={handleLookup}
                  disabled={isVerifying}
                  className="w-full py-5 bg-[#251101] dark:bg-white text-white dark:text-[#251101] text-[9px] font-medium uppercase tracking-[0.4em] font-serif rounded-full mb-10 disabled:opacity-50"
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
              onClick={() => {
                if (confirm('Clear session?')) window.location.href = '/booking'
              }}
              className="flex items-center gap-3 text-[7px] md:text-[8px] uppercase tracking-[0.4em] text-[#595f72] hover:text-[#d7263d] transition-colors font-serif"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" /> Clear Session
            </button>
          </div>

          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12">
            <div className="space-y-4 relative">
              <div
                className={`absolute -left-4 md:-left-8 top-0 w-[1px] bg-zinc-900 dark:bg-white transition-all duration-1000 ease-out origin-top ${drawLine ? 'h-full opacity-100' : 'h-0 opacity-0'}`}
              />
              <p className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                {bookings.length > 0 ? 'Guest Session' : 'Appointment'}
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
              <div className="grid grid-cols-1 gap-px bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl overflow-visible shadow-sm">
                <div className="bg-white dark:bg-[#050505] p-6 md:p-8 space-y-10 rounded-2xl">
                  {/* SERVICE SELECT */}
                  <div className="relative animate-in fade-in duration-700">
                    <label className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] mb-3 block font-serif">
                      Service
                    </label>

                    <Listbox value={currentServiceId} onChange={setCurrentServiceId}>
                      <div className="relative z-40">
                        <ListboxButton className="w-full bg-transparent text-[16px] font-serif text-left outline-none py-1.5 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between transition-colors focus:border-zinc-300">
                          <span className={`truncate ${!currentServiceId ? 'opacity-40' : ''}`}>
                            {currentServiceId
                              ? getServiceTitle(currentServiceId)
                              : 'Select Service...'}
                          </span>
                          <ChevronDownIcon className="w-3.5 h-3.5 text-[#595f72]" />
                        </ListboxButton>

                        <Transition
                          as={Fragment}
                          enter="transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                          enterFrom="opacity-0 translate-y-4 blur-md scale-95"
                          enterTo="opacity-100 translate-y-0 blur-0 scale-100"
                          leave="transition-all duration-300 ease-in"
                          leaveFrom="opacity-100 blur-0"
                          leaveTo="opacity-0 blur-sm"
                        >
                          <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-2xl bg-white/95 dark:bg-[#050505]/95 backdrop-blur-2xl border border-zinc-100 dark:border-zinc-900 py-2 shadow-2xl focus:outline-none ring-1 ring-black/5">
                            {services.map((s) => (
                              <ListboxOption
                                key={s.id}
                                value={String(s.id)}
                                className={({ active }) =>
                                  `relative cursor-pointer select-none py-4 px-6 transition-colors ${
                                    active ? 'bg-zinc-50 dark:bg-zinc-900/50' : ''
                                  }`
                                }
                              >
                                {({ selected }) => (
                                  <div className="flex items-center justify-between">
                                    <span
                                      className={`block truncate text-[14px] font-serif tracking-tight ${selected ? 'text-[#251101] dark:text-white font-medium' : 'text-[#595f72]'}`}
                                    >
                                      {s.title}
                                    </span>
                                    {selected && (
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#48a9a6]" />
                                    )}
                                  </div>
                                )}
                              </ListboxOption>
                            ))}
                          </ListboxOptions>
                        </Transition>
                      </div>
                    </Listbox>

                    {currentServiceId && !showExtraService && (
                      <button
                        type="button"
                        onClick={() => setShowExtraService(true)}
                        className="mt-4 text-[6px] md:text-[7px] uppercase tracking-[0.3em] text-[#595f72] font-serif hover:text-[#251101] animate-in fade-in"
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

                      <Listbox value={extraServiceId} onChange={setExtraServiceId}>
                        <div className="relative">
                          <ListboxButton className="w-full bg-transparent text-[16px] font-serif text-left outline-none py-1.5 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between transition-colors focus:border-zinc-300">
                            <span className={`truncate ${!extraServiceId ? 'opacity-40' : ''}`}>
                              {extraServiceId
                                ? getServiceTitle(extraServiceId)
                                : 'Select Service...'}
                            </span>
                            <ChevronDownIcon className="w-3.5 h-3.5 text-[#595f72]" />
                          </ListboxButton>

                          <Transition
                            as={Fragment}
                            enter="transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                            enterFrom="opacity-0 translate-y-4 blur-md scale-95"
                            enterTo="opacity-100 translate-y-0 blur-0 scale-100"
                            leave="transition-all duration-300 ease-in"
                            leaveFrom="opacity-100 blur-0"
                            leaveTo="opacity-0 blur-sm"
                          >
                            <ListboxOptions className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-2xl bg-white/90 dark:bg-[#050505]/90 backdrop-blur-2xl border border-zinc-100 dark:border-zinc-900 py-2 shadow-2xl focus:outline-none ring-1 ring-black/5">
                              {services.map((s) => (
                                <ListboxOption
                                  key={s.id}
                                  value={String(s.id)}
                                  disabled={String(s.id) === currentServiceId}
                                  className={({ active, selected, disabled }) =>
                                    `relative select-none py-4 px-6 transition-colors ${
                                      disabled ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'
                                    } ${active && !disabled ? 'bg-zinc-50 dark:bg-zinc-900/50' : ''}`
                                  }
                                >
                                  {({ selected }) => (
                                    <div className="flex items-center justify-between">
                                      <span
                                        className={`block truncate text-[14px] font-serif tracking-tight ${selected ? 'text-[#251101] dark:text-white font-medium' : 'text-[#595f72]'}`}
                                      >
                                        {s.title}
                                      </span>
                                      {selected && (
                                        <div className="w-1 h-1 rounded-full bg-[#48a9a6]" />
                                      )}
                                    </div>
                                  )}
                                </ListboxOption>
                              ))}
                            </ListboxOptions>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>
                  )}

                  {/* IDENTITY FIELDS (Guest Logic Applied) */}
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

                      {/* Hide contact fields for guests */}
                      {!isAddingGuest && (
                        <>
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
                        </>
                      )}
                    </div>
                  )}

                  {/* CALENDAR & TIME SECTION */}
                  {showDateSection && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                      {/* Hide Calendar Grid for Guests */}
                      {!isAddingGuest && (
                        <div className="relative">
                          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                            <div className="space-y-1">
                              <label className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] block font-serif">
                                Clinic Calendar
                              </label>
                              <h3 className="text-[20px] md:text-[24px] font-serif font-light tracking-tighter leading-none">
                                {viewDate.format('MMMM YYYY')}
                              </h3>
                            </div>
                            <div className="inline-flex items-center bg-zinc-50 dark:bg-zinc-900/50 p-1 rounded-full border border-zinc-100 dark:border-zinc-800/50 relative overflow-hidden">
                              <div
                                className="absolute top-1 bottom-1 w-[42px] md:w-[35px] bg-white dark:bg-zinc-800 rounded-full shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                                style={{
                                  transform: `translateX(${availableMonths.findIndex((m) => m.isSame(viewDate, 'month')) * 100}%)`,
                                }}
                              />
                              {availableMonths.map((m) => (
                                <button
                                  key={m.format('MMM')}
                                  type="button"
                                  onClick={() => setViewDate(m)}
                                  className={`relative z-10 w-[42px] md:w-[52px] py-1.5 text-[6px] md:text-[7px] uppercase tracking-[0.1em] font-medium transition-colors duration-300 font-serif ${viewDate.isSame(m, 'month') ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'}`}
                                >
                                  {m.format('MMM')}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-7 gap-px bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl overflow-hidden">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                              <div
                                key={d}
                                className="bg-zinc-50/50 dark:bg-zinc-900/30 py-3 text-center"
                              >
                                <span className="text-[6px] md:text-[7px] uppercase tracking-[0.2em] font-serif text-[#595f72] opacity-60">
                                  {d}
                                </span>
                              </div>
                            ))}
                            {calendarGrid.map((date, i) => {
                              const dateStr = date.format('YYYY-MM-DD')
                              const isSelected = currentDate === dateStr
                              const isToday = dateStr === todayStr
                              const isDisabled = date.isBefore(dayjs(minSelectableDate), 'day')
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  disabled={isDisabled}
                                  onClick={() => {
                                    setCurrentDate(dateStr)
                                    setCurrentTime('')
                                  }}
                                  className={`relative h-14 md:h-20 flex flex-col items-center justify-center transition-all duration-500 ${isSelected ? 'bg-[#251101] dark:bg-white z-10' : 'bg-white dark:bg-[#050505] hover:bg-zinc-50 dark:hover:bg-zinc-900/40'} ${!date.isSame(viewDate, 'month') ? 'opacity-[0.15]' : ''} ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  <span
                                    className={`text-[13px] md:text-[16px] font-serif tabular-nums tracking-tight ${isSelected ? 'text-white dark:text-[#251101]' : 'text-[#251101] dark:text-zinc-100'}`}
                                  >
                                    {date.date()}
                                  </span>
                                  {isToday && (
                                    <div
                                      className={`absolute bottom-2 md:bottom-3 w-1 h-1 rounded-full ${isSelected ? 'bg-white dark:bg-[#251101]' : 'bg-[#48a9a6]'}`}
                                    />
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Always show Time Slots once Date is set (persisted for guests) */}
                      {currentDate && (
                        <div className="relative animate-in fade-in slide-in-from-top-6 duration-700">
                          <label className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] block font-serif mb-6">
                            {isAddingGuest
                              ? `Guest Time Slot (${dayjs(currentDate).format('MMM D')})`
                              : loadingSlots
                                ? 'Consulting Archive...'
                                : 'Available Time Slots'}
                          </label>
                          <div className="grid grid-cols-3 gap-px bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl overflow-hidden">
                            {timeSlots.map((slot) => {
                              const isFull =
                                (currentDate === todayStr && slot <= manilaTimeNow) ||
                                busySlots.includes(slot) ||
                                bookings.some((b) => b.date === currentDate && b.time === slot)
                              const isSelected = currentTime === slot
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  disabled={isFull || loadingSlots}
                                  onClick={() => setCurrentTime(slot)}
                                  className={`relative py-6 md:py-8 flex flex-col items-center justify-center gap-2 transition-all duration-500 ${isSelected ? 'bg-[#251101] dark:bg-white z-10' : 'bg-white dark:bg-[#050505] hover:bg-zinc-50 dark:hover:bg-zinc-900/40'} ${isFull ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  <span
                                    className={`text-[12px] md:text-[14px] font-serif tabular-nums tracking-widest ${isSelected ? 'text-white dark:text-[#251101]' : 'text-[#251101] dark:text-zinc-100'}`}
                                  >
                                    {slot}
                                  </span>
                                  {isFull && (
                                    <span className="text-[5px] uppercase tracking-[0.2em] font-serif opacity-40">
                                      Reserved
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {currentTime && (
                        <button
                          type="button"
                          onClick={handleAddPerson}
                          className="w-full py-6 md:py-10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] hover:text-[#251101] transition-all font-serif"
                        >
                          + Add Guest
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col gap-10">
              <div className="flex items-baseline justify-between border-b border-zinc-100 dark:border-zinc-900/50 pb-3 px-1">
                <h2 className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                  Booking Summary
                </h2>
                <span className="text-[10px] md:text-[12px] font-serif text-[#251101] dark:text-zinc-100 tabular-nums">
                  {bookings.length + (currentTime ? 1 : 0)} Entries
                </span>
              </div>

              <div className="flex flex-col gap-6">
                {bookings.map((b, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-[#050505] border border-zinc-100 dark:border-zinc-800 p-6 md:p-8 flex items-start justify-between rounded-2xl"
                  >
                    <div className="space-y-4">
                      <p className="text-[7px] md:text-[8px] uppercase tracking-[0.3em] text-[#595f72] font-serif">
                        {b.date} • {b.time}
                      </p>
                      <h4 className="text-[16px] md:text-[18px] font-serif tracking-tight text-[#251101] dark:text-zinc-100 capitalize">
                        {b.firstName} {b.surname}
                      </h4>
                      <span className="text-[10px] md:text-[11px] capitalize tracking-tight text-[#595f72] font-serif">
                        {getServiceTitle(b.serviceId)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBookings(bookings.filter((_, idx) => idx !== i))}
                      className="text-[#595f72] hover:text-[#d7263d] p-1"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {currentTime && (
                  <div className="bg-[#251101] dark:bg-white text-white dark:text-[#251101] p-8 md:p-10 flex flex-col justify-between min-h-[200px] rounded-2xl relative overflow-hidden animate-in fade-in">
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
                        {personalInfo.firstName || 'New'} {personalInfo.surname || 'Patient'}
                      </h4>
                      <span className="text-[6px] md:text-[7px] uppercase tracking-[0.2em] font-serif border border-white/20 dark:border-[#251101]/20 px-2 py-0.5 rounded-full">
                        {getServiceTitle(currentServiceId)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isPendingTransition || (!currentTime && bookings.length === 0)}
                  className="w-full bg-[#251101] dark:bg-white text-white dark:text-[#251101] text-[8px] md:text-[10px] font-serif py-6 uppercase tracking-[0.4em] rounded-full transition-all hover:tracking-[0.5em] disabled:opacity-20 flex items-center justify-center gap-4"
                >
                  {isPendingTransition ? (
                    <>
                      <ArrowPathIcon className="animate-spin h-3.5 w-3.5" /> Processing...
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
    <div className="group relative animate-in fade-in slide-in-from-bottom-2 duration-700 px-1">
      <label className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] mb-3 block font-serif">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full bg-transparent text-[15px] md:text-[16px] font-serif outline-none py-1.5 border-b border-zinc-100 dark:border-zinc-900 focus:border-zinc-300 transition-colors"
      />
    </div>
  )
}
