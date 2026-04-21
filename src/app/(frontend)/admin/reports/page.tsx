'use client'

import React, { useState, useEffect } from 'react'
import FadeIn from '../../components/FadeIn'
import BackToHome from '../../components/BackToHome'
import {
  DocumentTextIcon,
  TableCellsIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  CalendarDaysIcon,
  EyeIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import dayjs from '@/lib/dayjs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from '@headlessui/react'
import { Fragment } from 'react'

type ReportRange = 'thisMonth' | 'specificMonth' | 'ytd' | 'all'
type ReportFormat = 'pdf' | 'csv' | null

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export default function ReportsClient() {
  const currentMonthIndex = dayjs().tz('Asia/Manila').month()
  const availableMonths = MONTHS.slice(0, currentMonthIndex + 1)

  const [range, setRange] = useState<ReportRange>('thisMonth')
  const [selectedMonth, setSelectedMonth] = useState<number>(Math.max(0, currentMonthIndex - 1))
  const [format, setFormat] = useState<ReportFormat>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [drawLine, setDrawLine] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    const timer = setTimeout(() => setDrawLine(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const getRangeLabel = () => {
    if (range === 'thisMonth') return dayjs().format('MMMM YYYY')
    if (range === 'specificMonth') return `${MONTHS[selectedMonth]} ${dayjs().format('YYYY')}`
    if (range === 'ytd') return `Jan 1 - ${dayjs().format('MMM D, YYYY')}`
    return 'Full Archive'
  }

  const handleDownload = async () => {
    if (!format) return
    setIsGenerating(true)

    try {
      const res = await fetch(`/api/admin/reports?range=${range}&month=${selectedMonth}`)

      if (!res.ok) {
        const errorData = await res.text()
        throw new Error(`Server Error ${res.status}: ${errorData}`)
      }

      const { reports, summary } = await res.json()

      // SMART FILENAME GENERATOR WITH EXPORT DATE
      const exportDate = dayjs().format('YYYYMMDD')
      let filenameLabel = 'Clinic_Report'

      if (range === 'thisMonth') {
        filenameLabel += `_${dayjs().format('MMMM_YYYY')}_Exported_${exportDate}`
      } else if (range === 'specificMonth') {
        filenameLabel += `_${MONTHS[selectedMonth]}_${dayjs().format('YYYY')}_Exported_${exportDate}`
      } else if (range === 'ytd') {
        filenameLabel += `_YTD_${dayjs().format('YYYY')}_Exported_${exportDate}`
      } else {
        filenameLabel += `_FullArchive_Exported_${exportDate}`
      }

      if (format === 'csv') {
        let csvContent = `CLINIC REPORT: ${getRangeLabel()}\nTotal Sessions: ${summary.totalSessions}\nTotal Revenue: PHP ${summary.totalRevenue}\n\n`

        csvContent += `CATEGORY SALES SUMMARY\nService,Total Revenue\n`
        summary.overallCategorySales.forEach((c: any) => {
          csvContent += `"${c.service}",${c.total}\n`
        })

        csvContent += `\nRAW LEDGER\nDate,Patient,Email,Phone,Service,Price (PHP)\n`
        const csvRows = reports.map(
          (r: any) =>
            `"${r.date}","${r.patient}","${r.email}","${r.phone}","${r.service}",${r.price}`,
        )
        csvContent += csvRows.join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `${filenameLabel}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else if (format === 'pdf') {
        const doc = new jsPDF()
        let currentY = 20

        const addHeader = (title: string, yPos: number) => {
          doc.setFont('times', 'bold')
          doc.setFontSize(14)
          doc.setTextColor(37, 17, 1)
          doc.text(title, 14, yPos)
        }

        doc.setFont('times', 'normal')
        doc.setFontSize(22)
        doc.setTextColor(0)
        doc.text('Clinic Executive Summary', 14, currentY)
        currentY += 8

        doc.setFontSize(10)
        doc.setTextColor(100)
        doc.text(`Generated: ${dayjs().format('MMMM D, YYYY')}`, 14, currentY)
        currentY += 5
        doc.text(`Period: ${getRangeLabel()}`, 14, currentY)
        currentY += 12

        doc.setFontSize(12)
        doc.setTextColor(0)
        doc.text(`Total Completed Sessions: ${summary.totalSessions}`, 14, currentY)
        currentY += 7
        doc.text(`Total Period Revenue: PHP ${summary.totalRevenue.toLocaleString()}`, 14, currentY)
        currentY += 15

        addHeader('Overall Category Sales', currentY)
        autoTable(doc, {
          startY: currentY + 4,
          head: [['Service Category', 'Total Revenue']],
          body: summary.overallCategorySales.map((c: any) => [
            c.service,
            `PHP ${c.total.toLocaleString()}`,
          ]),
          theme: 'grid',
          headStyles: { fillColor: [37, 17, 1], textColor: [255, 255, 255], font: 'times' },
          bodyStyles: { font: 'times' },
          alternateRowStyles: { fillColor: [250, 250, 250] },
        })
        currentY = (doc as any).lastAutoTable.finalY + 15

        if ((range === 'ytd' || range === 'all') && summary.monthlyReports.length > 0) {
          summary.monthlyReports.forEach((monthData: any) => {
            if (currentY > 250) {
              doc.addPage()
              currentY = 20
            }

            addHeader(`Monthly Breakdown: ${monthData.month}`, currentY)
            currentY += 6
            doc.setFont('times', 'normal')
            doc.setFontSize(10)
            doc.text(
              `Sessions: ${monthData.sessions}  |  Revenue: PHP ${monthData.revenue.toLocaleString()}`,
              14,
              currentY,
            )

            autoTable(doc, {
              startY: currentY + 4,
              head: [['Service Category', 'Revenue']],
              body: monthData.categorySales.map((c: any) => [
                c.service,
                `PHP ${c.total.toLocaleString()}`,
              ]),
              theme: 'grid',
              headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255], font: 'times' },
              bodyStyles: { font: 'times' },
            })
            currentY = (doc as any).lastAutoTable.finalY + 15
          })
        }

        doc.addPage()
        currentY = 20
        addHeader('Complete Session Ledger', currentY)
        autoTable(doc, {
          startY: currentY + 4,
          head: [['Date', 'Patient', 'Service', 'Price']],
          body: reports.map((r: any) => [
            r.date,
            r.patient,
            r.service,
            `PHP ${r.price.toLocaleString()}`,
          ]),
          theme: 'grid',
          headStyles: { fillColor: [37, 17, 1], textColor: [255, 255, 255], font: 'times' },
          bodyStyles: { font: 'times' },
          alternateRowStyles: { fillColor: [250, 250, 250] },
        })

        doc.save(`${filenameLabel}.pdf`)
      }
    } catch (error: any) {
      console.error('Download failed:', error)
      alert(`Export Failed: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-[#251101] dark:text-zinc-100 pt-24 md:pt-32 pb-32 px-4 md:px-8 selection:bg-zinc-100 font-sans">
      <BackToHome />
      <FadeIn>
        <div className="max-w-4xl mx-auto">
          <header className="flex flex-col gap-6 relative mb-12 md:mb-16">
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-2 text-[8px] uppercase tracking-[0.3em] text-[#595f72] font-serif hover:text-[#251101] dark:hover:text-white transition-colors w-fit"
            >
              <ChevronLeftIcon className="w-3 h-3" /> Back to Analytics
            </Link>

            <div className="space-y-4 relative mt-4">
              <div
                className={`absolute -left-4 md:-left-8 top-0 w-[1px] bg-zinc-900 dark:bg-white transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] origin-top ${
                  drawLine ? 'h-full opacity-100' : 'h-0 opacity-0'
                }`}
              />
              <p className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
                Data & Export
              </p>
              <h1 className="text-[28px] md:text-[48px] font-light tracking-tighter font-serif leading-none">
                Report Center
              </h1>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            {/* LEFT COLUMN: CONTROLS */}
            <div className="lg:col-span-5 flex flex-col gap-10">
              <section className="flex flex-col gap-6">
                <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-900/50 pb-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-50 dark:bg-zinc-900 text-[8px] font-serif border border-zinc-200/50 dark:border-zinc-800">
                    1
                  </span>
                  <h2 className="text-[9px] uppercase tracking-[0.3em] text-[#595f72] font-serif">
                    Select Period
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <RangeCard
                    id="thisMonth"
                    label="This Month"
                    active={range === 'thisMonth'}
                    onClick={() => setRange('thisMonth')}
                  />

                  {/* REFACTORED SPECIFIC MONTH CARD */}
                  <div
                    className={`relative flex flex-col justify-between p-4 min-h-[84px] rounded-xl border transition-all duration-300 cursor-pointer ${
                      range === 'specificMonth'
                        ? 'border-[#251101] dark:border-white bg-zinc-50 dark:bg-zinc-900/50 shadow-sm'
                        : 'border-zinc-100 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20'
                    }`}
                    onClick={() => setRange('specificMonth')}
                  >
                    <div className="flex justify-between items-start">
                      <span
                        className={`text-[8px] uppercase tracking-widest font-serif ${range === 'specificMonth' ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'}`}
                      >
                        Month
                      </span>
                      <CalendarDaysIcon
                        className={`w-4 h-4 ${range === 'specificMonth' ? 'text-[#251101] dark:text-white' : 'text-[#595f72] opacity-40'}`}
                      />
                    </div>

                    <Listbox
                      value={selectedMonth}
                      onChange={(value) => {
                        setRange('specificMonth')
                        setSelectedMonth(value)
                      }}
                    >
                      <div className="relative mt-auto">
                        <ListboxButton
                          className={`w-full text-left font-serif py-1 border-b border-zinc-200 dark:border-zinc-800 outline-none flex justify-between items-center group transition-colors focus:border-zinc-400
                  ${range === 'specificMonth' ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'}`}
                        >
                          <span className="text-[9px] uppercase tracking-[0.2em] leading-none truncate pr-2">
                            {availableMonths[selectedMonth] || 'Month'}
                          </span>
                          <ChevronDownIcon className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </ListboxButton>

                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <ListboxOptions
                            anchor="bottom start"
                            className="z-50 mt-1 max-h-60 w-[var(--button-width)] overflow-auto rounded-md bg-white dark:bg-zinc-950 py-1 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none"
                          >
                            {availableMonths.map((month, idx) => (
                              <ListboxOption
                                key={month}
                                value={idx}
                                className="group relative cursor-pointer select-none py-2 px-4 data-[focus]:bg-zinc-100 dark:data-[focus]:bg-zinc-900"
                              >
                                <span
                                  className={`block font-serif uppercase tracking-widest text-[8px] transition-colors
                        ${
                          selectedMonth === idx
                            ? 'text-[#251101] dark:text-white font-bold'
                            : 'text-zinc-500 group-data-[focus]:text-[#251101] dark:group-data-[focus]:text-white'
                        }`}
                                >
                                  {month}
                                </span>
                              </ListboxOption>
                            ))}
                          </ListboxOptions>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>

                  <RangeCard
                    id="ytd"
                    label="Year to Date"
                    active={range === 'ytd'}
                    onClick={() => setRange('ytd')}
                  />
                  <RangeCard
                    id="all"
                    label="All Time"
                    active={range === 'all'}
                    onClick={() => setRange('all')}
                  />
                </div>
              </section>
              <section className="flex flex-col gap-5">
                <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-900/50 pb-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-50 dark:bg-zinc-900 text-[8px] font-serif">
                    2
                  </span>
                  <h2 className="text-[9px] uppercase tracking-[0.3em] text-[#595f72] font-serif">
                    Output Format
                  </h2>
                </div>
                <div className="flex flex-col gap-3">
                  <FormatCard
                    id="pdf"
                    title="Executive Summary (PDF)"
                    desc={
                      range === 'ytd' || range === 'all'
                        ? 'Includes monthly revenue and category breakdowns.'
                        : 'Clean visual breakdown of revenue and top performing services.'
                    }
                    icon={DocumentTextIcon}
                    active={format === 'pdf'}
                    onClick={() => setFormat('pdf')}
                  />
                  <FormatCard
                    id="csv"
                    title="Raw Ledger (CSV)"
                    desc="Spreadsheet of all completed sessions and summary tables."
                    icon={TableCellsIcon}
                    active={format === 'csv'}
                    onClick={() => setFormat('csv')}
                  />
                </div>
              </section>

              <div className="mt-4">
                <button
                  onClick={handleDownload}
                  disabled={!format || isGenerating}
                  className={`relative overflow-hidden flex items-center justify-center gap-3 w-full px-10 py-4 rounded-full transition-all duration-500 ${
                    !format
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                      : 'bg-[#251101] dark:bg-white text-white dark:text-[#251101] hover:opacity-90 shadow-md hover:shadow-lg'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span className="text-[9px] uppercase tracking-[0.3em] font-serif font-medium">
                        Processing...
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      <span className="text-[9px] uppercase tracking-[0.3em] font-serif font-medium">
                        Download Report
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: LIVE PREVIEW */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-900/50 pb-3 mb-6">
                <EyeIcon className="w-4 h-4 text-[#595f72]" />
                <h2 className="text-[9px] uppercase tracking-[0.3em] text-[#595f72] font-serif">
                  Document Preview
                </h2>
              </div>

              <div className="w-full flex-1 min-h-[500px] bg-zinc-50 dark:bg-zinc-900/30 rounded-3xl border border-zinc-100 dark:border-zinc-800/50 flex items-center justify-center p-6 md:p-10 relative overflow-hidden">
                {!format ? (
                  <div className="flex flex-col items-center justify-center text-center opacity-50">
                    <DocumentTextIcon className="w-8 h-8 text-[#595f72] mb-4" />
                    <p className="text-[9px] uppercase tracking-[0.3em] text-[#595f72] font-serif">
                      Select a format to preview
                    </p>
                  </div>
                ) : format === 'pdf' ? (
                  <div className="w-full max-w-[400px] aspect-[1/1.414] bg-white shadow-xl flex flex-col p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans text-black">
                    <div className="border-b-2 border-black pb-4 mb-6">
                      <h3 className="text-[18px] font-serif font-light tracking-tight leading-none mb-2">
                        Executive Summary
                      </h3>
                      <p className="text-[7px] uppercase tracking-widest text-gray-500">
                        {getRangeLabel()}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <p className="text-[6px] uppercase tracking-widest text-gray-500 mb-1">
                          Total Revenue
                        </p>
                        <div className="w-24 h-4 bg-gray-200 animate-pulse rounded" />
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <p className="text-[6px] uppercase tracking-widest text-gray-500 mb-1">
                          Sessions
                        </p>
                        <div className="w-16 h-4 bg-gray-200 animate-pulse rounded" />
                      </div>
                    </div>

                    <p className="text-[6px] uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-200 pb-2">
                      Category Sales
                    </p>
                    <div className="flex flex-col gap-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div className="w-32 h-3 bg-gray-100 rounded" />
                          <div className="w-12 h-3 bg-gray-100 rounded" />
                        </div>
                      ))}
                    </div>

                    {(range === 'ytd' || range === 'all') && (
                      <>
                        <p className="text-[6px] uppercase tracking-widest text-gray-500 mt-6 mb-3 border-b border-gray-200 pb-2">
                          Monthly Breakdown (Preview)
                        </p>
                        <div className="flex flex-col gap-3">
                          <div className="w-full h-8 bg-gray-50 border border-gray-100 rounded animate-pulse" />
                          <div className="w-full h-8 bg-gray-50 border border-gray-100 rounded animate-pulse delay-75" />
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full bg-white dark:bg-[#050505] shadow-lg border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden font-mono text-[9px]">
                    <div className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 py-3 gap-2">
                      <TableCellsIcon className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-zinc-500 tracking-wider">export_{range}.csv</span>
                    </div>
                    <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/50">
                      <div className="grid grid-cols-4 px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 font-bold text-zinc-400">
                        <span>Date</span>
                        <span>Patient</span>
                        <span>Service</span>
                        <span>Price</span>
                      </div>
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                          key={i}
                          className="grid grid-cols-4 px-4 py-3 text-zinc-600 dark:text-zinc-400 opacity-60"
                        >
                          <div className="w-16 h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                          <div className="w-20 h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse delay-75" />
                          <div className="w-24 h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse delay-150" />
                          <div className="w-12 h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse delay-200" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}

function RangeCard({
  id,
  label,
  active,
  onClick,
}: {
  id: string
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl border transition-all duration-300 ${
        active
          ? 'border-[#251101] dark:border-white bg-zinc-50 dark:bg-zinc-900/50 shadow-sm'
          : 'border-zinc-100 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20'
      }`}
    >
      <CalendarDaysIcon
        className={`w-5 h-5 ${active ? 'text-[#251101] dark:text-white' : 'text-[#595f72] opacity-50'}`}
      />
      <span
        className={`text-[8px] uppercase tracking-[0.2em] font-serif leading-none ${active ? 'text-[#251101] dark:text-white font-medium' : 'text-[#595f72]'}`}
      >
        {label}
      </span>
    </button>
  )
}

function FormatCard({
  id,
  title,
  desc,
  icon: Icon,
  active,
  onClick,
}: {
  id: string
  title: string
  desc: string
  icon: any
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-4 p-5 md:p-6 rounded-2xl border transition-all duration-300 text-left ${
        active
          ? 'border-[#251101] dark:border-white bg-zinc-50 dark:bg-zinc-900/50'
          : 'border-zinc-100 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20'
      }`}
    >
      <Icon
        className={`w-6 h-6 shrink-0 transition-colors ${active ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'}`}
      />
      <div className="flex flex-col gap-2">
        <span className="text-[11px] md:text-[12px] uppercase tracking-[0.2em] font-serif text-[#251101] dark:text-zinc-100 leading-none">
          {title}
        </span>
        <span className="text-[9px] text-[#595f72] font-serif tracking-wide leading-relaxed">
          {desc}
        </span>
      </div>
    </button>
  )
}
