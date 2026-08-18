import React from 'react';
import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Quản lý Đào tạo (TMS)',
  description: 'Hệ thống Quản lý Khung chương trình, Học phần & Khóa học - OpenPKA',
};

export default function TmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell module="tms">{children}</DashboardShell>;
}
