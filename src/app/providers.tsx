'use client';

import React from 'react';
import { AuthProvider } from '@/providers/AuthContext';
import { ThemeProvider } from '@/providers/ThemeContext';
import { TranslationProvider } from '@/providers/TranslationContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TranslationProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </TranslationProvider>
    </AuthProvider>
  );
}
