'use client';

import React from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell module="org">{children}</DashboardShell>;
}
