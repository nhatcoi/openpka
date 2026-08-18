'use client';

import React from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function ScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell module="schedule">{children}</DashboardShell>;
}
