"use client";
import React from 'react';
import PTPs from '@/components/PTPs';
import AuthenticatedLayout from '../layout_authenticated';

export default function PTPPage() {
  return (
    <AuthenticatedLayout>
      <PTPs />
    </AuthenticatedLayout>
  );
}
