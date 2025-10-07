'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TmsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard immediately
    router.replace('/tms/dashboard');
  }, [router]);

  return null; // This page will redirect, so no UI needed
}
