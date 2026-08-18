'use client';

import React from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function TmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell module="tms">{children}</DashboardShell>;
}
