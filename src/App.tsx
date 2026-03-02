import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ThemeProvider } from './lib/ThemeContext';
import PageTransition from './components/PageTransition';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import OnboardingResult from './pages/OnboardingResult';
import Home from './pages/Home';
import Bible from './pages/Bible';
import Journal from './pages/Journal';
import Notes from './pages/Notes';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profile } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  // If user is logged in but hasn't completed onboarding, redirect to onboarding
  // unless they are already on the onboarding route
  if (profile && !profile.onboarding_complete && !window.location.pathname.startsWith('/onboarding')) {
    return <Navigate to="/onboarding" replace />;
  }

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
        <Route path="/notes/:id" element={<ProtectedRoute><PageTransition><Notes /></PageTransition></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-bg-base text-text-primary font-sans selection:bg-gold/30">
            <AnimatedRoutes />
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
