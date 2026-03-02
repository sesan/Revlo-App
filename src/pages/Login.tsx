import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the Secrets panel in AI Studio.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Add a 15-second timeout in case the Supabase project is paused and waking up
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Your Supabase project might be paused and waking up. Please wait a minute and try again.')), 15000)
      );

      const authPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const result: any = await Promise.race([authPromise, timeoutPromise]);
      const { error } = result;

      if (error) throw error;
      
      // The AuthContext will handle the redirect based on onboarding status
      navigate('/home');
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError('Failed to connect to database. Please configure Supabase URL and Key.');
      } else {
        setError(err.message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
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

        <form onSubmit={handleLogin} className="space-y-4">
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
            disabled={loading}
            className="btn-primary w-full mt-6"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-4">
          <p className="text-[13px] text-text-muted">
            Don't have an account?{' '}
            <Link to="/signup" className="text-gold hover:underline">
              Sign up
            </Link>
          </p>
          <button className="text-[13px] text-text-muted hover:underline">
            Forgot password?
          </button>
        </div>
      </motion.div>
    </div>
  );
}
