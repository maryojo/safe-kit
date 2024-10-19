'use client'

import React from 'react'
import { signOut } from "next-auth/react"

const LogoutButton = () => {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <button onClick={handleLogout} className="logout-button">
      Logout
    </button>
  )
}

export default LogoutButton