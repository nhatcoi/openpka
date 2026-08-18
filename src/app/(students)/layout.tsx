import React from 'react';
import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export const metadata: Metadata = {
  title: 'Quản lý Sinh viên',
  description: 'Hệ thống Quản lý Học vụ & Sinh viên - OpenPKA',
};

export default function StudentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell module="students">{children}</DashboardShell>;
}
