import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Camera, Lock, Globe, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import i18n from '../i18n';

const LANGUAGES = [
  { code: 'en', label: 'English' }, { code: 'ta', label: 'தமிழ்' },
  { code: 'ml', label: 'മലയാളം' }, { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'te', label: 'తెలుగు' }, { code: 'hi', label: 'हिंदी' },
  { code: 'bn', label: 'বাংলা' },
];

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [form, setForm] = useState({ name: '', mobile: '', location: '', language_preference: 'en', theme_preference: 'light' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', mobile: user.mobile || '', location: user.location || '', language_preference: user.language_preference || 'en', theme_preference: user.theme_preference || 'light' });
      setAvatarPreview(user.profile_picture);
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (avatar) fd.append('profile_picture', avatar);
      await api.put('/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser(form);
      i18n.changeLanguage(form.language_preference);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    setChangingPw(true);
    try {
      await api.post('/auth/change-password', pwForm);
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setChangingPw(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-charcoal py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <User className="w-6 h-6 text-paddy-green" /> {t('nav.profile')}
        </h1>

        {/* Profile Form */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-5">Personal Information</h2>
          <form onSubmit={handleSave} className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-2">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-paddy-green flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                  {avatarPreview ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" /> : user?.name?.charAt(0).toUpperCase()}
                </div>
                <button type="button" onClick={() => document.getElementById('avatar-input').click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-paddy-green rounded-full flex items-center justify-center text-white hover:bg-leaf-green transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input id="avatar-input" type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files[0]; if (f) { setAvatar(f); setAvatarPreview(URL.createObjectURL(f)); } }} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-sm text-gray-500 capitalize">{user?.role} · {user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">{t('auth.name')}</label>
                <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">{t('auth.mobile')}</label>
                <input className="input-field" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} />
              </div>
              <div>
                <label className="label">{t('auth.location')}</label>
                <input className="input-field" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full py-2.5 disabled:opacity-60">
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </form>
        </div>

        {/* Preferences */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-5">Preferences</h2>
          <div className="space-y-4">
            <div>
              <label className="label flex items-center gap-2"><Globe className="w-4 h-4" /> Language</label>
              <select className="input-field" value={form.language_preference}
                onChange={e => { setForm({ ...form, language_preference: e.target.value }); i18n.changeLanguage(e.target.value); }}>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2">
                {isDark ? <Moon className="w-4 h-4 text-paddy-green" /> : <Sun className="w-4 h-4 text-harvest-yellow" />}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{isDark ? t('common.darkMode') : t('common.lightMode')}</span>
              </div>
              <button onClick={() => { toggleTheme(); setForm({ ...form, theme_preference: isDark ? 'light' : 'dark' }); }}
                className={`relative w-12 h-6 rounded-full transition-colors ${isDark ? 'bg-paddy-green' : 'bg-gray-300'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isDark ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <Lock className="w-4 h-4" /> {t('auth.changePassword')}
          </h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="label">{t('auth.currentPassword')}</label>
              <input type="password" required className="input-field" value={pwForm.currentPassword}
                onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
            </div>
            <div>
              <label className="label">{t('auth.newPassword')}</label>
              <input type="password" required className="input-field" value={pwForm.newPassword}
                onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} />
            </div>
            <button type="submit" disabled={changingPw} className="btn-primary w-full py-2.5 disabled:opacity-60">
              {changingPw ? t('common.loading') : t('auth.changePassword')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
