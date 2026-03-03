import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/shared/services/supabase';
import { User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  profileLoading: boolean;
  profile: any | null;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  profileLoading: true,
  profile: null,
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      // First, get all profiles for this user (to detect duplicates)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId);

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (!profiles || profiles.length === 0) {
        console.log('No profile found, will be created on signup/login');
        setProfile(null);
      } else {
        if (profiles.length > 1) {
          console.warn('Multiple profiles found for user, using first one:', profiles.length);
        }
        setProfile(profiles[0]);
        console.log('Profile fetched successfully:', profiles[0]);
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      setProfileLoading(true);
      await fetchProfile(user.id);
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setProfileLoading(true);
        fetchProfile(session.user.id).then(() => {
          setProfileLoading(false);
          setLoading(false);
        });
      } else {
        setProfileLoading(false);
        setLoading(false);
      }
    }).catch(err => {
      console.error('Failed to check session:', err);
      setProfileLoading(false);
      setLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setProfileLoading(true);
        fetchProfile(session.user.id).finally(() => {
          setProfileLoading(false);
        });
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, profileLoading, profile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
