import React from 'react';
import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Trang cá nhân',
  description: 'Thông tin tài khoản & hồ sơ người dùng - OpenPKA',
};

export default function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
