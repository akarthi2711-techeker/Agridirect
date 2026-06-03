import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Leaf, Eye, EyeOff, UserPlus, Sprout, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    name: '', email: '', password: '', mobile: '', location: '',
    role: searchParams.get('role') || 'buyer',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.token, data.user);
      toast.success('Registration successful! Welcome to AgriDirect.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Join the AgriDirect community</p>
        </div>

        <div className="card p-8">
          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'farmer', icon: <Sprout className="w-5 h-5" />, label: t('auth.farmer'), desc: 'Sell your produce' },
              { value: 'buyer', icon: <ShoppingBag className="w-5 h-5" />, label: t('auth.buyer'), desc: 'Buy fresh produce' },
            ].map(r => (
              <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })}
                className={`p-3 rounded-xl border-2 text-left transition-all ${form.role === r.value ? 'border-paddy-green bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}>
                <div className={`mb-1 ${form.role === r.value ? 'text-paddy-green' : 'text-gray-400'}`}>{r.icon}</div>
                <p className={`font-semibold text-sm ${form.role === r.value ? 'text-paddy-green' : 'text-gray-700 dark:text-gray-300'}`}>{r.label}</p>
                <p className="text-xs text-gray-500">{r.desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('auth.name')}</label>
              <input type="text" required className="input-field" placeholder="Your full name"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">{t('auth.email')}</label>
              <input type="email" required className="input-field" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">{t('auth.password')}</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required className="input-field pr-10"
                  placeholder="Min. 6 characters" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('auth.mobile')}</label>
                <input type="tel" className="input-field" placeholder="+91 98765 43210"
                  value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} />
              </div>
              <div>
                <label className="label">{t('auth.location')}</label>
                <input type="text" className="input-field" placeholder="City, State"
                  value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-5 h-5" />}
              {loading ? t('common.loading') : t('auth.register')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-paddy-green hover:underline font-medium">{t('auth.login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
