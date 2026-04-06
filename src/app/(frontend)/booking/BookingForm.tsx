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

  const isReschedule = searchParams.get('reschedule') === 'true'
  const rescheduleId = searchParams.get('id')
  const prefillServiceTitle = searchParams.get('service')
  const urlFn = searchParams.get('fn') || ''
  const urlSn = searchParams.get('sn') || ''
  const hasPrefillData = !!(initialData.email && initialData.fn)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  const matchedServiceId = useMemo(() => {
    if (!prefillServiceTitle) return ''
    const match = services.find((s) => s.title.toLowerCase() === prefillServiceTitle.toLowerCase())
    return match ? String(match.id) : ''
  }, [prefillServiceTitle, services])

  const [showModal, setShowModal] = useState(!hasPrefillData && !isReschedule)
  const [isExisting, setIsExisting] = useState<boolean | null>(null)
  const [wasVerifiedInSession, setWasVerifiedInSession] = useState(false)

  const [personalInfo, setPersonalInfo] = useState({
    firstName: initialData.fn || urlFn || '',
    surname: initialData.sn || urlSn || '',
    phone: initialData.ph || searchParams.get('ph') || '',
    email: initialData.email || searchParams.get('email') || '',
  })

  const [currentServiceId, setCurrentServiceId] = useState(
    matchedServiceId || searchParams.get('serviceId') || '',
  )
  const [extraServiceId, setExtraServiceId] = useState('')
  const [showExtraService, setShowExtraService] = useState(false)
  const [currentDate, setCurrentDate] = useState(searchParams.get('date') || '')
  const [currentTime, setCurrentTime] = useState(searchParams.get('time') || '')

  const [existingEmail, setExistingEmail] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [errorToast, setErrorToast] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [isPendingTransition, startTransition] = useTransition()
  const [state, formAction] = useActionState(createBookingAction, null)
  const [drawLine, setDrawLine] = useState(false)
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
  const availableMonths = useMemo(
    () => [...Array(6)].map((_, i) => dayjs(minSelectableDate).startOf('month').add(i, 'month')),
    [minSelectableDate],
  )
  const calendarGrid = useMemo(() => {
    const startOfMonth = viewDate.startOf('month')
    const startDay = startOfMonth.day()
    return [...Array(35)].map((_, i) => startOfMonth.subtract(startDay, 'day').add(i, 'day'))
  }, [viewDate])

  const isRecognized = isReschedule || hasPrefillData || wasVerifiedInSession
  const showIdentitySection = !isRecognized
  const identitySatisfied = isRecognized
    ? currentServiceId !== ''
    : personalInfo.firstName.trim().length > 0 && personalInfo.surname.trim().length > 0
  const showDateSection = identitySatisfied

  useEffect(() => {
    if (state?.error) setErrorToast(state.error)
  }, [state])
  useEffect(() => {
    if (!showModal) setTimeout(() => setDrawLine(true), 500)
  }, [showModal])

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
    setIsVerifying(true)
    setModalError(null)
    try {
      const data = await getCustomerByEmail(existingEmail.trim().toLowerCase())
      if (!data) {
        setModalError('No record found.')
        setIsVerifying(false)
        return
      }
      setPersonalInfo({
        firstName: data.firstName,
        surname: data.surname,
        email: data.email,
        phone: data.phone,
      })
      setWasVerifiedInSession(true)
      setShowModal(false)
      const params = new URLSearchParams(window.location.search)
      params.set('fn', data.firstName)
      params.set('sn', data.surname)
      params.set('email', data.email)
      params.set('ph', data.phone)
      router.replace(`${window.location.pathname}?${params.toString()}`)
    } catch {
      setModalError('Server error.')
      setIsVerifying(false)
    }
  }

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget as HTMLFormElement)
    if (isReschedule && rescheduleId) fd.append('rescheduleId', rescheduleId)
    startTransition(() => {
      if (isRecognized) {
        fd.set('firstName', personalInfo.firstName)
        fd.set('surname', personalInfo.surname)
        fd.append('email', personalInfo.email)
        fd.append('phone', personalInfo.phone)
      }
      fd.set('appointmentDate', `${currentDate}T${currentTime}:00`)
      formAction(fd)
    })
  }

  const getServiceTitle = (id: string) =>
    services.find((s) => String(s.id) === id)?.title || 'Service'
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

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-[#251101] dark:text-zinc-100 pt-24 md:pt-32 pb-32 px-4 md:px-8 selection:bg-zinc-100 font-sans">
      {errorToast && (
        <Notification message={errorToast} type="error" onClose={() => setErrorToast(null)} />
      )}
      {showModal && !isRecognized && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-xl p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#050505] p-10 md:p-16 border border-zinc-100 dark:border-zinc-900 rounded-2xl shadow-2xl text-center">
            {isExisting === null ? (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <p className="text-[8px] uppercase tracking-[0.5em] text-[#595f72] font-serif mb-4">
                  Registry Access
                </p>
                <h3 className="text-[24px] md:text-[32px] font-light mb-14 font-serif tracking-tighter leading-none">
                  Visited us before?
                </h3>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => setIsExisting(true)}
                    className="w-full py-5 bg-[#251101] dark:bg-white text-white dark:text-[#251101] text-[8px] uppercase tracking-[0.4em] font-serif rounded-full transition-all"
                  >
                    Yes, I am current Customer.
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full py-5 border border-zinc-100 text-[#595f72] text-[8px] uppercase tracking-[0.4em] font-serif rounded-full transition-all"
                  >
                    No, I&apos;m a new Customer.
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-[8px] uppercase tracking-[0.5em] text-[#595f72] font-serif mb-4">
                  Verification
                </p>
                <h3 className="text-[24px] font-serif font-light mb-4 tracking-tighter">
                  Confirm Email
                </h3>
                {modalError && (
                  <p className="text-[10px] text-red-500 mb-4 font-serif">{modalError}</p>
                )}
                <input
                  id="lookup-email"
                  name="lookupEmail"
                  type="email"
                  value={existingEmail}
                  onChange={(e) => setExistingEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-zinc-100 outline-none py-6 mb-12 text-center text-[18px] font-serif"
                  placeholder="email@example.com"
                />
                <button
                  onClick={handleLookup}
                  disabled={isVerifying}
                  className="w-full py-5 bg-[#251101] dark:bg-white text-white dark:text-[#251101] text-[9px] uppercase tracking-[0.4em] font-serif rounded-full mb-10"
                >
                  {isVerifying ? 'Searching...' : 'Access Records'}
                </button>
                <button
                  onClick={() => setIsExisting(null)}
                  className="text-[7px] uppercase tracking-[0.4em] text-[#595f72] font-serif"
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
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12">
            <div className="space-y-4 relative">
              <div
                className={`absolute -left-4 md:-left-8 top-0 w-[1px] bg-zinc-900 dark:bg-white transition-all duration-1000 origin-top ${drawLine ? 'h-full opacity-100' : 'h-0 opacity-0'}`}
              />
              <p className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                {isRecognized ? 'Registry Session' : 'Appointment'}
              </p>
              <h1 className="text-[28px] md:text-[48px] font-light tracking-tighter font-serif leading-none">
                {isReschedule ? 'Reschedule' : isRecognized ? 'New Session' : 'New Visit'}
              </h1>
            </div>
          </header>
          <form
            onSubmit={handleFinalSubmit}
            className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20"
          >
            <div className="lg:col-span-6 flex flex-col gap-10">
              <div className="bg-white dark:bg-[#050505] p-6 md:p-8 space-y-10 border border-zinc-100 dark:border-zinc-900 rounded-2xl shadow-sm">
                <div className="relative animate-in fade-in duration-700">
                  <label
                    htmlFor="service-select"
                    className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] mb-3 block font-serif"
                  >
                    Treatment
                  </label>
                  <Listbox value={currentServiceId} onChange={setCurrentServiceId}>
                    <div className="relative z-40">
                      <ListboxButton
                        id="service-select"
                        className="w-full bg-transparent text-[16px] font-serif text-left outline-none py-1.5 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between transition-colors focus:border-zinc-300"
                      >
                        <span className={`truncate ${!currentServiceId ? 'opacity-40' : ''}`}>
                          {currentServiceId
                            ? getServiceTitle(currentServiceId)
                            : 'Select Service...'}
                        </span>
                        <ChevronDownIcon className="w-3.5 h-3.5 text-[#595f72]" />
                      </ListboxButton>
                      <input type="hidden" name="serviceId" value={currentServiceId} />
                      <Transition
                        as={Fragment}
                        enter="transition duration-100 ease-out"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                      >
                        <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-2xl bg-white/95 dark:bg-[#050505]/95 backdrop-blur-2xl border border-zinc-100 py-2 shadow-2xl focus:outline-none">
                          {services.map((s) => (
                            <ListboxOption
                              key={s.id}
                              value={String(s.id)}
                              className={({ active }) =>
                                `cursor-pointer select-none py-4 px-6 ${active ? 'bg-zinc-50 dark:bg-zinc-900/50' : ''}`
                              }
                            >
                              <span className="block truncate text-[14px] font-serif">
                                {s.title}
                              </span>
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
                      <label
                        htmlFor="extra-service-select"
                        className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif"
                      >
                        Additional Treatment
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowExtraService(false)
                          setExtraServiceId('')
                        }}
                        className="text-[7px] text-[#d7263d] uppercase tracking-[0.2em] font-serif hover:underline"
                      >
                        [ Remove ]
                      </button>
                    </div>
                    <Listbox value={extraServiceId} onChange={setExtraServiceId}>
                      <div className="relative z-30">
                        <ListboxButton
                          id="extra-service-select"
                          className="w-full bg-transparent text-[16px] font-serif text-left outline-none py-1.5 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between transition-colors focus:border-zinc-300"
                        >
                          <span className={`truncate ${!extraServiceId ? 'opacity-40' : ''}`}>
                            {extraServiceId
                              ? getServiceTitle(extraServiceId)
                              : 'Select Additional Service...'}
                          </span>
                          <ChevronDownIcon className="w-3.5 h-3.5 text-[#595f72]" />
                        </ListboxButton>
                        <input type="hidden" name="extraServiceId" value={extraServiceId} />
                        <Transition
                          as={Fragment}
                          enter="transition duration-100 ease-out"
                          enterFrom="opacity-0 scale-95"
                          enterTo="opacity-100 scale-100"
                        >
                          <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-2xl bg-white/95 dark:bg-[#050505]/95 backdrop-blur-2xl border border-zinc-100 py-2 shadow-2xl focus:outline-none">
                            {services
                              .filter((s) => String(s.id) !== currentServiceId)
                              .map((s) => (
                                <ListboxOption
                                  key={s.id}
                                  value={String(s.id)}
                                  className={({ active }) =>
                                    `cursor-pointer select-none py-4 px-6 ${active ? 'bg-zinc-50 dark:bg-zinc-900/50' : ''}`
                                  }
                                >
                                  <span className="block truncate text-[14px] font-serif">
                                    {s.title}
                                  </span>
                                </ListboxOption>
                              ))}
                          </ListboxOptions>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>
                )}
                {showIdentitySection && currentServiceId !== '' && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <Field
                      id="first-name"
                      name="firstName"
                      label="First Name"
                      value={personalInfo.firstName}
                      onChange={(v) => setPersonalInfo({ ...personalInfo, firstName: v })}
                      placeholder="Juan"
                    />
                    <Field
                      id="surname"
                      name="surname"
                      label="Surname"
                      value={personalInfo.surname}
                      onChange={(v) => setPersonalInfo({ ...personalInfo, surname: v })}
                      placeholder="Dela Cruz"
                    />
                  </div>
                )}
                {showDateSection && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    <div className="relative">
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div className="space-y-1">
                          <label
                            htmlFor="calendar-date"
                            className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] block font-serif"
                          >
                            Clinic Calendar
                          </label>
                          <h3 className="text-[20px] md:text-[24px] font-serif font-light tracking-tighter leading-none">
                            {viewDate.format('MMMM YYYY')}
                          </h3>
                        </div>
                        <input type="hidden" id="calendar-date" name="date" value={currentDate} />
                        <div className="inline-flex items-center bg-zinc-50 dark:bg-zinc-900/50 p-1 rounded-full border border-zinc-100 dark:border-zinc-800/50 relative overflow-hidden">
                          <div
                            className="absolute top-1 bottom-1 w-[42px] md:w-[35px] bg-white dark:bg-zinc-800 rounded-full shadow-sm transition-transform duration-500"
                            style={{
                              transform: `translateX(${availableMonths.findIndex((m) => m.isSame(viewDate, 'month')) * 100}%)`,
                            }}
                          />
                          {availableMonths.map((m) => (
                            <button
                              key={m.format('MMM')}
                              type="button"
                              onClick={() => setViewDate(m)}
                              className={`relative z-10 w-[42px] md:w-[52px] py-1.5 text-[6px] md:text-[7px] uppercase tracking-[0.1em] font-medium font-serif ${viewDate.isSame(m, 'month') ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'}`}
                            >
                              {m.format('MMM')}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-px bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl overflow-hidden shadow-sm">
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
                              className={`relative h-14 md:h-20 flex flex-col items-center justify-center transition-all ${isSelected ? 'bg-[#251101] dark:bg-white z-10' : 'bg-white dark:bg-[#050505] hover:bg-zinc-50 dark:hover:bg-zinc-900/40'} ${!date.isSame(viewDate, 'month') ? 'opacity-[0.15]' : ''} ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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
                    {currentDate && (
                      <div className="relative animate-in fade-in slide-in-from-top-6 duration-700">
                        <label className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] block font-serif mb-6">
                          {loadingSlots ? 'Consulting Archive...' : 'Available Time Slots'}
                        </label>
                        <div className="grid grid-cols-3 gap-px bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl overflow-hidden">
                          {timeSlots.map((slot) => {
                            const isFull =
                              (currentDate === todayStr && slot <= manilaTimeNow) ||
                              busySlots.includes(slot)
                            const isSelected = currentTime === slot
                            return (
                              <button
                                key={slot}
                                type="button"
                                disabled={isFull || loadingSlots}
                                onClick={() => setCurrentTime(slot)}
                                className={`relative py-6 md:py-8 flex flex-col items-center justify-center gap-2 transition-all ${isSelected ? 'bg-[#251101] dark:bg-white text-white dark:text-[#251101]' : 'bg-white dark:bg-[#050505] hover:bg-zinc-50 dark:hover:bg-zinc-900/40'} ${isFull ? 'opacity-20 cursor-not-allowed' : 'hover:bg-zinc-50'}`}
                              >
                                {slot}
                              </button>
                            )
                          })}
                        </div>
                        <input type="hidden" name="time" value={currentTime} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="lg:col-span-6 flex flex-col gap-10">
              <div className="bg-[#251101] dark:bg-white text-white dark:text-[#251101] p-8 md:p-10 flex flex-col justify-between min-h-[260px] rounded-2xl relative overflow-hidden animate-in fade-in duration-700 shadow-xl">
                <div className="absolute top-0 left-0 w-full h-[1.5px] bg-[#48a9a6]/50" />
                <p className="text-[7px] uppercase tracking-[0.4em] opacity-60 font-serif">
                  {isRecognized ? 'Recognized Session' : 'Session Draft'}
                </p>
                <div className="space-y-4">
                  <h4 className="text-[20px] md:text-[24px] font-serif tracking-tight leading-none capitalize">
                    {isRecognized
                      ? `${personalInfo.firstName} ${personalInfo.surname}`
                      : `${personalInfo.firstName || 'New'} ${personalInfo.surname || 'Patient'}`}
                  </h4>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[12px] md:text-[14px] font-serif leading-none">
                        {getServiceTitle(currentServiceId)}
                      </span>
                      {showExtraService && extraServiceId && (
                        <span className="text-[12px] md:text-[14px] font-serif leading-none opacity-60">
                          + {getServiceTitle(extraServiceId)}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-serif tabular-nums opacity-60 italic">
                      {currentDate ? dayjs(currentDate).format('MMMM D, YYYY') : '--'} @{' '}
                      {currentTime || '--:--'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={isPendingTransition || !currentTime}
                className="w-full bg-[#251101] dark:bg-white text-white dark:text-[#251101] py-6 uppercase tracking-[0.4em] rounded-full text-[9px] font-serif transition-all active:scale-[0.98] disabled:opacity-20 shadow-lg"
              >
                {isPendingTransition
                  ? 'Processing...'
                  : isReschedule
                    ? 'Confirm Reschedule'
                    : 'Confirm Appointment'}
              </button>
            </div>
          </form>
        </div>
      </FadeIn>
    </div>
  )
}

function Field({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string
  name: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="group relative px-1">
      <label
        htmlFor={id}
        className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-[#595f72] mb-3 block font-serif"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full bg-transparent text-[15px] font-serif outline-none py-1.5 border-b border-zinc-100 dark:border-zinc-900 focus:border-zinc-300 transition-colors"
      />
    </div>
  )
}
