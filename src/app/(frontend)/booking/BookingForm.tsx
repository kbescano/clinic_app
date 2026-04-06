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
import {
  ChevronDownIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import dayjs from '@/lib/dayjs'
import { RegistrySkeleton } from '../components/RegistrySkeleton'

// --- TYPES ---
interface PersonalInfo {
  firstName: string
  surname: string
  phone: string
  email: string
}

interface BookingEntry extends PersonalInfo {
  isGuest: boolean
  serviceId: string
  extraServiceId: string
  date: string
  time: string
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

  const isReschedule = searchParams.get('reschedule') === 'true'
  const rescheduleId = searchParams.get('id')
  const hasPrefillData = !!(initialData.email && initialData.fn)

  // --- REGISTRY STATE ---
  const [bookings, setBookings] = useState<BookingEntry[]>([])
  const [isDraftingPerson, setIsDraftingPerson] = useState(true)
  const [wasVerifiedInSession, setWasVerifiedInSession] = useState(false)

  const [showModal, setShowModal] = useState(!hasPrefillData && !isReschedule)
  const [isExisting, setIsExisting] = useState<boolean | null>(null)

  // --- DRAFT STATE ---
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: initialData.fn || searchParams.get('fn') || '',
    surname: initialData.sn || searchParams.get('sn') || '',
    phone: initialData.ph || searchParams.get('ph') || '',
    email: initialData.email || searchParams.get('email') || '',
  })
  const [currentServiceId, setCurrentServiceId] = useState('')
  const [extraServiceId, setExtraServiceId] = useState('')
  const [showExtraService, setShowExtraService] = useState(false)
  const [currentDate, setCurrentDate] = useState('')
  const [currentTime, setCurrentTime] = useState('')

  const [existingEmail, setExistingEmail] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [errorToast, setErrorToast] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [isPendingTransition, startTransition] = useTransition()
  const [state, formAction] = useActionState(createBookingAction, null)
  const [busySlots, setBusySlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [touched, setTouched] = useState({ email: false, phone: false })

  // --- LOGIC CONSTANTS ---
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneRegex = /^\d{10,}$/
  const isEmailValid = emailRegex.test(personalInfo.email)
  const isPhoneValid = phoneRegex.test(personalInfo.phone.replace(/\D/g, ''))

  const isRecognized = isReschedule || hasPrefillData || wasVerifiedInSession
  const isGuestMode = bookings.length > 0

  const showMainIdentity = !isRecognized && !isGuestMode
  const identitySatisfied = isGuestMode
    ? personalInfo.firstName.trim() !== '' && personalInfo.surname.trim() !== ''
    : isRecognized
      ? true
      : personalInfo.firstName.trim() !== '' &&
        personalInfo.surname.trim() !== '' &&
        isEmailValid &&
        isPhoneValid

  const showDateSection = !isGuestMode && currentServiceId !== '' && identitySatisfied
  const showTimeOnlySection = isGuestMode && currentServiceId !== '' && identitySatisfied
  const isCurrentDraftValid = currentServiceId !== '' && currentDate !== '' && currentTime !== ''

  const { todayStr, manilaTimeNow, minSelectableDate } = useMemo(() => {
    const nowPHT = dayjs().tz('Asia/Manila')
    return {
      todayStr: nowPHT.format('YYYY-MM-DD'),
      manilaTimeNow: nowPHT.format('HH:mm'),
      minSelectableDate:
        nowPHT.hour() >= 15
          ? nowPHT.add(1, 'day').format('YYYY-MM-DD')
          : nowPHT.format('YYYY-MM-DD'),
    }
  }, [])

  const [viewDate, setViewDate] = useState(dayjs(minSelectableDate).startOf('month'))
  const calendarGrid = useMemo(() => {
    const startOfMonth = viewDate.startOf('month')
    const startDay = startOfMonth.day()
    return [...Array(35)].map((_, i) => startOfMonth.subtract(startDay, 'day').add(i, 'day'))
  }, [viewDate])

  const localBusySlots = useMemo(
    () => bookings.filter((b) => b.date === currentDate).map((b) => b.time),
    [bookings, currentDate],
  )

  useEffect(() => {
    if (state?.error) setErrorToast(state.error)
  }, [state])

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

  // --- HANDLERS ---
  const handleEditEntry = (index: number) => {
    const entry = bookings[index]
    setPersonalInfo({
      firstName: entry.firstName,
      surname: entry.surname,
      email: entry.email,
      phone: entry.phone,
    })
    setCurrentServiceId(entry.serviceId)
    setExtraServiceId(entry.extraServiceId)
    setShowExtraService(!!entry.extraServiceId)
    setCurrentDate(entry.date)
    setCurrentTime(entry.time)
    setBookings(bookings.filter((_, i) => i !== index))
    setIsDraftingPerson(true)
  }

  const handleAddPerson = () => {
    const entry: BookingEntry = {
      isGuest: bookings.length > 0,
      ...personalInfo,
      serviceId: currentServiceId,
      extraServiceId,
      date: currentDate,
      time: currentTime,
    }
    setBookings([...bookings, entry])
    const sharedDate = bookings.length === 0 ? currentDate : bookings[0].date
    setCurrentServiceId('')
    setExtraServiceId('')
    setShowExtraService(false)
    setCurrentTime('')
    setCurrentDate(sharedDate)
    setPersonalInfo((prev) => ({ ...prev, firstName: '', surname: '' }))
    setIsDraftingPerson(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    if (isReschedule && rescheduleId) fd.append('rescheduleId', rescheduleId)
    startTransition(() => {
      const finalRegistry = [...bookings]
      if (isDraftingPerson && isCurrentDraftValid) {
        finalRegistry.push({
          isGuest: bookings.length > 0,
          ...personalInfo,
          serviceId: currentServiceId,
          extraServiceId,
          date: currentDate,
          time: currentTime,
        })
      }
      finalRegistry.forEach((b) => {
        fd.append('firstName', b.firstName)
        fd.append('surname', b.surname)
        fd.append('email', b.email)
        fd.append('phone', b.phone)
        fd.append('serviceId', b.serviceId)
        fd.append('appointmentDate', `${b.date}T${b.time}:00`)
        if (b.isGuest) fd.append('isGuest', 'true')
        if (b.extraServiceId) {
          fd.append('firstName', b.firstName)
          fd.append('surname', b.surname)
          fd.append('email', b.email)
          fd.append('phone', b.phone)
          fd.append('serviceId', b.extraServiceId)
          fd.append('appointmentDate', `${b.date}T${b.time}:00`)
          if (b.isGuest) fd.append('isGuest', 'true')
        }
      })
      formAction(fd)
    })
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-[#251101] dark:text-zinc-100 pt-24 md:pt-32 pb-32 px-4 md:px-8 font-sans">
      {errorToast && (
        <Notification message={errorToast} type="error" onClose={() => setErrorToast(null)} />
      )}

      {showModal && !isRecognized && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-xl p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#050505] p-10 border border-zinc-100 dark:border-zinc-900 rounded-2xl shadow-2xl text-center">
            {isExisting === null ? (
              <div className="animate-in fade-in zoom-in-95 duration-500 font-serif">
                <h3 className="text-[24px] md:text-[32px] font-light mb-14 tracking-tighter text-[#251101] dark:text-white leading-none">
                  Visited us before?
                </h3>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => setIsExisting(true)}
                    className="w-full py-5 bg-[#251101] dark:bg-white text-white dark:text-[#251101] text-[8px] uppercase tracking-[0.4em] rounded-full transition-all"
                  >
                    Yes, I am current Customer.
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full py-5 border border-zinc-100 dark:border-zinc-900 text-[#595f72] text-[8px] uppercase tracking-[0.4em] rounded-full transition-all"
                  >
                    No, I&apos;m a new Customer.
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 font-serif">
                <h3 className="text-[24px] font-light mb-4 tracking-tighter text-[#251101] dark:text-white">
                  Confirm Email
                </h3>
                <input
                  type="email"
                  value={existingEmail}
                  onChange={(e) => setExistingEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-zinc-100 dark:border-zinc-900 outline-none py-6 mb-12 text-center text-[18px]"
                  placeholder="email@example.com"
                />
                <button
                  onClick={() => {
                    setIsVerifying(true)
                    getCustomerByEmail(existingEmail.trim().toLowerCase())
                      .then((d) => {
                        if (!d) {
                          setModalError('No record found.')
                          setIsVerifying(false)
                        } else {
                          setPersonalInfo({
                            firstName: d.firstName,
                            surname: d.surname,
                            email: d.email,
                            phone: d.phone,
                          })
                          setWasVerifiedInSession(true)
                          setShowModal(false)
                        }
                      })
                      .catch(() => {
                        setModalError('Server error.')
                        setIsVerifying(false)
                      })
                  }}
                  disabled={isVerifying}
                  className="w-full py-5 bg-[#251101] dark:bg-white text-white dark:text-[#251101] text-[9px] uppercase tracking-[0.4em] rounded-full mb-10"
                >
                  {isVerifying ? 'Searching...' : 'Access Records'}
                </button>
                <button
                  onClick={() => setIsExisting(null)}
                  className="text-[7px] uppercase tracking-[0.4em] text-[#595f72]"
                >
                  [ Return ]
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <FadeIn>
        <div className="max-w-4xl mx-auto flex flex-col gap-14">
          <header className="flex items-end justify-between border-b border-zinc-100 dark:border-zinc-900 pb-8">
            <h1 className="text-[32px] md:text-[48px] font-light tracking-tighter font-serif leading-none text-[#251101] dark:text-white">
              {isReschedule
                ? 'Reschedule'
                : isGuestMode && isDraftingPerson
                  ? 'Guest Registry'
                  : 'Appointment Registry'}
            </h1>
          </header>

          <form
            onSubmit={handleFinalSubmit}
            className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20"
          >
            <div className="lg:col-span-6 flex flex-col gap-10">
              <div className="bg-white dark:bg-[#050505] p-6 md:p-8 space-y-10 border border-zinc-100 dark:border-zinc-900 rounded-2xl shadow-sm relative">
                {isGuestMode && isDraftingPerson && (
                  <button
                    type="button"
                    onClick={() => setIsDraftingPerson(false)}
                    className="absolute top-6 left-6 p-2 text-[#595f72] hover:text-[#251101] dark:hover:text-white transition-colors"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                  </button>
                )}

                <div className="relative pt-8 animate-in fade-in">
                  <label className="text-[9px] uppercase tracking-[0.4em] text-[#595f72] mb-3 block font-serif">
                    Treatment
                  </label>
                  <Listbox value={currentServiceId} onChange={setCurrentServiceId}>
                    <div className="relative z-40">
                      <ListboxButton className="w-full text-left font-serif text-[16px] py-1.5 border-b border-zinc-100 dark:border-zinc-900 outline-none flex justify-between group transition-colors focus:border-zinc-400">
                        <span className={!currentServiceId ? 'opacity-40' : ''}>
                          {currentServiceId
                            ? getServiceTitle(currentServiceId)
                            : 'Select Service...'}
                        </span>
                        <ChevronDownIcon className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                      </ListboxButton>
                      <Transition as={Fragment} leave="transition duration-100" leaveTo="opacity-0">
                        <ListboxOptions className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-xl bg-white dark:bg-[#0c0c0c] border border-zinc-100 dark:border-zinc-900 shadow-2xl">
                          {services.map((s) => (
                            <ListboxOption
                              key={s.id}
                              value={String(s.id)}
                              className={({ active }) =>
                                `cursor-pointer py-4 px-6 text-[14px] font-serif ${active ? 'bg-zinc-50 dark:bg-zinc-900' : ''}`
                              }
                            >
                              {s.title}
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
                      className="mt-4 text-[7px] uppercase tracking-[0.3em] text-[#595f72] font-serif hover:text-[#251101] animate-in fade-in"
                    >
                      + Add second service
                    </button>
                  )}
                </div>

                {showExtraService && (
                  <div className="relative animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between mb-3 font-serif">
                      <label className="text-[9px] uppercase tracking-[0.4em] text-[#595f72]">
                        Additional Treatment
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowExtraService(false)
                          setExtraServiceId('')
                        }}
                        className="text-[7px] text-[#d7263d] uppercase tracking-[0.2em] hover:underline"
                      >
                        [ Remove ]
                      </button>
                    </div>
                    <Listbox value={extraServiceId} onChange={setExtraServiceId}>
                      <div className="relative z-30">
                        <ListboxButton className="w-full text-left font-serif text-[16px] py-1.5 border-b border-zinc-100 dark:border-zinc-900 outline-none flex justify-between group transition-colors focus:border-zinc-400">
                          <span className={!extraServiceId ? 'opacity-40' : ''}>
                            {extraServiceId
                              ? getServiceTitle(extraServiceId)
                              : 'Select Additional Service...'}
                          </span>
                          <ChevronDownIcon className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                        </ListboxButton>
                        <Transition
                          as={Fragment}
                          leave="transition duration-100"
                          leaveTo="opacity-0"
                        >
                          <ListboxOptions className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-xl bg-white dark:bg-[#0c0c0c] border border-zinc-100 dark:border-zinc-900 shadow-2xl">
                            {services
                              .filter((s) => String(s.id) !== currentServiceId)
                              .map((s) => (
                                <ListboxOption
                                  key={s.id}
                                  value={String(s.id)}
                                  className={({ active }) =>
                                    `cursor-pointer py-4 px-6 text-[14px] font-serif ${active ? 'bg-zinc-50 dark:bg-zinc-900' : ''}`
                                  }
                                >
                                  {s.title}
                                </ListboxOption>
                              ))}
                          </ListboxOptions>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>
                )}

                {(isGuestMode || !isRecognized) && currentServiceId && (
                  <div className="grid grid-cols-1 gap-10 animate-in fade-in">
                    <Field
                      label="First Name"
                      value={personalInfo.firstName}
                      onChange={(v: string) => setPersonalInfo({ ...personalInfo, firstName: v })}
                      placeholder="Juan"
                    />
                    {personalInfo.firstName.trim().length > 0 && (
                      <Field
                        label="Surname"
                        value={personalInfo.surname}
                        onChange={(v: string) => setPersonalInfo({ ...personalInfo, surname: v })}
                        placeholder="Dela Cruz"
                      />
                    )}
                    {showMainIdentity && personalInfo.surname.trim().length > 0 && (
                      <>
                        <Field
                          label="Email Address"
                          type="email"
                          value={personalInfo.email}
                          onChange={(v) => {
                            setPersonalInfo({ ...personalInfo, email: v })
                            setTouched({ ...touched, email: false })
                          }}
                          onBlur={() => setTouched({ ...touched, email: true })}
                          placeholder="juan@example.com"
                          error={touched.email && !isEmailValid ? 'Invalid email format' : ''}
                        />
                        {isEmailValid && (
                          <Field
                            label="Mobile Number"
                            type="tel"
                            value={personalInfo.phone}
                            onChange={(v) => {
                              setPersonalInfo({ ...personalInfo, phone: v })
                              setTouched({ ...touched, phone: false })
                            }}
                            onBlur={() => setTouched({ ...touched, phone: true })}
                            placeholder="0917 123 4567"
                            error={touched.phone && !isPhoneValid ? 'Min 10 digits required' : ''}
                          />
                        )}
                      </>
                    )}
                  </div>
                )}

                {showDateSection && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                    <div className="relative">
                      <h3 className="text-[20px] font-serif font-light mb-8 text-[#251101] dark:text-white">
                        {viewDate.format('MMMM YYYY')}
                      </h3>
                      <div className="grid grid-cols-7 gap-px bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-900">
                        {calendarGrid.map((date, i) => {
                          const dateStr = date.format('YYYY-MM-DD')
                          const isSelected = currentDate === dateStr
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
                              className={`h-12 flex items-center justify-center font-serif text-[13px] ${isSelected ? 'bg-[#251101] text-white' : 'bg-white dark:bg-[#050505] hover:bg-zinc-50 dark:hover:bg-zinc-900 text-[#251101] dark:text-zinc-100'} ${isDisabled ? 'opacity-10 cursor-not-allowed' : ''}`}
                            >
                              {date.date()}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    {currentDate && (
                      <div className="grid grid-cols-3 gap-px bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden animate-in fade-in border border-zinc-100 dark:border-zinc-900">
                        {timeSlots.map((slot) => {
                          const isFull =
                            (currentDate === todayStr && slot <= manilaTimeNow) ||
                            busySlots.includes(slot) ||
                            localBusySlots.includes(slot)
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={isFull}
                              onClick={() => setCurrentTime(slot)}
                              className={`py-6 text-[14px] font-serif transition-all ${currentTime === slot ? 'bg-[#251101] text-white' : 'bg-white dark:bg-[#050505] hover:bg-zinc-50 dark:hover:bg-zinc-900 text-[#251101] dark:text-zinc-100'}${isFull ? ' opacity-20 cursor-not-allowed' : ''}`}
                            >
                              {slot}
                            </button>
                          )
                        })}
                      </div>
                    )}
                    {currentTime && !isReschedule && (
                      <button
                        type="button"
                        onClick={handleAddPerson}
                        className="w-full py-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-[8px] uppercase tracking-[0.4em] text-[#595f72] hover:text-[#251101] dark:hover:text-white transition-all font-serif hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      >
                        + Save and add guest
                      </button>
                    )}
                  </div>
                )}

                {showTimeOnlySection && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <label className="text-[9px] uppercase tracking-[0.4em] text-[#595f72] block font-serif">
                      Available Slots for {dayjs(currentDate).format('MMM D')}
                    </label>
                    <div className="grid grid-cols-3 gap-px bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-900">
                      {timeSlots.map((slot) => {
                        const isFull =
                          (currentDate === todayStr && slot <= manilaTimeNow) ||
                          busySlots.includes(slot) ||
                          localBusySlots.includes(slot)
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isFull}
                            onClick={() => setCurrentTime(slot)}
                            className={`py-6 text-[14px] font-serif transition-all ${currentTime === slot ? 'bg-[#251101] text-white' : 'bg-white dark:bg-[#050505] hover:bg-zinc-50 dark:hover:bg-zinc-900 text-[#251101] dark:text-zinc-100'}${isFull ? ' opacity-20 cursor-not-allowed' : ''}`}
                          >
                            {slot}
                          </button>
                        )
                      })}
                    </div>
                    {currentTime && (
                      <button
                        type="button"
                        onClick={handleAddPerson}
                        className="w-full py-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-[8px] uppercase tracking-[0.4em] text-[#595f72] hover:text-[#251101] dark:hover:text-white transition-all font-serif hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      >
                        + Save and add guest
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col gap-10">
              <div className="bg-[#251101] dark:bg-white text-white dark:text-[#251101] p-8 md:p-10 min-h-[300px] rounded-2xl shadow-xl flex flex-col font-serif">
                <p className="text-[7px] uppercase tracking-[0.4em] opacity-40 font-serif mb-10">
                  Registry Summary
                </p>
                <div className="space-y-8 flex-1">
                  {bookings.map((b, i) => (
                    <div
                      key={i}
                      className="pb-6 border-b border-white/10 dark:border-[#251101]/10 flex justify-between items-start"
                    >
                      <div className="space-y-1">
                        <h4 className="text-[16px] font-serif capitalize">
                          {b.firstName} {b.surname}
                        </h4>
                        <p className="text-[11px] opacity-70 italic">
                          {getServiceTitle(b.serviceId)}{' '}
                          {b.extraServiceId && `+ ${getServiceTitle(b.extraServiceId)}`} —{' '}
                          {dayjs(b.date).format('MMM D, YYYY')} @ {b.time}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEditEntry(i)}
                        className="p-1 hover:bg-white/10 dark:hover:bg-[#251101]/10 rounded transition-colors"
                      >
                        <PencilSquareIcon className="w-4 h-4 opacity-40" />
                      </button>
                    </div>
                  ))}
                  {isDraftingPerson && (
                    <div className="animate-in fade-in">
                      <h4 className="text-[20px] md:text-[24px] font-serif capitalize leading-none">
                        {personalInfo.firstName || personalInfo.surname
                          ? `${personalInfo.firstName} ${personalInfo.surname}`
                          : isRecognized && !isGuestMode
                            ? 'Recognized Session'
                            : 'New Patient'}
                      </h4>
                      <div className="mt-4 flex flex-col gap-2">
                        <span className="text-[13px] font-serif">
                          {currentServiceId ? getServiceTitle(currentServiceId) : '-- Treatment'}{' '}
                          {extraServiceId && `+ ${getServiceTitle(extraServiceId)}`}
                        </span>
                        <span className="text-[11px] font-serif opacity-60 italic">
                          {currentDate ? dayjs(currentDate).format('MMMM D, YYYY') : '--'} @{' '}
                          {currentTime || '--:--'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {!isDraftingPerson && isGuestMode && (
                  <button
                    type="button"
                    onClick={() => setIsDraftingPerson(true)}
                    className="w-full py-5 bg-[#251101] dark:bg-white text-white dark:text-[#251101] rounded-full text-[9px] uppercase tracking-[0.3em] font-serif flex items-center justify-center gap-3"
                  >
                    Continue to Registry <ArrowRightIcon className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isPendingTransition || (bookings.length === 0 && !isCurrentDraftValid)}
                  className="w-full bg-[#251101] dark:bg-white text-white dark:text-[#251101] py-7 uppercase tracking-[0.4em] rounded-full text-[9px] font-serif transition-all active:scale-[0.98] disabled:opacity-20 shadow-lg flex items-center justify-center gap-3"
                >
                  {isPendingTransition ? 'Processing...' : 'Confirm Appointment'}{' '}
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </FadeIn>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = 'text',
  error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  placeholder: string
  type?: string
  error?: string
}) {
  return (
    <div className="group relative">
      <label
        className={`text-[9px] uppercase tracking-[0.4em] block font-serif mb-3 ${error ? 'text-red-500' : 'text-[#595f72]'}`}
      >
        {label} {error && <span className="normal-case opacity-60 ml-2">({error})</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full bg-transparent text-[16px] font-serif outline-none py-1.5 border-b transition-colors text-[#251101] dark:text-white ${error ? 'border-red-500' : 'border-zinc-100 dark:border-zinc-900 focus:border-zinc-400'}`}
      />
    </div>
  )
}
