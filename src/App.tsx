import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-bg-base text-text-primary font-sans selection:bg-gold/30">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/onboarding/result" element={<ProtectedRoute><OnboardingResult /></ProtectedRoute>} />
            
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/bible" element={<ProtectedRoute><Bible /></ProtectedRoute>} />
            <Route path="/bible/:book/:chapter" element={<ProtectedRoute><Bible /></ProtectedRoute>} />
            <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
            <Route path="/journal/:id" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
            <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
            <Route path="/notes/:id" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
