'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    // TODO: Implement password reset logic
    setTimeout(() => {
      setMessage('Tính năng quên mật khẩu đang được phát triển. Vui lòng liên hệ quản trị viên.')
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative" style={{ background: 'linear-gradient(to bottom right, #f0f4f8, #e8eef5)' }}>
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

      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Quên mật khẩu
          </h1>
          <p className="text-sm text-gray-600">
            Nhập email của bạn để nhận link đặt lại mật khẩu
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
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
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {message && (
            <div className={`px-4 py-3 rounded-md text-sm ${
              message.includes('phát triển') 
                ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                : 'bg-green-50 border border-green-200 text-green-700'
            }`}>
              {message}
            </div>
          )}

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
            {isLoading ? 'Đang xử lý...' : 'Gửi link đặt lại mật khẩu'}
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/auth/signin"
            className="text-sm hover:underline transition-colors"
            style={{ color: '#2e4c92' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#1e3561';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#2e4c92';
            }}
          >
            ← Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}

