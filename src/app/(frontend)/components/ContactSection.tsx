import { getPayload } from 'payload'
import config from '@/payload.config'
import React from 'react'
import { ContactConfig } from '@/payload-types'

export default async function ContactSection() {
  const payload = await getPayload({ config })

  const contactData = (await payload.findGlobal({
    slug: 'contact-config',
  })) as ContactConfig

  return (
    <section className="bg-white dark:bg-black border-t border-zinc-100 dark:border-white">
      <div className="max-w-7xl mx-auto px-6 py-2">
        {/* Header Section */}
        <div className="max-w-2xl">
          <p className="mt-4 text-[10px] uppercase tracking-[0.3em] font-medium text-zinc-400 dark:text-white">
            Contact
          </p>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-black dark:text-white">
            Get in touch
          </h1>
          <p className="text-[13px] font-light text-zinc-500 dark:text-white leading-relaxed max-w-md">
            Our friendly team is always here to chat.
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-y-8 gap-x-10 mt-6 md:grid-cols-2 lg:grid-cols-3 border-t border-zinc-100 dark:border-white pt-6">
          {/* Email Section */}
          <div className="group">
            <div className="text-black dark:text-white mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1"
                stroke="currentColor"
                className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <p className="text-[13px] font-light text-black dark:text-white tracking-wide">
              {contactData.email}
            </p>
          </div>

          {/* Office Section */}
          <div className="group">
            <div className="text-black dark:text-white mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1"
                stroke="currentColor"
                className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
            </div>
            <p className="text-[13px] font-light text-black dark:text-white leading-relaxed">
              {contactData.address}
            </p>
          </div>

          {/* Phone Section */}
          <div className="group">
            <div className="text-black dark:text-white mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1"
                stroke="currentColor"
                className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                />
              </svg>
            </div>
            <div className="flex flex-col space-y-4">
              <div>
                <p className="text-[13px] font-light text-black dark:text-white">
                  {contactData.phoneNumber}
                </p>
              </div>
              <div>
                <span className="block text-[8px] uppercase tracking-[0.2em] text-zinc-400 mb-1">
                  Schedule
                </span>
                <p className="text-[11px] font-light text-zinc-500 dark:text-white">
                  {contactData.officeHours || 'Mon-Fri from 8am to 5pm.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
