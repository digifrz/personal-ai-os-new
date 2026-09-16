import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Sparkles,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
  Layers,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthGate: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email.trim(), password, name.trim());
        setSuccess('Account created! Welcome to Personal AI OS.');
      } else {
        await signInWithEmail(email.trim(), password);
        setSuccess('Authenticated successfully. Loading workspace...');
      }
    } catch (err: any) {
      console.warn('Auth gate notice:', err?.message || err);
      let msg = err?.message || 'Authentication failed.';
      if (
        msg.includes('auth/invalid-credential') ||
        msg.includes('auth/wrong-password') ||
        msg.includes('auth/user-not-found')
      ) {
        msg = 'Invalid email or password. Please check your credentials or create an account.';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'An account with this email already exists. Switch to Sign In.';
      } else if (msg.includes('auth/popup-closed-by-user')) {
        msg = 'Sign-in window was closed.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const ok = await signInWithGoogle();
      if (ok) {
        setSuccess('Signed in with Google. Loading workspace...');
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user') ||
        err?.message?.includes('cancelled-popup-request')
      ) {
        return;
      }
      if (err?.code === 'auth/popup-blocked') {
        setError(
          'Popup was blocked by your browser. Please enable popups or use email & password.'
        );
        return;
      }
      console.warn('Google Auth notice:', err?.message || err);
      setError(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Account option
  const handleQuickDemo = async () => {
    setEmail('researcher@workspace.ai');
    setPassword('Workspace2026!');
    setIsSignUp(false);
    setError(null);
    setLoading(true);
    try {
      // Try signing in first
      try {
        await signInWithEmail('researcher@workspace.ai', 'Workspace2026!');
        setSuccess('Welcome to Demo Workspace!');
      } catch {
        // If demo doesn't exist yet, sign up
        await signUpWithEmail(
          'researcher@workspace.ai',
          'Workspace2026!',
          'Workspace Researcher'
        );
        setSuccess('Demo Account initialized!');
      }
    } catch (err: any) {
      setError(err?.message || 'Could not connect demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#080D18] text-[#F1F5F9] px-4 py-12 overflow-hidden select-none">
      {/* Background Gradients & Soft Grid */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#8B5CF6]/15 blur-[120px]" />
        <div className="absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-[#22D3EE]/12 blur-[120px]" />
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-[#A78BFA]/10 blur-[140px]" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'radial-gradient(rgba(139, 92, 246, 0.25) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
      >
        {/* Left Side: Brand Showcase & Architecture */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-3.5 py-1 text-xs font-semibold text-[#C4B5FD] backdrop-blur-md">
            <Lock className="h-3.5 w-3.5 text-[#8B5CF6]" />
            <span>Authenticated Workspace Only</span>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#22D3EE] text-lg font-bold text-white shadow-[0_0_25px_rgba(139,92,246,0.4)]">
                ✦
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Personal AI OS
              </h1>
            </div>
            <p className="mt-3 text-sm text-[#94A3B8] leading-relaxed">
              Your private, secure digital command center. To protect your data,
              tasks, notes, and AI contexts, access requires authenticated
              verification.
            </p>
          </div>

          {/* Feature Pillars */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-2xl border border-[#26344A] bg-[#111827]/80 p-3.5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Database className="h-3.5 w-3.5 text-emerald-400" />
                <span>Cloud Firestore</span>
              </div>
              <p className="mt-1 text-[11px] text-[#94A3B8]">
                Real-time sync with strict ABAC rules
              </p>
            </div>

            <div className="rounded-2xl border border-[#26344A] bg-[#111827]/80 p-3.5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Cpu className="h-3.5 w-3.5 text-[#A78BFA]" />
                <span>Gemini 3.6 Flash</span>
              </div>
              <p className="mt-1 text-[11px] text-[#94A3B8]">
                Server-side neural agent copilot
              </p>
            </div>

            <div className="rounded-2xl border border-[#26344A] bg-[#111827]/80 p-3.5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Layers className="h-3.5 w-3.5 text-blue-400" />
                <span>Integrated Suite</span>
              </div>
              <p className="mt-1 text-[11px] text-[#94A3B8]">
                Tasks, notes, files, calendar &amp; goals
              </p>
            </div>

            <div className="rounded-2xl border border-[#26344A] bg-[#111827]/80 p-3.5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Users className="h-3.5 w-3.5 text-amber-400" />
                <span>The Lounge</span>
              </div>
              <p className="mt-1 text-[11px] text-[#94A3B8]">
                Community channels, threads &amp; stories
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="lg:col-span-6">
          <div className="rounded-3xl border border-[#26344A] bg-[#111827]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {/* Header Tabs */}
            <div className="flex items-center justify-between border-b border-[#26344A] pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isSignUp ? 'Create Workspace' : 'Sign In'}
                </h2>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  {isSignUp
                    ? 'Start your private command center'
                    : 'Access your existing workspace'}
                </p>
              </div>

              <div className="flex rounded-xl bg-[#080D18] p-1 border border-[#26344A]">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setError(null);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    !isSignUp
                      ? 'bg-[#8B5CF6] text-white shadow-sm'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setError(null);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    isSignUp
                      ? 'bg-[#8B5CF6] text-white shadow-sm'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Google Authentication */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#26344A] bg-[#0D1422] p-3 text-xs font-bold text-white hover:border-[#8B5CF6] hover:bg-[#182235] transition-all disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="w-full border-t border-[#26344A]" />
              <span className="absolute bg-[#111827] px-3 text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">
                or with email
              </span>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-bold text-[#94A3B8] mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Farzan"
                    className="w-full rounded-xl border border-[#26344A] bg-[#080D18] px-3.5 py-2.5 text-xs text-white placeholder-[#64748B] outline-none focus:border-[#8B5CF6] transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#94A3B8] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-[#26344A] bg-[#080D18] px-3.5 py-2.5 text-xs text-white placeholder-[#64748B] outline-none focus:border-[#8B5CF6] transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#94A3B8] mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#26344A] bg-[#080D18] px-3.5 py-2.5 text-xs text-white placeholder-[#64748B] outline-none focus:border-[#8B5CF6] transition-all pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-[#94A3B8] hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-bold text-[#94A3B8] mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#26344A] bg-[#080D18] px-3.5 py-2.5 text-xs text-white placeholder-[#64748B] outline-none focus:border-[#8B5CF6] transition-all"
                  />
                </div>
              )}

              {/* Status alerts */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs font-medium text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8B5CF6] py-3 text-xs font-bold text-white hover:bg-[#A78BFA] transition-all shadow-[0_0_20px_rgba(139,92,246,0.35)] disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : isSignUp ? 'Create Workspace' : 'Open Workspace'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>

            {/* Quick Demo Button */}
            <div className="mt-4 pt-4 border-t border-[#26344A] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <span className="text-[#94A3B8]">Want to test instantly?</span>
              <button
                type="button"
                onClick={handleQuickDemo}
                disabled={loading}
                className="font-semibold text-[#22D3EE] hover:text-white transition-colors underline-offset-4 hover:underline"
              >
                Load Demo Workspace &rarr;
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
