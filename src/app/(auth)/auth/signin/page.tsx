'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

function SignInForm() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        identifier,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email/Username hoặc password không đúng')
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMicrosoftSignIn = () => {
    // TODO: Implement Microsoft SSO
    alert('Tính năng đăng nhập bằng Microsoft đang được phát triển')
  }

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: 'linear-gradient(to bottom right, #f0f4f8, #e8eef5)' }}>
      {/* Back to Home Button */}
      <div className="absolute top-4 left-4 z-10">
        <Link
          href="/"
          className="flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-white/80 transition-colors shadow-sm bg-white/60 backdrop-blur-sm"
          style={{ color: '#2e4c92' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            e.currentTarget.style.color = '#1e3561';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
            e.currentTarget.style.color = '#2e4c92';
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Về trang chủ</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full">
          {/* Login Card */}
          <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Đăng nhập
              </h1>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                  Email hoặc Username
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    '--tw-ring-color': '#2e4c92',
                  } as React.CSSProperties & { '--tw-ring-color': string }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2e4c92';
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(46, 76, 146, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                  placeholder="Nhập email hoặc username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    '--tw-ring-color': '#2e4c92',
                  } as React.CSSProperties & { '--tw-ring-color': string }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2e4c92';
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(46, 76, 146, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Help Links */}
              <div className="flex items-center justify-between text-sm">
                <Link
                  href="/auth/forgot-password"
                  className="hover:underline transition-colors"
                  style={{ color: '#2e4c92' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#1e3561';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#2e4c92';
                  }}
                >
                  Quên mật khẩu
                </Link>
                <Link
                  href="/auth/help"
                  className="hover:underline transition-colors"
                  style={{ color: '#2e4c92' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#1e3561';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#2e4c92';
                  }}
                >
                  Trợ giúp!
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: '#2e4c92' }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#1e3561';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#2e4c92';
                  }
                }}
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Hoặc đăng nhập</span>
              </div>
            </div>

            {/* Microsoft Sign In Button */}
            <button
              type="button"
              onClick={handleMicrosoftSignIn}
              className="w-full py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2"
              style={{
                '--tw-ring-color': '#2e4c92',
              } as React.CSSProperties & { '--tw-ring-color': string }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(46, 76, 146, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 23 23"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0 0H11V11H0V0Z"
                  fill="#F25022"
                />
                <path
                  d="M12 0H23V11H12V0Z"
                  fill="#7FBA00"
                />
                <path
                  d="M0 12H11V23H0V12Z"
                  fill="#00A4EF"
                />
                <path
                  d="M12 12H23V23H12V12Z"
                  fill="#FFB900"
                />
              </svg>
              <span>Sign in using Microsoft</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-600">
          <p>
            Đơn vị phát triển:{' '}
            <span className="font-medium">Công Ty OggyGroup</span>
          </p>
          <p className="mt-1">
            Địa chỉ: Chương Mỹ, Hà Nội
          </p>
          <p className="mt-1">
            Điện thoại: <a href="tel:0376696037" className="hover:underline transition-colors" style={{ color: '#2e4c92' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#1e3561'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#2e4c92'; }}>037 6696037</a>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default function SignIn() {
  return (
      <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #f0f4f8, #e8eef5)' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#2e4c92', borderTopColor: 'transparent' }}></div>
          <p className="mt-2 text-gray-600">Đang tải...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
