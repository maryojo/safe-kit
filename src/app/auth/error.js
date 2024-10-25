'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'Database connection failed. Please try again later.':
        return {
          title: 'Connection Error',
          message: 'We are currently experiencing technical difficulties. Please try again later.',
          action: 'Try Again'
        }
      case 'Configuration':
        return {
          title: 'Server Error',
          message: 'There is a problem with the server configuration.',
          action: 'Contact Support'
        }
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          message: 'You do not have permission to sign in.',
          action: 'Sign In'
        }
      default:
        return {
          title: 'Authentication Error',
          message: 'An error occurred during authentication.',
          action: 'Try Again'
        }
    }
  }

  const errorDetails = getErrorMessage(error)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          {errorDetails.title}
        </h2>
        <p className="mt-2 text-gray-600">
          {errorDetails.message}
        </p>
        <div className="mt-5">
          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {errorDetails.action}
          </Link>
        </div>
      </div>
    </div>
  )
}