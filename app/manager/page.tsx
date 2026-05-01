"use client";
import React from 'react';
import ManagerPanel from '@/components/ManagerPanel';
import AuthenticatedLayout from '../layout_authenticated';

export default function ManagerPage() {
  return (
    <AuthenticatedLayout>
      <ManagerPanel />
    </AuthenticatedLayout>
  );
}
