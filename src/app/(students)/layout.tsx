'use client';

import React from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function StudentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell module="students">{children}</DashboardShell>;
}
