'use client'

import React, { useState, useEffect } from 'react'
import FadeIn from './FadeIn'
import { CheckCircleIcon, DocumentTextIcon, CodeBracketIcon } from '@heroicons/react/24/outline'

export default function MassUpload() {
  const [jsonInput, setJsonInput] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [drawLine, setDrawLine] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDrawLine(true), 500)
    return () => clearTimeout(timer)
  }, [])

  const handleUpload = async () => {
    if (!jsonInput) return
    setIsUploading(true)
    setStatus(null)

    try {
      const data = JSON.parse(jsonInput)
      const res = await fetch('/api/admin/mass-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setStatus({ type: 'success', msg: `Imported ${data.length} records successfully.` })
        setJsonInput('')
      } else {
        const errData = await res.json()
        throw new Error(errData.error || 'Upload failed')
      }
    } catch (err: unknown) {
      const errorMessage = (err as Error).message || 'Invalid JSON format.'
      setStatus({ type: 'error', msg: errorMessage })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <FadeIn>
      <div className="max-w-5xl mx-auto p-8 md:p-12 border border-zinc-50 dark:border-zinc-900 bg-white dark:bg-black shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* LEFT COLUMN: Info & Status */}
          <div className="lg:col-span-5 space-y-10">
            <header className="flex items-start gap-5">
              <div
                className={`w-[1px] bg-zinc-900 dark:bg-white transition-all duration-1000 ease-out origin-top ${
                  drawLine ? 'h-10 md:h-12 opacity-100' : 'h-0 opacity-0'
                }`}
              />
              <div className="space-y-1">
                <p className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] text-zinc-400 font-serif ">
                  Data Integration
                </p>
                <h2 className="text-[20px] md:text-[24px] font-light tracking-tight dark:text-white uppercase font-serif leading-tight">
                  Mass <br /> <span className="text-zinc-300 dark:text-zinc-700">Upload</span>
                </h2>
              </div>
            </header>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-6 bg-zinc-50/30 dark:bg-zinc-900/20 border border-zinc-100 dark:border-zinc-900/50">
                <DocumentTextIcon className="w-4 h-4 text-zinc-300 mt-0.5" />
                <div>
                  <p className="text-[8px] md:text-[9px] font-medium uppercase tracking-[0.3em] dark:text-zinc-300 font-serif">
                    Format Requirement
                  </p>
                  <p className="text-[9px] md:text-[10px] text-zinc-400 mt-2 leading-relaxed font-serif opacity-70">
                    Ensure your data is a valid JSON array of appointment objects.
                  </p>
                </div>
              </div>

              {status && (
                <div
                  className={`p-6 animate-in fade-in slide-in-from-left-4 duration-500 border ${
                    status.type === 'success'
                      ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-700/70'
                      : 'bg-red-500/5 border-red-500/10 text-red-700/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="w-3 h-3" />
                    <span className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-medium font-serif ">
                      {status.msg}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Input Area */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="relative group">
              <div className="absolute top-5 left-8 flex items-center gap-3 pointer-events-none">
                <CodeBracketIcon className="w-3 h-3 text-zinc-300" />
                {/* Changed span to label and added htmlFor */}
                <label
                  htmlFor="json-mass-upload"
                  className="text-[8px] uppercase tracking-[0.4em] text-zinc-300 font-medium font-serif"
                >
                  JSON Registry
                </label>
              </div>
              <textarea
                id="json-mass-upload"
                name="jsonRegistry"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='[ { "firstName": "Bryan", ... } ]'
                className="w-full h-[380px] bg-zinc-50/20 dark:bg-zinc-900/10 border border-zinc-100 dark:border-zinc-900 p-8 pt-16 text-[10px] font-mono outline-none focus:border-zinc-200 dark:focus:border-zinc-700 transition-all resize-none shadow-sm placeholder:text-zinc-200 dark:placeholder:text-zinc-800"
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={isUploading || !jsonInput}
              className="group relative overflow-hidden w-full py-6 bg-zinc-900 dark:bg-white text-white dark:text-black text-[9px] font-medium uppercase tracking-[0.5em] font-serif transition-all active:scale-[0.99] disabled:opacity-20"
            >
              <span className="relative z-10">
                {isUploading ? 'Validating & Importing...' : 'Execute Import'}
              </span>
              <div className="absolute inset-0 bg-black dark:bg-zinc-100 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
            </button>
          </div>
        </div>
      </div>
    </FadeIn>
  )
}
