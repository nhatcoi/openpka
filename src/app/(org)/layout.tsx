import React from 'react';
import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Cơ cấu Tổ chức (Org)',
  description: 'Hệ thống Quản lý Cơ cấu Tổ chức & Đơn vị - OpenPKA',
};

export default function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell module="org">{children}</DashboardShell>;
}
