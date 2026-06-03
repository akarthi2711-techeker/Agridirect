import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Leaf, Mail, KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState('request'); // 'request' | 'reset'
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toast.success('Reset instructions sent!');
      // In demo mode the token is returned directly
      if (data.resetToken) {
        setToken(data.resetToken);
        toast('Demo mode: token pre-filled below', { icon: '🔑' });
      }
      setStep('reset');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      toast.success('Password reset successfully! You can now login.');
      setStep('done');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Token may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-charcoal px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-paddy-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {step === 'done' ? 'Password Reset!' : t('auth.forgotPassword')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {step === 'request' && 'Enter your email to receive a reset link'}
            {step === 'reset' && 'Enter your new password'}
            {step === 'done' && 'Your password has been updated successfully'}
          </p>
        </div>

        <div className="card p-8">
          {step === 'request' && (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="label">{t('auth.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" required className="input-field pl-9" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
                {loading ? t('common.loading') : 'Send Reset Link'}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="label">Reset Token</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" required className="input-field pl-9 font-mono text-xs"
                    placeholder="Paste your reset token"
                    value={token} onChange={e => setToken(e.target.value)} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Check your email for the reset token</p>
              </div>
              <div>
                <label className="label">{t('auth.newPassword')}</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} required className="input-field pr-10"
                    placeholder="Min. 6 characters"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
                {loading ? t('common.loading') : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">You can now sign in with your new password.</p>
              <Link to="/login" className="btn-primary inline-block px-8 py-3">{t('auth.login')}</Link>
            </div>
          )}

          {step !== 'done' && (
            <Link to="/login" className="flex items-center justify-center gap-1 mt-5 text-sm text-gray-500 hover:text-paddy-green transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back to Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
