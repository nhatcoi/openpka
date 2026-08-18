'use client';

import React from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function HrLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell module="hr">{children}</DashboardShell>;
}