"use client";
import React from 'react';
import Dashboard from '@/components/Dashboard';
import AuthenticatedLayout from '../layout_authenticated';

export default function DashboardPage() {
  return (
    <AuthenticatedLayout>
      <Dashboard />
    </AuthenticatedLayout>
  );
}
