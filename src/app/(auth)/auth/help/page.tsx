'use client'

import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function Help() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 relative" style={{ background: 'linear-gradient(to bottom right, #f0f4f8, #e8eef5)' }}>
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

      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Trợ giúp
          </h1>
        </div>

        <div className="space-y-4 text-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Hướng dẫn đăng nhập
            </h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Nhập email hoặc username của bạn vào ô "Email hoặc Username"</li>
              <li>Nhập mật khẩu vào ô "Mật khẩu"</li>
              <li>Click vào nút "Đăng nhập" để đăng nhập vào hệ thống</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Quên mật khẩu?
            </h2>
            <p className="text-sm mb-2">
              Nếu bạn quên mật khẩu, vui lòng click vào link{' '}
              <Link href="/auth/forgot-password" className="hover:underline transition-colors" style={{ color: '#2e4c92' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#1e3561'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#2e4c92'; }}>
                "Quên mật khẩu"
              </Link>
              {' '}để đặt lại mật khẩu.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Đăng nhập bằng Microsoft
            </h2>
            <p className="text-sm">
              Bạn có thể đăng nhập bằng tài khoản Microsoft của mình bằng cách click vào nút "Sign in using Microsoft".
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Liên hệ hỗ trợ
            </h2>
            <p className="text-sm">
              Nếu bạn gặp vấn đề khi đăng nhập, vui lòng liên hệ với quản trị viên hệ thống.
            </p>
            <p className="text-sm mt-2">
              <strong>Đơn vị phát triển:</strong> Công Ty OggyGroup
            </p>
            <p className="text-sm">
              <strong>Địa chỉ:</strong> Chương Mỹ, Hà Nội
            </p>
            <p className="text-sm">
              <strong>Điện thoại:</strong>{' '}
              <a href="tel:0376696037" className="hover:underline transition-colors" style={{ color: '#2e4c92' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#1e3561'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#2e4c92'; }}>
                037 6696037
              </a>
            </p>
          </div>
        </div>

        <div className="text-center pt-4 border-t border-gray-200">
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

