"use client";
import React from 'react';
import Leads from '@/components/Leads';
import AuthenticatedLayout from '../layout_authenticated';

export default function LeadsPage() {
  return (
    <AuthenticatedLayout>
      <Leads />
    </AuthenticatedLayout>
  );
}
