"use client";
import React from 'react';
import Approvals from '@/components/Approvals';
import AuthenticatedLayout from '../layout_authenticated';

export default function ApprovalsPage() {
  return (
    <AuthenticatedLayout>
      <Approvals />
    </AuthenticatedLayout>
  );
}
