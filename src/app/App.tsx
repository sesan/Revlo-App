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

const AuthLoading = () => (
  <div className="min-h-screen flex items-center justify-center">Loading...</div>
);

const RootRedirect = () => {
  const { user, loading, profileLoading, profile } = useAuth();

  if (loading || profileLoading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={profile?.onboarding_complete ? '/home' : '/onboarding'} replace />;
};

const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profileLoading, profile } = useAuth();

  if (loading || profileLoading) return <AuthLoading />;
  if (!user) return <>{children}</>;

  return <Navigate to={profile?.onboarding_complete ? '/home' : '/onboarding'} replace />;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profileLoading } = useAuth();

  if (loading || profileLoading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

const OnboardingRequiredRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profileLoading, profile } = useAuth();

  if (loading || profileLoading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile?.onboarding_complete) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
};

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profileLoading, profile } = useAuth();

  if (loading || profileLoading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.onboarding_complete) return <Navigate to="/home" replace />;

  return <>{children}</>;
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<PublicOnlyRoute><PageTransition><Login /></PageTransition></PublicOnlyRoute>} />
        <Route path="/signup" element={<PublicOnlyRoute><PageTransition><Signup /></PageTransition></PublicOnlyRoute>} />

        <Route path="/onboarding" element={<OnboardingRoute><PageTransition><Onboarding /></PageTransition></OnboardingRoute>} />
        <Route path="/onboarding/result" element={<ProtectedRoute><PageTransition><OnboardingResult /></PageTransition></ProtectedRoute>} />

        <Route path="/home" element={<OnboardingRequiredRoute><PageTransition><Home /></PageTransition></OnboardingRequiredRoute>} />
        <Route path="/bible" element={<OnboardingRequiredRoute><PageTransition><Bible /></PageTransition></OnboardingRequiredRoute>} />
        <Route path="/bible/:book/:chapter" element={<OnboardingRequiredRoute><PageTransition><Bible /></PageTransition></OnboardingRequiredRoute>} />
        <Route path="/journal" element={<OnboardingRequiredRoute><PageTransition><Journal /></PageTransition></OnboardingRequiredRoute>} />
        <Route path="/journal/:id" element={<OnboardingRequiredRoute><PageTransition><Journal /></PageTransition></OnboardingRequiredRoute>} />
        <Route path="/notes" element={<OnboardingRequiredRoute><PageTransition><Notes /></PageTransition></OnboardingRequiredRoute>} />
        <Route path="/notes/:id" element={<OnboardingRequiredRoute><PageTransition><NoteDetail /></PageTransition></OnboardingRequiredRoute>} />
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
