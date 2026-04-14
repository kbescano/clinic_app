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
import { useSearchParams } from 'next/navigation'
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
import { ChevronDownIcon, ArrowRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import dayjs from '@/lib/dayjs'
import { RegistrySkeleton } from '../components/RegistrySkeleton'

// --- TYPES ---
interface BookingEntry {
  isGuest: boolean
  firstName: string
  surname: string
  phone: string
  email: string
  serviceId: string
  extraServiceId: string
  showExtraService?: boolean
  date: string
  time: string
}

// 1. Move Regex outside to prevent useMemo dependency warnings and unnecessary re-creations
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^(09|639)\d{9}$/

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
  // 2. Removed 'router' since redirects are handled by the Server Action
  const searchParams = useSearchParams()

  const isReschedule = searchParams.get('reschedule') === 'true'
  const rescheduleId = searchParams.get('id')
  const hasPrefillData = !!(initialData.email && initialData.fn)

  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [bookings, setBookings] = useState<BookingEntry[]>([
    {
      isGuest: false,
      firstName: initialData.fn || searchParams.get('fn') || '',
      surname: initialData.sn || searchParams.get('sn') || '',
      phone: initialData.ph || searchParams.get('ph') || '',
      email: initialData.email || searchParams.get('email') || '',
      serviceId: searchParams.get('serviceId') || '',
      extraServiceId: '',
      showExtraService: false,
      date: '',
      time: '',
    },
  ])

  const activeBooking = bookings[activeTabIndex] || bookings[0]

  // 3. Replaced 'any' with strict value typing
  const updateActiveBooking = (field: keyof BookingEntry, value: string | boolean) => {
    setBookings((prev) => {
      const next = [...prev]
      next[activeTabIndex] = { ...next[activeTabIndex], [field]: value }

      if (activeTabIndex === 0 && field === 'date') {
        for (let i = 1; i < next.length; i++) {
          next[i].date = value as string
          next[i].time = ''
        }
      }
      return next
    })
  }

  const handleDeleteGuest = (e: React.MouseEvent, indexToDelete: number) => {
    e.stopPropagation()
    setBookings((prev) => prev.filter((_, i) => i !== indexToDelete))

    if (activeTabIndex === indexToDelete) {
      setActiveTabIndex(indexToDelete - 1)
    } else if (activeTabIndex > indexToDelete) {
      setActiveTabIndex(activeTabIndex - 1)
    }
  }

  const [wasVerifiedInSession, setWasVerifiedInSession] = useState(false)
  const [showModal, setShowModal] = useState(!hasPrefillData && !isReschedule)
  const [isExisting, setIsExisting] = useState<boolean | null>(null)

  const [existingEmail, setExistingEmail] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [errorToast, setErrorToast] = useState<string | null>(null)

  // 4. Removed unused 'modalError' and 'loadingSlots' state destructures
  const [, setModalError] = useState<string | null>(null)
  const [isPendingTransition, startTransition] = useTransition()
  const [state, formAction] = useActionState(createBookingAction, null)
  const [busySlots, setBusySlots] = useState<string[]>([])
  const [, setLoadingSlots] = useState(false)
  const [touched, setTouched] = useState({ email: false, phone: false })

  const isEmailValid = EMAIL_REGEX.test(activeBooking.email.trim())
  const isPhoneValid = PHONE_REGEX.test(activeBooking.phone.replace(/\D/g, ''))

  const isRecognized = isReschedule || hasPrefillData || wasVerifiedInSession
  const isPrimaryDraft = activeTabIndex === 0

  const showMainIdentity = !isRecognized && isPrimaryDraft
  const identitySatisfied = !isPrimaryDraft
    ? activeBooking.firstName.trim() !== '' && activeBooking.surname.trim() !== ''
    : isRecognized
      ? true
      : activeBooking.firstName.trim() !== '' &&
        activeBooking.surname.trim() !== '' &&
        isEmailValid &&
        isPhoneValid

  const showDateSection = isPrimaryDraft && activeBooking.serviceId !== '' && identitySatisfied
  const showTimeOnlySection = !isPrimaryDraft && activeBooking.serviceId !== '' && identitySatisfied

  const isAllValid = useMemo(() => {
    return bookings.every((b, i) => {
      const identityOk =
        i === 0
          ? isRecognized ||
            (b.firstName.trim() !== '' &&
              b.surname.trim() !== '' &&
              EMAIL_REGEX.test(b.email.trim()) &&
              PHONE_REGEX.test(b.phone.replace(/\D/g, '')))
          : b.firstName.trim() !== '' && b.surname.trim() !== ''

      return identityOk && b.serviceId && b.date && b.time
    })
  }, [bookings, isRecognized])

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

  // 5. Removed unused 'setViewDate' setter
  const [viewDate] = useState(dayjs(minSelectableDate).startOf('month'))
  const calendarGrid = useMemo(() => {
    const startOfMonth = viewDate.startOf('month')
    const startDay = startOfMonth.day()
    return [...Array(35)].map((_, i) => startOfMonth.subtract(startDay, 'day').add(i, 'day'))
  }, [viewDate])

  const localBusySlots = useMemo(
    () =>
      bookings
        .filter((b, i) => i !== activeTabIndex && b.date === activeBooking.date)
        .map((b) => b.time),
    [bookings, activeBooking.date, activeTabIndex],
  )

  const getServiceTitle = useMemo(() => {
    return (id: string) => services.find((s) => String(s.id) === id)?.title || 'Service'
  }, [services])

  useEffect(() => {
    if (state?.error) setErrorToast(state.error)
  }, [state])

  useEffect(() => {
    async function updateAvailability() {
      if (activeBooking.date) {
        setLoadingSlots(true)
        const taken = await getBusySlots(activeBooking.date)
        setBusySlots(taken)
        setLoadingSlots(false)
      }
    }
    updateAvailability()
  }, [activeBooking.date])

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

  const handleAddPerson = () => {
    const sharedDate = bookings[0].date
    setBookings((prev) => [
      ...prev,
      {
        isGuest: true,
        firstName: '',
        surname: '',
        phone: '',
        email: '',
        serviceId: '',
        extraServiceId: '',
        showExtraService: false,
        date: sharedDate,
        time: '',
      },
    ])
    setActiveTabIndex(bookings.length)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAllValid) return

    const fd = new FormData()
    const params = new URLSearchParams()
    params.append('date', dayjs(bookings[0].date).format('MMMM D, YYYY'))
    params.append('time', bookings[0].time)
    params.append('fn', bookings[0].firstName)
    params.append('sn', bookings[0].surname)

    const serviceTitles = []
    if (bookings[0].serviceId) serviceTitles.push(getServiceTitle(bookings[0].serviceId))
    if (bookings[0].extraServiceId) serviceTitles.push(getServiceTitle(bookings[0].extraServiceId))
    params.append('service', serviceTitles.join(' + '))

    // 6. Removed unused 'guestNames' variable assignment
    bookings.slice(1).forEach((b) => {
      const gName = `${b.firstName} ${b.surname}`
      const gServices = []
      if (b.serviceId) gServices.push(getServiceTitle(b.serviceId))
      if (b.extraServiceId) gServices.push(getServiceTitle(b.extraServiceId))

      const formattedGuestDetails = `${gName} — ${gServices.join(' + ')}`
      params.append('guests', formattedGuestDetails)
    })

    fd.append('redirectQuery', params.toString())
    if (isReschedule && rescheduleId) fd.append('rescheduleId', rescheduleId)

    startTransition(() => {
      bookings.forEach((b) => {
        const submitEmail = b.isGuest ? bookings[0].email : b.email
        const submitPhone = b.isGuest ? bookings[0].phone : b.phone

        fd.append('firstName', b.firstName)
        fd.append('surname', b.surname)
        fd.append('email', submitEmail)
        fd.append('phone', submitPhone)
        fd.append('serviceId', b.serviceId)
        fd.append('appointmentDate', `${b.date}T${b.time}:00`)
        if (b.isGuest) fd.append('isGuest', 'true')

        if (b.extraServiceId) {
          fd.append('firstName', b.firstName)
          fd.append('surname', b.surname)
          fd.append('email', submitEmail)
          fd.append('phone', submitPhone)
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
          <div className="w-[400px] max-w-lg bg-white dark:bg-[#050505] p-10 border border-zinc-100 dark:border-zinc-900 rounded-2xl shadow-2xl text-center">
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
                          setBookings((prev) => {
                            const next = [...prev]
                            next[0] = {
                              ...next[0],
                              firstName: d.firstName,
                              surname: d.surname,
                              email: d.email,
                              phone: d.phone,
                            }
                            return next
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
                  disabled={isVerifying || !EMAIL_REGEX.test(existingEmail.trim())}
                  className="w-full py-5 bg-[#251101] dark:bg-white text-white dark:text-[#251101] text-[9px] uppercase tracking-[0.4em] rounded-full mb-10 disabled:opacity-20"
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
              {isReschedule ? 'Reschedule' : 'Appointment Registry'}
            </h1>
          </header>

          <form
            onSubmit={handleFinalSubmit}
            className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20"
          >
            <div className="lg:col-span-6 flex flex-col">
              {/* TABS HEADER */}
              <div className="flex overflow-x-auto border-b border-zinc-100 dark:border-zinc-900 mb-8 gap-8 scrollbar-hide">
                {bookings.map((b, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 pb-3 border-b transition-colors whitespace-nowrap ${
                      activeTabIndex === i
                        ? 'border-[#251101] dark:border-white text-[#251101] dark:text-white'
                        : 'border-transparent text-[#595f72] hover:text-[#251101] dark:hover:text-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveTabIndex(i)}
                      className="text-[10px] uppercase tracking-[0.2em] font-serif outline-none"
                    >
                      {i === 0 ? 'Main Patient' : `Guest ${i}`}
                    </button>
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteGuest(e, i)}
                        className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 opacity-40 hover:opacity-100 transition-all outline-none"
                        title="Remove guest"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* ACTIVE TAB CONTENT */}
              <div className="bg-white dark:bg-[#050505] p-6 md:p-8 space-y-10 border border-zinc-100 dark:border-zinc-900 rounded-2xl shadow-sm relative">
                <div className="relative animate-in fade-in">
                  <label className="text-[9px] uppercase tracking-[0.4em] text-[#595f72] mb-3 block font-serif">
                    Treatment
                  </label>
                  <Listbox
                    value={activeBooking.serviceId}
                    onChange={(v) => updateActiveBooking('serviceId', v)}
                  >
                    <div className="relative z-40">
                      <ListboxButton className="w-full text-left font-serif text-[16px] py-1.5 border-b border-zinc-100 dark:border-zinc-900 outline-none flex justify-between group transition-colors focus:border-zinc-400">
                        <span className={!activeBooking.serviceId ? 'opacity-40' : ''}>
                          {activeBooking.serviceId
                            ? getServiceTitle(activeBooking.serviceId)
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
                  {activeBooking.serviceId && !activeBooking.showExtraService && (
                    <button
                      type="button"
                      onClick={() => updateActiveBooking('showExtraService', true)}
                      className="mt-4 text-[7px] uppercase tracking-[0.3em] text-[#595f72] font-serif hover:text-[#251101] animate-in fade-in"
                    >
                      + Add second service
                    </button>
                  )}
                </div>

                {activeBooking.showExtraService && (
                  <div className="relative animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between mb-3 font-serif">
                      <label className="text-[9px] uppercase tracking-[0.4em] text-[#595f72]">
                        Additional Treatment
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          updateActiveBooking('showExtraService', false)
                          updateActiveBooking('extraServiceId', '')
                        }}
                        className="text-[7px] text-[#d7263d] uppercase tracking-[0.2em] hover:underline"
                      >
                        [ Remove ]
                      </button>
                    </div>
                    <Listbox
                      value={activeBooking.extraServiceId}
                      onChange={(v) => updateActiveBooking('extraServiceId', v)}
                    >
                      <div className="relative z-30">
                        <ListboxButton className="w-full text-left font-serif text-[16px] py-1.5 border-b border-zinc-100 dark:border-zinc-900 outline-none flex justify-between group transition-colors focus:border-zinc-400">
                          <span className={!activeBooking.extraServiceId ? 'opacity-40' : ''}>
                            {activeBooking.extraServiceId
                              ? getServiceTitle(activeBooking.extraServiceId)
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
                              .filter((s) => String(s.id) !== activeBooking.serviceId)
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

                {/* DYNAMIC IDENTITY FORM */}
                {(!isPrimaryDraft || !isRecognized) && activeBooking.serviceId && (
                  <div className="grid grid-cols-1 gap-10 animate-in fade-in">
                    <Field
                      label="First Name"
                      value={activeBooking.firstName}
                      onChange={(v: string) => updateActiveBooking('firstName', v)}
                      placeholder="Juan"
                    />
                    {activeBooking.firstName.trim().length > 0 && (
                      <Field
                        label="Surname"
                        value={activeBooking.surname}
                        onChange={(v: string) => updateActiveBooking('surname', v)}
                        placeholder="Dela Cruz"
                      />
                    )}
                    {showMainIdentity && activeBooking.surname.trim().length > 0 && (
                      <>
                        <Field
                          label="Email Address"
                          type="email"
                          value={activeBooking.email}
                          onChange={(v) => {
                            updateActiveBooking('email', v)
                            setTouched({ ...touched, email: false })
                          }}
                          onBlur={() => setTouched({ ...touched, email: true })}
                          placeholder="juan@example.com"
                          error={
                            touched.email && !EMAIL_REGEX.test(activeBooking.email.trim())
                              ? 'Invalid email format'
                              : ''
                          }
                        />
                        {isEmailValid && (
                          <Field
                            label="Mobile Number"
                            type="tel"
                            value={activeBooking.phone}
                            onChange={(v) => {
                              updateActiveBooking('phone', v)
                              setTouched({ ...touched, phone: false })
                            }}
                            onBlur={() => setTouched({ ...touched, phone: true })}
                            placeholder="0917 123 4567"
                            error={
                              touched.phone &&
                              !PHONE_REGEX.test(activeBooking.phone.replace(/\D/g, ''))
                                ? 'Valid PH mobile number required'
                                : ''
                            }
                          />
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* PRIMARY PATIENT: DATE + TIME */}
                {showDateSection && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                    <div className="relative">
                      <h3 className="text-[20px] font-serif font-light mb-8 text-[#251101] dark:text-white">
                        {viewDate.format('MMMM YYYY')}
                      </h3>
                      <div className="grid grid-cols-7 gap-px bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-900">
                        {calendarGrid.map((date, i) => {
                          const dateStr = date.format('YYYY-MM-DD')
                          const isSelected = activeBooking.date === dateStr
                          const isDisabled = date.isBefore(dayjs(minSelectableDate), 'day')
                          return (
                            <button
                              key={i}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => {
                                updateActiveBooking('date', dateStr)
                                updateActiveBooking('time', '')
                              }}
                              className={`h-12 flex items-center justify-center font-serif text-[13px] ${isSelected ? 'bg-[#251101] text-white' : 'bg-white dark:bg-[#050505] hover:bg-zinc-50 dark:hover:bg-zinc-900 text-[#251101] dark:text-zinc-100'} ${isDisabled ? 'opacity-10 cursor-not-allowed' : ''}`}
                            >
                              {date.date()}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    {activeBooking.date && (
                      <div className="grid grid-cols-3 gap-px bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden animate-in fade-in border border-zinc-100 dark:border-zinc-900">
                        {timeSlots.map((slot) => {
                          const isFull =
                            (activeBooking.date === todayStr && slot <= manilaTimeNow) ||
                            busySlots.includes(slot) ||
                            localBusySlots.includes(slot)
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={isFull}
                              onClick={() => updateActiveBooking('time', slot)}
                              className={`py-6 text-[14px] font-serif transition-all ${activeBooking.time === slot ? 'bg-[#251101] text-white' : 'bg-white dark:bg-[#050505] hover:bg-zinc-50 dark:hover:bg-zinc-900 text-[#251101] dark:text-zinc-100'}${isFull ? ' opacity-20 cursor-not-allowed' : ''}`}
                            >
                              {slot}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* GUEST PATIENT: TIME ONLY */}
                {showTimeOnlySection && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <label className="text-[9px] uppercase tracking-[0.4em] text-[#595f72] block font-serif">
                      Available Slots for {dayjs(activeBooking.date).format('MMM D')}
                    </label>
                    <div className="grid grid-cols-3 gap-px bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-900">
                      {timeSlots.map((slot) => {
                        const isFull =
                          (activeBooking.date === todayStr && slot <= manilaTimeNow) ||
                          busySlots.includes(slot) ||
                          localBusySlots.includes(slot)
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isFull}
                            onClick={() => updateActiveBooking('time', slot)}
                            className={`py-6 text-[14px] font-serif transition-all ${activeBooking.time === slot ? 'bg-[#251101] text-white' : 'bg-white dark:bg-[#050505] hover:bg-zinc-50 dark:hover:bg-zinc-900 text-[#251101] dark:text-zinc-100'}${isFull ? ' opacity-20 cursor-not-allowed' : ''}`}
                          >
                            {slot}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {activeBooking.time && !isReschedule && (
                  <button
                    type="button"
                    onClick={handleAddPerson}
                    className="w-full py-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-[8px] uppercase tracking-[0.4em] text-[#595f72] hover:text-[#251101] dark:hover:text-white transition-all font-serif hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    + Add another guest
                  </button>
                )}
              </div>
            </div>

            {/* SUMMARY SIDEBAR */}
            <div className="lg:col-span-6 flex flex-col gap-10 pt-16">
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
                          {b.firstName || b.surname
                            ? `${b.firstName} ${b.surname}`
                            : i === 0 && isRecognized
                              ? 'Recognized Session'
                              : i === 0
                                ? 'New Patient'
                                : `Guest ${i}`}
                        </h4>
                        <p className="text-[11px] opacity-70 italic">
                          {b.serviceId ? getServiceTitle(b.serviceId) : '-- Treatment'}{' '}
                          {b.extraServiceId && `+ ${getServiceTitle(b.extraServiceId)}`} —{' '}
                          {b.date ? dayjs(b.date).format('MMM D, YYYY') : '--'} @{' '}
                          {b.time || '--:--'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  type="submit"
                  disabled={isPendingTransition || !isAllValid}
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
