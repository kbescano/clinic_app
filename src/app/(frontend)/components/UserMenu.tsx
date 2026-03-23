'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UserMenu({ email }: { email: string }) {
  const [isHovered, setIsHovered] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const adminName = email.split('@')[0]

  const handleLogout = async () => {
    setIsLoggingOut(true)

    // 1. Call the Payload logout endpoint
    await fetch('/api/users/logout', { method: 'POST' })

    // 2. Refresh the page to clear the 'user' state in the Navbar
    router.refresh()

    // 3. Send them home
    router.push('/')
  }

  return (
    <button
      onClick={handleLogout}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isLoggingOut}
      className={`
        flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg 
        transition-all duration-300 min-w-[140px] border disabled:opacity-50
        ${
          isHovered
            ? 'bg-primary border-primary text-[#122c4f] shadow-lg'
            : 'bg-gray border-gray text-white dark:text-white hover:bg-primary hover:border-primary'
        }
      `}
    >
      {isLoggingOut ? (
        <span className="animate-pulse">Logging out...</span>
      ) : isHovered ? (
        <>
          <span>Logout</span>
        </>
      ) : (
        <>
          <span className="truncate">{adminName}</span>
        </>
      )}
    </button>
  )
}
