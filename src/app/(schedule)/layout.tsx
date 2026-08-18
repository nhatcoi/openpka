import React from 'react';
import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Quản lý Lịch học & Thi',
  description: 'Hệ thống Quản lý Thời khóa biểu & Lịch thi - OpenPKA',
};

export default function ScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell module="schedule">{children}</DashboardShell>;
}
