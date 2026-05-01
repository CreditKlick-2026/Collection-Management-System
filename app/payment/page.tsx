"use client";
import React from 'react';
import Payments from '@/components/Payments';
import AuthenticatedLayout from '../layout_authenticated';

export default function PaymentsPage() {
  return (
    <AuthenticatedLayout>
      <Payments />
    </AuthenticatedLayout>
  );
}
