'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AccountTree as AccountTreeIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  AttachMoney as AttachMoneyIcon,
  MenuBook as MenuBookIcon,
  ArrowForward as ArrowForwardIcon,
  Login as LoginIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';

const moduleCards = [
  {
    id: 'org-management',
    title: 'Quản lý cơ cấu tổ chức',
    description: 'Tạo/sửa đơn vị (khoa, viện, bộ môn), thiết lập cây tổ chức, bổ nhiệm vai trò, báo cáo sơ đồ.',
    icon: AccountTreeIcon,
    path: '/org/dashboard',
  },
  {
    id: 'hr-management',
    title: 'Quản lý nhân sự',
    description: 'Hồ sơ giảng viên/nhân viên, bổ nhiệm – luân chuyển, học vị, hợp đồng, báo cáo chuẩn giảng viên.',
    icon: PeopleIcon,
    path: '/hr/dashboard',
  },
  {
    id: 'education-management',
    title: 'Quản lý đào tạo',
    description: 'Ngành, chương trình đào tạo, học phần, kế hoạch giảng dạy.',
    icon: SchoolIcon,
    path: '/tms/dashboard',
  },
  {
    id: 'financial-management',
    title: 'Quản lý tài chính – học phí',
    description: 'Thu học phí, học bổng – miễn giảm, công nợ, báo cáo tài chính.',
    icon: AttachMoneyIcon,
    path: '/finance',
  },
  {
    id: 'documentation',
    title: 'Tài liệu hệ thống',
    description: 'Xem và tải xuống tài liệu hướng dẫn, tài liệu kỹ thuật, và các tài liệu khác của hệ thống.',
    icon: MenuBookIcon,
    path: '/documentation',
  },
];

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleCardClick = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(to bottom, #f0f4f8 0%, #ffffff 100%)' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Image
                src="/logo.png"
                alt="OpenAcademix Logo"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">OpenAcademix</h1>
                <p className="text-xs text-gray-500">Hệ thống quản lý đào tạo</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {session ? (
                <Link
                  href="/me"
                  className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: '#2e4c92' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1e3561';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2e4c92';
                  }}
                >
                  <AccountCircleIcon className="w-4 h-4" />
                  <span>Tài khoản</span>
                </Link>
              ) : (
                <Link
                  href="/auth/signin?callbackUrl=/"
                  className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: '#2e4c92' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1e3561';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2e4c92';
                  }}
                >
                  <LoginIcon className="w-4 h-4" />
                  <span>Đăng nhập</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div 
            className="relative rounded-2xl p-8 md:p-12 text-white shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #2e4c92 0%, #1e3561 100%)',
            }}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
              <div className="absolute top-10 right-10 w-32 h-32 border-4 border-white rounded-full"></div>
              <div className="absolute top-20 right-20 w-16 h-16 border-4 border-white rounded-full"></div>
            </div>
            
            <div className="relative z-10 max-w-3xl">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Hệ thống quản lý Đại Học Phenikaa
              </h2>
              <p className="text-lg md:text-xl mb-6 opacity-90">
                Hệ thống quản lý toàn diện cho các cơ sở đào tạo
              </p>
              <p className="text-base opacity-80">
                Quản lý tổ chức, nhân sự, đào tạo, tài chính và nhiều hơn nữa trong một nền tảng thống nhất
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              Các module chính
            </h3>
            <p className="text-gray-600">
              Chọn module để bắt đầu sử dụng hệ thống
            </p>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {moduleCards.map((module) => {
              const IconComponent = module.icon;
              return (
                <div
                  key={module.id}
                  onClick={() => handleCardClick(module.path)}
                  className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 hover:border-transparent overflow-hidden"
                  style={{
                    transform: 'translateY(0)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    const icon = e.currentTarget.querySelector('.module-icon');
                    if (icon) {
                      (icon as HTMLElement).style.transform = 'scale(1.1) rotate(5deg)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    const icon = e.currentTarget.querySelector('.module-icon');
                    if (icon) {
                      (icon as HTMLElement).style.transform = 'scale(1) rotate(0deg)';
                    }
                  }}
                >
                  <div className="p-6 h-full flex flex-col">
                    {/* Icon */}
                    <div className="mb-4 flex justify-center">
                      <div
                        className="module-icon w-16 h-16 rounded-xl flex items-center justify-center text-white transition-transform duration-300"
                        style={{ backgroundColor: '#2e4c92' }}
                      >
                        <IconComponent className="w-8 h-8" />
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="text-xl font-bold text-gray-900 mb-3 text-center">
                      {module.title}
                    </h4>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 text-center flex-grow leading-relaxed">
                      {module.description}
                    </p>

                    {/* Action indicator */}
                    <div className="flex items-center justify-center space-x-2 text-sm font-medium mt-auto pt-4 border-t border-gray-100">
                      <span style={{ color: '#2e4c92' }}>Truy cập</span>
                      <ArrowForwardIcon 
                        className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" 
                        style={{ color: '#2e4c92' }}
                      />
                    </div>

                    {/* Hover accent bar */}
                    <div
                      className="h-1 w-0 group-hover:w-full transition-all duration-300 mt-4"
                      style={{ backgroundColor: '#2e4c92' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="mb-4">
              <h4 className="text-lg font-bold text-gray-900 mb-2">OpenAcademix</h4>
              <p className="text-sm text-gray-600">
                Hệ thống quản lý đào tạo toàn diện
              </p>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Đơn vị phát triển:</span> Công Ty OggyGroup
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Địa chỉ:</span> Chương Mỹ, Hà Nội
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Điện thoại:</span>{' '}
                <a 
                  href="tel:0376696037" 
                  className="hover:underline transition-colors"
                  style={{ color: '#2e4c92' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#1e3561';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#2e4c92';
                  }}
                >
                  037 6696037
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
