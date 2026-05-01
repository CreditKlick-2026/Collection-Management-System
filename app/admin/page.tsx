"use client";
import React from 'react';
import Admin from '@/components/Admin';
import AuthenticatedLayout from '../layout_authenticated';

export default function AdminPage() {
  return (
    <AuthenticatedLayout>
      <Admin />
    </AuthenticatedLayout>
  );
}
