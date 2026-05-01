"use client";
import { AppProvider as PolarisProvider } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';
import { AppProvider } from '@/context/AppContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <PolarisProvider i18n={enTranslations}>
        {children}
      </PolarisProvider>
    </AppProvider>
  );
}
