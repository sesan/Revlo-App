import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase, isSupabaseConfigured } from '@/shared/services/supabase';
import { Eye, EyeOff } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.2045c0-.638-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2087 1.125-.8427 2.0796-1.7959 2.7182v2.2582h2.9086c1.7023-1.5673 2.6837-3.8773 2.6837-6.6173z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.4673-.8064 5.9564-2.1782l-2.9086-2.2582c-.8064.54-1.8377.8591-3.0478.8591-2.3441 0-4.3282-1.5832-5.0364-3.7091H.9573v2.3318C2.4382 15.99 5.4818 18 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.9636 10.7136c-.18-.54-.2836-1.1168-.2836-1.7136s.1036-1.1736.2836-1.7136V4.9545H.9573C.3477 6.1691 0 7.5436 0 9s.3477 2.8309.9573 4.0455l3.0063-2.3319z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.5773c1.3214 0 2.5077.4541 3.4405 1.3459l2.5827-2.5827C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.01.9573 4.9545l3.0063 2.3319C4.6718 5.1605 6.6559 3.5773 9 3.5773z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.465 2.194-1.187 2.942-.74.766-1.946 1.36-3.018 1.274-.132-1.112.391-2.28 1.111-3.001.728-.745 1.976-1.317 3.094-1.215zM20.937 17.256c-.336.764-.496 1.104-.93 1.762-.606.922-1.46 2.072-2.522 2.081-.946.01-1.19-.602-2.474-.596-1.284.008-1.553.608-2.5.598-1.062-.009-1.871-1.047-2.478-1.97-1.698-2.587-1.875-5.626-.828-7.235.742-1.142 1.91-1.811 3.01-1.811 1.12 0 1.825.615 2.752.615.899 0 1.446-.616 2.744-.616.98 0 2.017.53 2.757 1.443-2.43 1.334-2.036 4.815.469 5.729z" />
    </svg>
  );
}

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the Secrets panel in AI Studio.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Your Supabase project might be paused and waking up. Please wait a minute and try again.')), 15000)
      );

      const authPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      const result: any = await Promise.race([authPromise, timeoutPromise]);
      const { data, error } = result;

      if (error) throw error;

      // Wait a moment for session to be established
      if (data.user) {
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (existingProfile) {
          // Update existing profile
          await supabase
            .from('profiles')
            .update({
              email: email,
              full_name: fullName,
              onboarding_complete: false,
            })
            .eq('id', data.user.id);
        } else {
          // Insert new profile
          await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                email: email,
                full_name: fullName,
                onboarding_complete: false,
              },
            ]);
        }
      }

      // Route guards decide between onboarding and home based on profile state
      navigate('/');
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError('Failed to connect to database. Please configure Supabase URL and Key.');
      } else {
        setError(err.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the Secrets panel in AI Studio.');
      return;
    }

    setError('');
    setSocialLoading(provider);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err?.message || `Failed to continue with ${provider === 'google' ? 'Google' : 'Apple'}`);
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-[420px] card"
      >
        <div className="text-center mb-8">
          <h1 className="text-[32px] font-bold tracking-tighter text-text-primary mb-2">Verse</h1>
          <p className="text-[14px] text-text-secondary">The Bible app that never forgets.</p>
        </div>

        <div className="space-y-3 mb-5">
          <button
            type="button"
            onClick={() => handleSocialAuth('google')}
            disabled={loading || socialLoading !== null}
            className="w-full min-h-12 rounded-full border border-border bg-white text-text-primary text-[15px] font-medium hover:bg-bg-hover transition-colors disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2.5"
          >
            <GoogleIcon />
            {socialLoading === 'google' ? 'Connecting to Google...' : 'Continue with Google'}
          </button>
          <button
            type="button"
            onClick={() => handleSocialAuth('apple')}
            disabled={loading || socialLoading !== null}
            className="w-full min-h-12 rounded-full border border-border bg-white text-text-primary text-[15px] font-medium hover:bg-bg-hover transition-colors disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2.5"
          >
            <AppleIcon />
            {socialLoading === 'apple' ? 'Connecting to Apple...' : 'Continue with Apple'}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="h-px bg-border flex-1" />
          <span className="text-[13px] text-text-muted">or</span>
          <div className="h-px bg-border flex-1" />
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="sr-only" htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`input-base ${error ? 'border-error' : ''}`}
              required
            />
          </div>

          <div>
            <label className="sr-only" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`input-base ${error ? 'border-error' : ''}`}
              required
            />
          </div>

          <div className="relative">
            <label className="sr-only" htmlFor="password">Password</label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`input-base pr-12 ${error ? 'border-error' : ''}`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && (
            <p className="text-error text-[13px]" aria-live="polite">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || socialLoading !== null}
            className="btn-primary w-full mt-6"
          >
            {loading ? 'Creating Account...' : 'Create My Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[13px] text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-gold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
