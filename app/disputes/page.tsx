"use client";
import React from 'react';
import Disputes from '@/components/Disputes';
import AuthenticatedLayout from '../layout_authenticated';

export default function DisputesPage() {
  return (
    <AuthenticatedLayout>
      <Disputes />
    </AuthenticatedLayout>
  );
}
