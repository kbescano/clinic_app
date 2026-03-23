import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers as getHeaders } from 'next/headers'
import Link from 'next/link'
import React from 'react'
import MobileMenu from './MobileMenu'
import UserMenu from './UserMenu'

interface NavbarProps {
  logoFirst: string
  logoSecond: string
}

export default async function Navbar({ logoFirst, logoSecond }: NavbarProps) {
  const payload = await getPayload({ config })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  return (
    <nav className="relative bg-[#122c4f] dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 z-50">
      <div className="container p-6 mx-auto lg:flex lg:justify-between lg:items-center">
        <div className="flex items-center justify-between w-full lg:w-auto">
          <Link href="/" className="text-xl font-bold text-primary dark:text-white">
            {logoFirst}
            <span className="text-secondary">{logoSecond}</span>
          </Link>

          <div className="flex lg:hidden">
            {/* 1. PASS USER TO MOBILE MENU */}
            <MobileMenu />
          </div>
        </div>

        {/* DESKTOP NAV */}
        <div className="hidden lg:flex lg:items-center">
          <div className="flex items-center text-white dark:text-gray-200">
            <Link className="lg:mx-6 hover:text-primary transition-colors" href="/">
              Home
            </Link>
            <Link className="lg:mx-6 hover:text-primary transition-colors" href="/#services">
              Services
            </Link>

            {user && (
              <>
                <Link className="lg:mx-6 text-primary font-bold" href="/dashboard">
                  Dashboard
                </Link>
                <Link className="lg:mx-6 hover:text-primary text-sm" href="/medical-history">
                  Medical History
                </Link>
                <Link
                  className="lg:mx-6 hover:text-primary text-sm"
                  href="/dashboard-secret-portal"
                >
                  Admin Settings
                </Link>
              </>
            )}
          </div>

          <div className="lg:ml-6">
            {!user ? (
              <Link
                href="/dashboard-secret-portal"
                className="px-5 py-2 text-sm text-white bg-primary rounded-lg font-medium"
              >
                Admin Login
              </Link>
            ) : (
              <UserMenu email={user.name} />
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
