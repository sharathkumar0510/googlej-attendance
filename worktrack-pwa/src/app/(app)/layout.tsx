// src/app/(app)/layout.tsx
import MainLayout from '@/components/layout/MainLayout';
import React from 'react';

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Here you might add auth checks using middleware or a client-side check
  // For now, just applying the layout
  return <MainLayout>{children}</MainLayout>;
}
