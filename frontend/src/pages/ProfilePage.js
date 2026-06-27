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

const BUSINESS_TYPES = ['hotel', 'hostel', 'restaurant', 'caterer', 'vegetable_shop', 'individual', 'other'];

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [form, setForm] = useState({
    name: '', mobile: '', location: '', village: '', district: '', state: 'Tamil Nadu',
    farming_experience: '', company_name: '', business_type: '',
    language_preference: 'en', theme_preference: 'light',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get('/profile').then(({ data }) => {
      setProfile(data.profile);
      setForm({
        name: data.profile.name || '',
        mobile: data.profile.mobile || '',
        location: data.profile.location || '',
        village: data.profile.village || '',
        district: data.profile.district || '',
        state: data.profile.state || 'Tamil Nadu',
        farming_experience: data.profile.farming_experience || '',
        company_name: data.profile.company_name || '',
        business_type: data.profile.business_type || '',
        language_preference: data.profile.language_preference || 'en',
        theme_preference: data.profile.theme_preference || 'light',
      });
      setAvatarPreview(data.profile.profile_picture);
    }).catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (avatar) {
        payload.profile_picture = avatar;
      }
      
      await api.put('/profile', payload);
      
      updateUser({ ...form, profile_picture: avatarPreview });
      i18n.changeLanguage(form.language_preference);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) { toast.error('Min 6 characters'); return; }
    setChangingPw(true);
    try {
      await api.post('/auth/change-password', pwForm);
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setChangingPw(false); }
  };

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-charcoal py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <User className="w-6 h-6 text-paddy-green" /> {t('nav.profile')}
        </h1>

        {/* Personal info */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-5">
            {user?.role === 'farmer' ? 'Farmer Profile' : 'Buyer Profile'}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-paddy-green flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    : user?.name?.charAt(0).toUpperCase()}
                </div>
                <button type="button" onClick={() => document.getElementById('avatar-input').click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-paddy-green rounded-full flex items-center justify-center text-white hover:bg-leaf-green transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input id="avatar-input" type="file" accept="image/*" className="hidden"
                  onChange={e => { 
                    const f = e.target.files[0]; 
                    if (f) { 
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setAvatar(reader.result);
                        setAvatarPreview(reader.result);
                      };
                      reader.readAsDataURL(f);
                    } 
                  }} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-sm text-gray-500 capitalize">{user?.role} · {user?.email}</p>
                {profile?.total_products > 0 && (
                  <p className="text-xs text-paddy-green mt-0.5">{profile.total_products} active products</p>
                )}
              </div>
            </div>

            {/* Common fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">{t('auth.name')} *</label>
                <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div>
                <label className="label">{t('auth.mobile')}</label>
                <input className="input-field" placeholder="+91 98765 43210" value={form.mobile} onChange={e => set('mobile', e.target.value)} />
              </div>
              <div>
                <label className="label">Location / Area</label>
                <input className="input-field" placeholder="Your area/town" value={form.location} onChange={e => set('location', e.target.value)} />
              </div>
              <div>
                <label className="label">Village</label>
                <input className="input-field" placeholder="Village name" value={form.village} onChange={e => set('village', e.target.value)} />
              </div>
              <div>
                <label className="label">District</label>
                <input className="input-field" placeholder="e.g. Coimbatore" value={form.district} onChange={e => set('district', e.target.value)} />
              </div>
              <div>
                <label className="label">State</label>
                <input className="input-field" value={form.state} onChange={e => set('state', e.target.value)} />
              </div>
            </div>

            {/* Farmer-specific fields */}
            {user?.role === 'farmer' && (
              <div>
                <label className="label">Farming Experience (years)</label>
                <input type="number" min="0" max="60" className="input-field"
                  placeholder="e.g. 10" value={form.farming_experience} onChange={e => set('farming_experience', e.target.value)} />
              </div>
            )}

            {/* Buyer-specific fields */}
            {user?.role === 'buyer' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Hotel / Hostel / Company Name</label>
                  <input className="input-field" placeholder="e.g. Green Hotel" value={form.company_name} onChange={e => set('company_name', e.target.value)} />
                </div>
                <div>
                  <label className="label">Business Type</label>
                  <select className="input-field" value={form.business_type} onChange={e => set('business_type', e.target.value)}>
                    <option value="">Select type</option>
                    {BUSINESS_TYPES.map(bt => (
                      <option key={bt} value={bt} className="capitalize">{bt.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

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
                onChange={e => { set('language_preference', e.target.value); i18n.changeLanguage(e.target.value); }}>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2">
                {isDark ? <Moon className="w-4 h-4 text-paddy-green" /> : <Sun className="w-4 h-4 text-harvest-yellow" />}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isDark ? t('common.darkMode') : t('common.lightMode')}
                </span>
              </div>
              <button onClick={() => { toggleTheme(); set('theme_preference', isDark ? 'light' : 'dark'); }}
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
