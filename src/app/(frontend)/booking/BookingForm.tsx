'use client'

import React, { useActionState, useState, useEffect, Suspense, useTransition, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  createBookingAction,
  getBusySlots,
  getCustomerByEmail,
  getClinicTimeSlots,
} from './actions'
import { Service } from '@/payload-types'
import Notification from '../components/Notification'
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import dayjs from '@/lib/dayjs'
import { RegistrySkeleton } from '../components/RegistrySkeleton'

const atelierEase = 'ease-[cubic-bezier(0.16,1,0.3,1)]'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^(09|639)\d{9}$/
const STEPS = ['TREATMENT', 'SCHEDULE', 'REGISTRATION', 'CONFIRMATION']
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

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

export default function BookingForm({
  services,
  initialData,
}: {
  services: Service[]
  initialData: { email: string; fn: string; sn: string; ph: string }
}) {
  return (
    <Suspense fallback={<RegistrySkeleton />}>
      <BookingFlowContent services={services} initialData={initialData} />
    </Suspense>
  )
}

function BookingFlowContent({
  services,
  initialData,
}: {
  services: Service[]
  initialData: { email: string; fn: string; sn: string; ph: string }
}) {
  const searchParams = useSearchParams()
  const isReschedule = searchParams.get('reschedule') === 'true'
  const rescheduleId = searchParams.get('id')
  const hasPrefillData = !!(initialData.email && initialData.fn)

  const [currentStep, setCurrentStep] = useState(0)
  const [isMounted, setIsMounted] = useState(false)

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
  const isPrimaryDraft = activeTabIndex === 0

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

  const handleAddGuest = () => {
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
  const [modalError, setModalError] = useState<string | null>(null)

  const [isPendingTransition, startTransition] = useTransition()
  const [state, formAction] = useActionState(createBookingAction, null)

  const [busySlots, setBusySlots] = useState<string[]>([])
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [, setLoadingSlots] = useState(false)

  const isRecognized = isReschedule || hasPrefillData || wasVerifiedInSession

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
  const maxDate = useMemo(() => dayjs().add(3, 'month').endOf('month'), [])

  const handleNextMonth = () => {
    if (viewDate.add(1, 'month').isBefore(maxDate))
      setViewDate(viewDate.add(1, 'month').startOf('month'))
  }
  const handlePrevMonth = () => {
    if (viewDate.subtract(1, 'month').isAfter(dayjs().startOf('month').subtract(1, 'day')))
      setViewDate(viewDate.subtract(1, 'month').startOf('month'))
  }

  const calendarGrid = useMemo(() => {
    const startOfMonth = viewDate.startOf('month')
    const startDay = startOfMonth.day()
    const daysInMonth = viewDate.endOf('month').date()
    const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7
    return [...Array(totalCells)].map((_, i) =>
      startOfMonth.subtract(startDay, 'day').add(i, 'day'),
    )
  }, [viewDate])

  const localBusySlots = useMemo(() => {
    const busy: string[] = []
    bookings.forEach((b, i) => {
      if (i === activeTabIndex || !b.date || !b.time || b.date !== activeBooking.date) return
      const service1 = services.find((s) => String(s.id) === b.serviceId)
      const duration1 = Number(service1?.duration) || 60
      const service2 = b.extraServiceId
        ? services.find((s) => String(s.id) === b.extraServiceId)
        : null
      const duration2 = b.extraServiceId ? Number(service2?.duration) || 60 : 0
      const totalDuration = duration1 + duration2
      let current = dayjs(`${b.date}T${b.time}:00`)
      const end = current.add(totalDuration, 'minute')
      while (current.isBefore(end)) {
        busy.push(current.format('HH:mm'))
        current = current.add(30, 'minute')
      }
    })
    return busy
  }, [bookings, activeBooking.date, activeTabIndex, services])

  const getServiceTitle = useMemo(() => {
    return (id: string) => services.find((s) => String(s.id) === id)?.title || 'Service'
  }, [services])

  useEffect(() => {
    setIsMounted(true)
    async function fetchDynamicSlots() {
      try {
        const generatedSlots = await getClinicTimeSlots()
        setTimeSlots(generatedSlots)
      } catch (error) {
        console.error('Failed to load clinic configuration', error)
      }
    }
    fetchDynamicSlots()
  }, [])

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

  const handleFinalSubmit = () => {
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

  const nextStep = () => {
    if (currentStep === STEPS.length - 1) handleFinalSubmit()
    else setCurrentStep((p) => Math.min(p + 1, STEPS.length - 1))
  }

  const prevStep = () => setCurrentStep((p) => Math.max(p - 1, 0))

  const jumpToStep = (tabIndex: number, stepIndex: number) => {
    setActiveTabIndex(tabIndex)
    setCurrentStep(stepIndex)
  }

  const isStepValid = () => {
    if (currentStep === 0) return bookings.every((b) => b.serviceId !== '')
    if (currentStep === 1) return bookings.every((b) => b.date !== '' && b.time !== '')
    if (currentStep === 2)
      return bookings.every((b, i) => {
        if (i === 0 && !isRecognized) {
          return (
            b.firstName.trim() !== '' &&
            b.surname.trim() !== '' &&
            EMAIL_REGEX.test(b.email) &&
            PHONE_REGEX.test(b.phone)
          )
        }
        return b.firstName.trim() !== '' && b.surname.trim() !== ''
      })
    return true
  }

  const isActiveTabValid = () => {
    if (currentStep === 0) return activeBooking.serviceId !== ''
    if (currentStep === 1) return activeBooking.date !== '' && activeBooking.time !== ''
    if (currentStep === 2) {
      if (activeTabIndex === 0 && !isRecognized)
        return (
          activeBooking.firstName.trim() !== '' &&
          activeBooking.surname.trim() !== '' &&
          EMAIL_REGEX.test(activeBooking.email) &&
          PHONE_REGEX.test(activeBooking.phone)
        )
      return activeBooking.firstName.trim() !== '' && activeBooking.surname.trim() !== ''
    }
    return true
  }

  const showLastName = activeBooking.firstName.trim().length > 0
  const showEmail =
    showLastName && activeBooking.surname.trim().length > 0 && isPrimaryDraft && !isRecognized
  const showPhone = showEmail && EMAIL_REGEX.test(activeBooking.email.trim())

  if (!isMounted) return null

  return (
    <>
      {errorToast && (
        <Notification message={errorToast} type="error" onClose={() => setErrorToast(null)} />
      )}

      {/* APP-LIKE BOUNDED CONTAINER */}
      <div className="relative w-full max-w-[1440px] mx-auto h-[calc(100dvh-5rem)] md:h-[80vh] min-h-[600px] flex flex-col md:flex-row border-x border-zinc-100 dark:border-zinc-900 mt-20 md:mt-32 border-t md:border-t-0 bg-white dark:bg-[#050505] overflow-hidden">
        {/* LEFT COLUMN: Sticky Progress */}
        <div className="w-full md:w-1/3 p-6 md:p-12 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-900 flex flex-col justify-between shrink-0 z-20">
          <div className="space-y-6 md:space-y-12">
            <header className="space-y-3">
              <span className="text-[8px] uppercase tracking-[0.8em] text-[#595f72] font-serif block">
                {isReschedule ? 'Reschedule' : 'Reservation'}
              </span>
              <h1 className="text-[24px] md:text-[32px] font-normal font-serif tracking-tight text-[#251101] dark:text-zinc-100 leading-none">
                Secure your <br /> appointment.
              </h1>
            </header>

            {/* Subtly dim the stepper if the auth slide is active */}
            <div
              className={`flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start w-full gap-2 md:gap-0 md:space-y-4 transition-all duration-[1200ms] ${atelierEase} ${showModal && !isRecognized ? 'opacity-20 pointer-events-none md:-translate-x-4' : 'opacity-100 translate-x-0'}`}
            >
              {STEPS.map((step, index) => {
                const isActive = index === currentStep
                const isPast = index < currentStep
                return (
                  <div key={step} className="flex items-center gap-3 md:gap-4 group shrink-0">
                    <span
                      className={`text-[9px] font-serif tracking-[0.3em] transition-all duration-700 ${isActive ? 'text-[#251101] dark:text-white scale-110' : 'text-zinc-300 dark:text-zinc-700'}`}
                    >
                      0{index + 1}
                    </span>
                    <div
                      className={`h-[1px] transition-all duration-1000 ${atelierEase} ${isActive ? 'w-8 md:w-12 bg-[#251101] dark:bg-white' : isPast ? 'w-4 bg-zinc-300 dark:bg-zinc-700' : 'w-0 md:w-0 w-2 bg-transparent'}`}
                    />
                    <span
                      className={`text-[8px] uppercase tracking-[0.4em] font-serif transition-all duration-700 ${isActive ? 'text-[#251101] dark:text-white opacity-100 block' : 'text-[#595f72] opacity-0 md:-translate-x-4 hidden md:block'}`}
                    >
                      {step}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Dynamic Flow Content */}
        <div className="w-full md:w-2/3 flex flex-col bg-zinc-50 dark:bg-[#080808] flex-1 min-h-0 relative overflow-hidden">
          {/* --- ZERO STATE: BLENDED RECOGNITION SLIDE --- */}
          {showModal && !isRecognized ? (
            <div className="absolute inset-0 z-50 flex flex-col justify-center p-6 md:p-12 overflow-y-auto w-full h-full bg-zinc-50 dark:bg-[#080808]">
              <div className="max-w-md w-full mx-auto">
                {isExisting === null ? (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
                    <header className="space-y-4">
                      <h2 className="text-[24px] md:text-[32px] font-serif font-light tracking-tight text-[#251101] dark:text-white leading-tight">
                        Welcome back!
                      </h2>
                      <p className="text-[12px] font-light text-[#595f72] font-serif">
                        To personalize your reservation, please let us know if you have visited us
                        before.
                      </p>
                    </header>
                    <div className="space-y-4">
                      <button
                        onClick={() => setIsExisting(true)}
                        className="w-full text-left p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 hover:border-[#251101] dark:hover:border-white transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group outline-none bg-white dark:bg-[#050505]"
                      >
                        <h3 className="font-serif text-[14px] md:text-[16px] text-[#251101] dark:text-white mb-2 transition-colors">
                          Existing Client
                        </h3>
                        <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-400 font-serif">
                          Access your account
                        </p>
                      </button>
                      <button
                        onClick={() => setShowModal(false)}
                        className="w-full text-left p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 hover:border-[#251101] dark:hover:border-white transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group outline-none bg-white dark:bg-[#050505]"
                      >
                        <h3 className="font-serif text-[14px] md:text-[16px] text-[#251101] dark:text-white mb-2 transition-colors">
                          New Client
                        </h3>
                        <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-400 font-serif">
                          Create a new reservation
                        </p>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
                    <header className="space-y-6">
                      <button
                        onClick={() => setIsExisting(null)}
                        className="flex items-center gap-3 text-[9px] uppercase tracking-[0.4em] text-[#595f72] hover:text-[#251101] dark:hover:text-white font-serif transition-colors outline-none group"
                      >
                        <ArrowLeftIcon className="w-3 h-3 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-1" />{' '}
                        Return
                      </button>
                      <div>
                        <h2 className="text-[24px] md:text-[32px] font-serif font-light tracking-tight text-[#251101] dark:text-white leading-tight mb-4">
                          Confirm Your Email
                        </h2>
                        <div className="h-4">
                          {modalError ? (
                            <span className="text-[9px] uppercase tracking-[0.2em] text-red-500 font-serif animate-in fade-in">
                              {modalError}
                            </span>
                          ) : (
                            <span className="text-[12px] font-light text-[#595f72] font-serif">
                              Enter your email address to access records.
                            </span>
                          )}
                        </div>
                      </div>
                    </header>

                    <div className="space-y-10">
                      <FloatingInput
                        label="Email Address"
                        type="email"
                        value={existingEmail}
                        onChange={(e) => {
                          setExistingEmail(e.target.value)
                          setModalError(null)
                        }}
                      />
                      <button
                        onClick={() => {
                          setIsVerifying(true)
                          setModalError(null)
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
                        className="flex items-center justify-between w-full p-6 border border-[#251101] dark:border-white bg-[#251101] dark:bg-white text-white dark:text-[#251101] transition-opacity hover:opacity-90 disabled:opacity-30 outline-none group"
                      >
                        <span className="text-[9px] uppercase tracking-[0.4em] font-serif font-bold">
                          {isVerifying ? 'Searching...' : 'Access Records'}
                        </span>
                        <ArrowRightIcon className="w-4 h-4 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* PERSISTENT PATIENT TABS */}
              {currentStep < 3 && (
                <div className="w-full bg-zinc-50 dark:bg-[#080808] border-b border-zinc-200 dark:border-zinc-900 px-6 md:px-12 pt-6 flex gap-6 overflow-x-auto scrollbar-hide shrink-0 z-20 relative">
                  {bookings.map((b, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap ${activeTabIndex === i ? 'border-[#251101] dark:border-white text-[#251101] dark:text-white' : 'border-transparent text-[#595f72] hover:text-[#251101] dark:hover:text-white'}`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveTabIndex(i)}
                        className="text-[9px] uppercase tracking-[0.3em] font-serif outline-none flex items-center gap-2"
                      >
                        {i === 0 ? 'Main Patient' : `Guest ${i}`}
                        {activeTabIndex !== i &&
                          (!b.serviceId ||
                            (currentStep > 0 && !b.time) ||
                            (currentStep > 1 && !b.firstName)) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                          )}
                      </button>
                      {i > 0 && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteGuest(e, i)}
                          className="p-1 rounded-full opacity-40 hover:opacity-100 transition-all outline-none"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {!isReschedule && (
                    <button
                      type="button"
                      onClick={handleAddGuest}
                      className="text-[9px] uppercase tracking-[0.3em] text-zinc-400 hover:text-[#251101] dark:hover:text-white font-serif outline-none pb-3 whitespace-nowrap"
                    >
                      + Add Guest
                    </button>
                  )}
                </div>
              )}

              {/* Form Slide Container */}
              <div className="flex-1 relative w-full overflow-hidden">
                {/* STEP 1: TREATMENT */}
                <FormSlide isActive={currentStep === 0}>
                  <div className="p-6 md:p-12 pb-8">
                    <h2 className="text-[14px] font-serif uppercase tracking-[0.3em] text-[#251101] dark:text-white mb-6">
                      {isPrimaryDraft
                        ? 'Select Treatment'
                        : `Select Treatment for Guest ${activeTabIndex}`}
                    </h2>
                    <div className="space-y-3">
                      {services.map((treatment) => {
                        const tId = String(treatment.id)
                        const isSelected =
                          activeBooking.serviceId === tId || activeBooking.extraServiceId === tId
                        const isMain = activeBooking.serviceId === tId
                        return (
                          <button
                            key={tId}
                            onClick={() => {
                              if (isMain) return
                              if (!activeBooking.serviceId) updateActiveBooking('serviceId', tId)
                              else if (!activeBooking.extraServiceId)
                                updateActiveBooking('extraServiceId', tId)
                            }}
                            className={`w-full text-left p-5 md:p-6 border transition-all duration-500 flex justify-between items-center group outline-none ${
                              isSelected
                                ? 'border-[#251101] dark:border-white bg-white dark:bg-[#050505]'
                                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-transparent'
                            }`}
                          >
                            <div className="space-y-1">
                              <h3
                                className={`font-serif text-[13px] md:text-[15px] transition-colors ${isSelected ? 'text-[#251101] dark:text-white' : 'text-[#595f72] dark:text-zinc-400'}`}
                              >
                                {treatment.title}
                              </h3>
                              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-400 font-serif">
                                {treatment.duration} Min
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span
                                className={`text-[12px] font-serif transition-colors ${isSelected ? 'text-[#251101] dark:text-white' : 'text-zinc-400'}`}
                              >
                                PHP {treatment.price}
                              </span>
                              <div
                                className={`w-4 h-4 border rounded-full flex items-center justify-center transition-all ${isSelected ? 'border-[#251101] dark:border-white' : 'border-zinc-300 dark:border-zinc-700'}`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full transition-all ${isSelected ? 'bg-[#251101] dark:bg-white scale-100' : 'bg-transparent scale-0'}`}
                                />
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    {(activeBooking.serviceId || activeBooking.extraServiceId) && (
                      <button
                        onClick={() => {
                          updateActiveBooking('serviceId', '')
                          updateActiveBooking('extraServiceId', '')
                        }}
                        className="text-[7px] uppercase tracking-[0.3em] text-red-500 font-serif hover:underline outline-none mt-6 block"
                      >
                        [ Clear Selections ]
                      </button>
                    )}
                  </div>
                </FormSlide>

                {/* STEP 2: SCHEDULE */}
                <FormSlide isActive={currentStep === 1}>
                  <div className="p-6 md:p-12 space-y-8 pb-8">
                    <h2 className="text-[14px] font-serif uppercase tracking-[0.3em] text-[#251101] dark:text-white mb-6">
                      {isPrimaryDraft
                        ? 'Select Date & Time'
                        : `Select Time for Guest ${activeTabIndex}`}
                    </h2>
                    {isPrimaryDraft ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
                          <button
                            onClick={handlePrevMonth}
                            className="p-2 outline-none hover:text-[#595f72] transition-colors"
                          >
                            <ChevronLeftIcon className="w-4 h-4" />
                          </button>
                          <h3 className="text-[13px] font-serif font-light text-[#251101] dark:text-white uppercase tracking-[0.2em]">
                            {viewDate.format('MMMM YYYY')}
                          </h3>
                          <button
                            onClick={handleNextMonth}
                            className="p-2 outline-none hover:text-[#595f72] transition-colors"
                          >
                            <ChevronRightIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-7 gap-px mb-2">
                          {WEEKDAYS.map((day) => (
                            <div
                              key={day}
                              className="text-center text-[8px] uppercase tracking-[0.2em] text-[#595f72] font-serif"
                            >
                              {day}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-800 rounded-none border border-zinc-200 dark:border-zinc-800">
                          {calendarGrid.map((date, i) => {
                            const dateStr = date.format('YYYY-MM-DD')
                            const isSelected = activeBooking.date === dateStr
                            const isCurrentMonth = date.month() === viewDate.month()
                            const isDisabled =
                              date.isBefore(dayjs(minSelectableDate), 'day') || !isCurrentMonth
                            return (
                              <button
                                key={i}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => {
                                  updateActiveBooking('date', dateStr)
                                  updateActiveBooking('time', '')
                                }}
                                className={`h-10 md:h-12 flex items-center justify-center font-serif text-[12px] md:text-[13px] transition-colors outline-none ${isSelected ? 'bg-[#251101] dark:bg-white text-white dark:text-[#251101]' : 'bg-zinc-50 dark:bg-[#080808] hover:bg-white dark:hover:bg-[#121212] text-[#251101] dark:text-zinc-100'} ${isDisabled ? 'opacity-0 cursor-not-allowed pointer-events-none' : ''}`}
                              >
                                {date.date()}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#050505]">
                        <span className="text-[8px] uppercase tracking-[0.4em] text-zinc-400 font-serif block mb-2">
                          Locked Date
                        </span>
                        <p className="text-[15px] font-serif text-[#251101] dark:text-white">
                          {dayjs(bookings[0].date).format('dddd, MMMM D, YYYY')}
                        </p>
                      </div>
                    )}
                    <div
                      className={`transition-all duration-700 ${atelierEase} ${activeBooking.date ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}
                    >
                      <p className="text-[9px] uppercase tracking-[0.4em] text-[#595f72] font-serif mb-3 block">
                        Available Slots
                      </p>
                      <div className="grid grid-cols-3 gap-px bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800">
                        {timeSlots.map((slot) => {
                          const isFull =
                            (activeBooking.date === todayStr && slot <= manilaTimeNow) ||
                            busySlots.includes(slot) ||
                            localBusySlots.includes(slot)
                          const isSelected = activeBooking.time === slot
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={isFull}
                              onClick={() => updateActiveBooking('time', slot)}
                              className={`py-4 text-[12px] md:text-[13px] font-serif transition-colors outline-none ${isSelected ? 'bg-[#251101] dark:bg-white text-white dark:text-[#251101]' : 'bg-zinc-50 dark:bg-[#080808] hover:bg-white dark:hover:bg-[#121212] text-[#251101] dark:text-zinc-100'} ${isFull ? ' opacity-20 cursor-not-allowed' : ''}`}
                            >
                              {slot}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </FormSlide>

                {/* STEP 3: DOSSIER (Progressive Disclosure) */}
                <FormSlide isActive={currentStep === 2}>
                  <div className="p-6 md:p-12 pb-8">
                    <h2 className="text-[14px] font-serif uppercase tracking-[0.3em] text-[#251101] dark:text-white mb-10">
                      {isPrimaryDraft ? 'Main Client' : `Guest ${activeTabIndex}`}
                    </h2>

                    {/* Clean vertical stacking for sequential revelation */}
                    <div className="max-w-md">
                      <FloatingInput
                        label="First Name"
                        value={activeBooking.firstName}
                        onChange={(e) => updateActiveBooking('firstName', e.target.value)}
                      />

                      <ProgressiveReveal show={showLastName}>
                        <FloatingInput
                          label="Last Name"
                          value={activeBooking.surname}
                          onChange={(e) => updateActiveBooking('surname', e.target.value)}
                        />
                      </ProgressiveReveal>

                      <ProgressiveReveal show={showEmail}>
                        <FloatingInput
                          label="Email Address"
                          type="email"
                          value={activeBooking.email}
                          onChange={(e) => updateActiveBooking('email', e.target.value)}
                        />
                      </ProgressiveReveal>

                      <ProgressiveReveal show={showPhone}>
                        <FloatingInput
                          label="Contact Number"
                          type="tel"
                          value={activeBooking.phone}
                          onChange={(e) => updateActiveBooking('phone', e.target.value)}
                        />
                      </ProgressiveReveal>
                    </div>
                  </div>
                </FormSlide>

                {/* STEP 4: CONFIRMATION */}
                <FormSlide isActive={currentStep === 3}>
                  <div className="p-6 md:p-12 space-y-8 pb-8">
                    <header>
                      <h2 className="text-[14px] font-serif uppercase tracking-[0.3em] text-[#251101] dark:text-white mb-3">
                        Final Review
                      </h2>
                      <p className="text-[12px] font-light text-[#595f72] font-serif">
                        Please verify your details before securing the reservation.
                      </p>
                    </header>

                    <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#050505] p-6 md:p-10 space-y-10">
                      {bookings.map((b, i) => {
                        const missingService = !b.serviceId
                        const missingTime = !b.date || !b.time
                        const missingIdentity =
                          b.firstName.trim() === '' ||
                          b.surname.trim() === '' ||
                          (i === 0 &&
                            !isRecognized &&
                            (!EMAIL_REGEX.test(b.email) || !PHONE_REGEX.test(b.phone)))
                        const isError = missingService || missingTime || missingIdentity

                        if (isError) {
                          return (
                            <div
                              key={i}
                              className="pb-8 border-b border-zinc-100 dark:border-zinc-900 last:border-0 last:pb-0"
                            >
                              <div className="flex items-center gap-4 mb-5">
                                <span className="text-[8px] uppercase tracking-[0.4em] text-red-500 font-serif">
                                  {i === 0 ? 'Main Patient' : `Guest ${i}`} — Incomplete
                                </span>
                                <div className="flex-1 h-[1px] bg-red-500/20" />
                              </div>
                              <div className="space-y-4 flex flex-col items-start">
                                {missingService && (
                                  <button
                                    onClick={() => jumpToStep(i, 0)}
                                    className="text-[12px] uppercase tracking-[0.2em] font-serif text-[#251101] dark:text-white hover:opacity-50 transition-opacity outline-none text-left"
                                  >
                                    Select Treatment →
                                  </button>
                                )}
                                {!missingService && missingTime && (
                                  <button
                                    onClick={() => jumpToStep(i, 1)}
                                    className="text-[12px] uppercase tracking-[0.2em] font-serif text-[#251101] dark:text-white hover:opacity-50 transition-opacity outline-none text-left"
                                  >
                                    Select Schedule →
                                  </button>
                                )}
                                {!missingService && !missingTime && missingIdentity && (
                                  <button
                                    onClick={() => jumpToStep(i, 2)}
                                    className="text-[12px] uppercase tracking-[0.2em] font-serif text-[#251101] dark:text-white hover:opacity-50 transition-opacity outline-none text-left"
                                  >
                                    Complete Details →
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        }

                        return (
                          <div
                            key={i}
                            className="pb-8 border-b border-zinc-100 dark:border-zinc-900 last:border-0 last:pb-0 space-y-6"
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-[8px] uppercase tracking-[0.4em] text-zinc-400 font-serif">
                                {i === 0 ? 'Main Patient' : `Guest ${i}`}
                              </span>
                              <div className="flex-1 h-[1px] bg-zinc-100 dark:bg-zinc-900" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-1">
                                <span className="text-[7px] uppercase tracking-[0.4em] text-zinc-400 font-serif block">
                                  Name
                                </span>
                                <p className="text-[13px] font-serif text-[#251101] dark:text-white">
                                  {b.firstName} {b.surname}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[7px] uppercase tracking-[0.4em] text-zinc-400 font-serif block">
                                  Treatment(s)
                                </span>
                                <p className="text-[13px] font-serif text-[#251101] dark:text-white">
                                  {getServiceTitle(b.serviceId)}{' '}
                                  {b.extraServiceId && `+ ${getServiceTitle(b.extraServiceId)}`}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[7px] uppercase tracking-[0.4em] text-zinc-400 font-serif block">
                                  Date
                                </span>
                                <p className="text-[13px] font-serif text-[#251101] dark:text-white">
                                  {dayjs(b.date).format('MMM D, YYYY')}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[7px] uppercase tracking-[0.4em] text-zinc-400 font-serif block">
                                  Time
                                </span>
                                <p className="text-[13px] font-serif text-[#251101] dark:text-white">
                                  {b.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </FormSlide>
              </div>

              {/* BOTTOM NAVIGATION ACTION BAR (Pinned) */}
              <div className="p-5 md:p-8 border-t border-zinc-200 dark:border-zinc-900 flex justify-between items-center bg-zinc-50 dark:bg-[#080808] shrink-0 relative z-20">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0 || isPendingTransition}
                  className={`flex items-center gap-3 md:gap-4 text-[9px] font-bold uppercase tracking-[0.4em] font-serif outline-none transition-all duration-700 group ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:text-[#595f72]'}`}
                >
                  <ArrowLeftIcon className="w-3 h-3 md:w-3.5 md:h-3.5 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-1" />
                  <span className="relative pb-1">
                    Return
                    <span className="absolute bottom-0 left-0 w-0 h-[0.5px] bg-[#251101] dark:bg-white transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full" />
                  </span>
                </button>

                <div className="flex items-center gap-6">
                  {!isStepValid() && isActiveTabValid() && currentStep < 3 && (
                    <span className="text-[8px] uppercase tracking-[0.2em] text-red-500 font-serif animate-pulse hidden md:block">
                      Action Required on Guest Tabs
                    </span>
                  )}

                  <button
                    onClick={nextStep}
                    disabled={!isStepValid() && currentStep === 3}
                    className={`flex items-center gap-3 md:gap-4 text-[9px] font-bold uppercase tracking-[0.4em] font-serif outline-none transition-all duration-700 group ${(!isStepValid() && currentStep === 3) || isPendingTransition ? 'opacity-30 cursor-not-allowed' : 'opacity-100 hover:text-[#595f72]'}`}
                  >
                    <span className="relative pb-1">
                      {isPendingTransition
                        ? 'Processing'
                        : currentStep === STEPS.length - 1
                          ? 'Confirm Booking'
                          : currentStep === 2
                            ? 'Review'
                            : 'Continue'}
                      <span className="absolute bottom-0 right-0 w-0 h-[0.5px] bg-[#251101] dark:bg-white transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full" />
                    </span>
                    {currentStep === STEPS.length - 1 ? (
                      <CheckIcon
                        className={`w-3 h-3 md:w-3.5 md:h-3.5 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isPendingTransition ? 'animate-pulse' : 'group-hover:scale-110'}`}
                      />
                    ) : (
                      <ArrowRightIcon className="w-3 h-3 md:w-3.5 md:h-3.5 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function FormSlide({ children, isActive }: { children: React.ReactNode; isActive: boolean }) {
  return (
    <div
      className={`absolute inset-0 w-full h-full transition-all duration-[1200ms] ${atelierEase} overflow-y-auto scrollbar-hide ${isActive ? 'opacity-100 translate-x-0 pointer-events-auto z-10' : 'opacity-0 translate-x-12 pointer-events-none z-0'}`}
    >
      {children}
    </div>
  )
}

function ProgressiveReveal({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`transition-all duration-[1200ms] ${atelierEase} overflow-hidden ${show ? 'max-h-[200px] opacity-100 translate-y-0 pt-6 md:pt-8' : 'max-h-0 opacity-0 -translate-y-4 pt-0'}`}
    >
      {children}
    </div>
  )
}

function FloatingInput({
  label,
  type = 'text',
  value,
  onChange,
}: {
  label: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const [isFocused, setIsFocused] = useState(false)
  const isFilled = value.length > 0 || isFocused

  return (
    <div className="relative group">
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 focus:outline-none py-3 md:py-4 text-[16px] md:text-[14px] font-serif text-[#251101] dark:text-zinc-100 transition-colors z-10 relative rounded-none"
      />
      <label
        className={`absolute left-0 transition-all duration-500 ${atelierEase} font-serif pointer-events-none z-0 ${isFilled ? '-top-3 text-[7px] uppercase tracking-[0.3em] text-[#251101] dark:text-zinc-400' : 'top-1/2 -translate-y-1/2 text-[14px] md:text-[12px] text-[#595f72] tracking-wide'}`}
      >
        {label}
      </label>
      <div
        className={`absolute bottom-0 left-0 h-[1px] bg-[#251101] dark:bg-white transition-all duration-700 ${atelierEase} ${isFocused ? 'w-full' : 'w-0'}`}
      />
    </div>
  )
}
