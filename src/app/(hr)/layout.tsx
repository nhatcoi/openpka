import React from 'react';
import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Quản trị Nhân sự (HR)',
  description: 'Hệ thống Quản lý Nhân sự, Giảng viên & Đánh giá - OpenPKA',
};

export default function HrLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell module="hr">{children}</DashboardShell>;
}