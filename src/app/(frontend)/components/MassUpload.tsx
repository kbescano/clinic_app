'use client'

import React, { useState } from 'react'
import FadeIn from './FadeIn'
import {
  CloudArrowUpIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline'

export default function MassUpload() {
  const [jsonInput, setJsonInput] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

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
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Invalid JSON format.' })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <FadeIn>
      <div className="max-w-6xl mx-auto p-8 md:p-12 border border-zinc-100 dark:border-zinc-900 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* LEFT COLUMN: Info & Status */}
          <div className="lg:col-span-5 space-y-8">
            <header>
              <div className="w-12 h-12 bg-zinc-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                <CloudArrowUpIcon className="w-6 h-6 text-zinc-400" />
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-zinc-400 mb-2">
                System Utilities
              </p>
              <h2 className="text-4xl font-light tracking-tight dark:text-white uppercase">
                Mass <br /> <span className="text-zinc-300">Upload</span>
              </h2>
            </header>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-100 dark:border-zinc-900">
                <DocumentTextIcon className="w-5 h-5 text-zinc-300 mt-1" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest dark:text-white">
                    Format Requirement
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed lowercase">
                    Ensure your data is a valid JSON array of appointment objects.
                  </p>
                </div>
              </div>

              {status && (
                <div
                  className={`p-6 rounded-3xl animate-in fade-in slide-in-from-left-4 duration-500 ${
                    status.type === 'success'
                      ? 'bg-emerald-500/5 border border-emerald-500/10 text-emerald-600'
                      : 'bg-red-500/5 border border-red-500/10 text-red-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span className="text-[9px] uppercase tracking-[0.2em] font-bold">
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
              <div className="absolute top-6 left-6 flex items-center gap-2 pointer-events-none">
                <CodeBracketIcon className="w-3 h-3 text-zinc-400" />
                <span className="text-[8px] uppercase tracking-widest text-zinc-400 font-bold">
                  JSON Input
                </span>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='[ { "firstName": "Bryan", ... } ]'
                className="w-full h-[400px] bg-zinc-50 dark:bg-white/[0.01] border border-zinc-100 dark:border-zinc-900 rounded-2xl p-12 pt-16 text-[11px] font-mono outline-none focus:border-black dark:focus:border-white transition-all resize-none shadow-inner"
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={isUploading || !jsonInput}
              className="group relative overflow-hidden w-full py-7 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-[0.6em] rounded-full transition-all active:scale-[0.98] disabled:opacity-10"
            >
              <span className="relative z-10">
                {isUploading ? 'Validating & Importing...' : 'Execute Import'}
              </span>
              <div className="absolute inset-0 bg-zinc-800 dark:bg-zinc-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>
    </FadeIn>
  )
}
