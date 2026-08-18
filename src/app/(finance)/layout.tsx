import React from 'react';
import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Quản lý Tài chính',
  description: 'Hệ thống Quản lý Học phí & Định mức Tài chính - OpenPKA',
};

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell module="finance">{children}</DashboardShell>;
}
