import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from '@/app/providers/AuthContext';
import { ThemeProvider } from '@/app/providers/ThemeContext';
import { TranslationProvider } from '@/app/providers/TranslationContext';
import PageTransition from '@/shared/components/PageTransition';
import Login from '@/features/auth/pages/Login';
import Signup from '@/features/auth/pages/Signup';
import Onboarding from '@/features/onboarding/pages/Onboarding';
import OnboardingResult from '@/features/onboarding/pages/OnboardingResult';
import Home from '@/features/home/pages/Home';
import Bible from '@/features/bible/pages/Bible';
import Journal from '@/features/journal/pages/Journal';
import Notes from '@/features/notes/pages/Notes';
import NoteDetail from '@/features/notes/pages/NoteDetail';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />

        <Route path="/onboarding" element={<ProtectedRoute><PageTransition><Onboarding /></PageTransition></ProtectedRoute>} />
        <Route path="/onboarding/result" element={<ProtectedRoute><PageTransition><OnboardingResult /></PageTransition></ProtectedRoute>} />

        <Route path="/home" element={<ProtectedRoute><PageTransition><Home /></PageTransition></ProtectedRoute>} />
        <Route path="/bible" element={<ProtectedRoute><PageTransition><Bible /></PageTransition></ProtectedRoute>} />
        <Route path="/bible/:book/:chapter" element={<ProtectedRoute><PageTransition><Bible /></PageTransition></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><PageTransition><Journal /></PageTransition></ProtectedRoute>} />
        <Route path="/journal/:id" element={<ProtectedRoute><PageTransition><Journal /></PageTransition></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><PageTransition><Notes /></PageTransition></ProtectedRoute>} />
        <Route path="/notes/:id" element={<ProtectedRoute><PageTransition><NoteDetail /></PageTransition></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TranslationProvider>
        <ThemeProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-bg-base text-text-primary font-sans selection:bg-gold/30">
              <AnimatedRoutes />
            </div>
          </BrowserRouter>
        </ThemeProvider>
      </TranslationProvider>
    </AuthProvider>
  );
}
