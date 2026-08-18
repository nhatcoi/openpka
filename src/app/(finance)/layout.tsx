'use client';

import React from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell module="finance">{children}</DashboardShell>;
}
