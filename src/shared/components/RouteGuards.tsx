'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthContext';

const AuthLoading = () => (
  <div className="min-h-screen flex items-center justify-center">Loading...</div>
);

function Redirect({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(to);
  }, [router, to]);
  return <AuthLoading />;
}

export const RootRedirect = () => {
  const { user, loading, profileLoading, profile } = useAuth();

  if (loading || profileLoading) return <AuthLoading />;
  if (!user) return <Redirect to="/login" />;

  return <Redirect to={profile?.onboarding_complete ? '/home' : '/onboarding'} />;
};

export const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profileLoading, profile } = useAuth();

  if (loading || profileLoading) return <AuthLoading />;
  if (!user) return <>{children}</>;

  return <Redirect to={profile?.onboarding_complete ? '/home' : '/onboarding'} />;
};

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profileLoading } = useAuth();

  if (loading || profileLoading) return <AuthLoading />;
  if (!user) return <Redirect to="/login" />;

  return <>{children}</>;
};

export const OnboardingRequiredRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profileLoading, profile } = useAuth();

  if (loading || profileLoading) return <AuthLoading />;
  if (!user) return <Redirect to="/login" />;
  if (!profile?.onboarding_complete) return <Redirect to="/onboarding" />;

  return <>{children}</>;
};

export const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profileLoading, profile } = useAuth();

  if (loading || profileLoading) return <AuthLoading />;
  if (!user) return <Redirect to="/login" />;
  if (profile?.onboarding_complete) return <Redirect to="/home" />;

  return <>{children}</>;
};
