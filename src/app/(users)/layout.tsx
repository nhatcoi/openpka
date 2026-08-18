import React from 'react';
import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Người dùng & Phân quyền',
  description: 'Quản lý tài khoản, vai trò & phân quyền - OpenPKA',
};

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
