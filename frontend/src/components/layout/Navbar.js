import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Leaf, Bell, User, Menu, X, Sun, Moon, Globe, ShoppingBag,
  LayoutDashboard, LogOut, Heart, Package, ChevronDown, Shield
} from 'lucide-react';
import api from '../../services/api';

const LANGUAGES = [
  { code: 'en', label: 'English' }, { code: 'ta', label: 'தமிழ்' },
  { code: 'ml', label: 'മലയാളം' }, { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'te', label: 'తెలుగు' }, { code: 'hi', label: 'हिंदी' },
  { code: 'bn', label: 'বাংলা' },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const langRef = useRef(null);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user, location]);

  useEffect(() => {
    const handleClick = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications?.slice(0, 5) || []);
      setUnread(data.unread || 0);
    } catch {}
  };

  const handleLangChange = (code) => {
    i18n.changeLanguage(code);
    setLangOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserOpen(false);
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnread(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-paddy-green rounded-lg flex items-center justify-center group-hover:bg-leaf-green transition-colors">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-paddy-green dark:text-earthy-green">AgriDirect</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 block leading-none">Lite</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" label={t('nav.home')} />
            <NavLink to="/marketplace" label={t('nav.marketplace')} />
            {user && <NavLink to="/dashboard" label={t('nav.dashboard')} />}
            {user && <NavLink to="/orders" label={t('order.myOrders')} />}
            {user?.role === 'buyer' && <NavLink to="/favorites" label={t('nav.notifications').replace('Notifications', 'Favorites')} icon={<Heart className="w-4 h-4" />} />}
            {user?.role === 'farmer' && (
              <Link to="/products/add" className="ml-1 btn-primary text-sm py-2 px-4 flex items-center gap-1">
                <Package className="w-4 h-4" /> {t('product.addProduct')}
              </Link>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="p-2 rounded-lg text-gray-500 hover:text-paddy-green hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Toggle theme">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Language Selector */}
            <div className="relative" ref={langRef}>
              <button onClick={() => setLangOpen(!langOpen)} className="flex items-center gap-1 p-2 rounded-lg text-gray-500 hover:text-paddy-green hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{currentLang.label}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 animate-fade-in">
                  {LANGUAGES.map(lang => (
                    <button key={lang.code} onClick={() => handleLangChange(lang.code)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${i18n.language === lang.code ? 'text-paddy-green font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-lg text-gray-500 hover:text-paddy-green hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Bell className="w-5 h-5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 animate-fade-in">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <span className="font-semibold text-gray-900 dark:text-white">{t('nav.notifications')}</span>
                      {unread > 0 && <button onClick={markAllRead} className="text-xs text-paddy-green hover:underline">Mark all read</button>}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-center text-gray-500 py-6 text-sm">No notifications</p>
                      ) : notifications.map(n => (
                        <div key={n.id} className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700 last:border-0 ${!n.is_read ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={userRef}>
                <button onClick={() => setUserOpen(!userOpen)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-paddy-green flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                    {user.profile_picture ? <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" /> : user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-24 truncate">{user.name}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
                </button>
                {userOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 animate-fade-in">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                    <DropdownItem to="/profile" icon={<User className="w-4 h-4" />} label={t('nav.profile')} onClick={() => setUserOpen(false)} />
                    <DropdownItem to="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label={t('nav.dashboard')} onClick={() => setUserOpen(false)} />
                    <DropdownItem to="/orders" icon={<ShoppingBag className="w-4 h-4" />} label={t('order.myOrders')} onClick={() => setUserOpen(false)} />
                    {user?.role === 'admin' && (
                      <DropdownItem to="/admin" icon={<Shield className="w-4 h-4" />} label="Admin Panel" onClick={() => setUserOpen(false)} />
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <LogOut className="w-4 h-4" /> {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">{t('nav.login')}</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">{t('nav.register')}</Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 animate-slide-up">
          <div className="px-4 py-3 space-y-1">
            <MobileNavLink to="/" label={t('nav.home')} onClick={() => setMobileOpen(false)} />
            <MobileNavLink to="/marketplace" label={t('nav.marketplace')} onClick={() => setMobileOpen(false)} />
            {user && <MobileNavLink to="/dashboard" label={t('nav.dashboard')} onClick={() => setMobileOpen(false)} />}
            {user && <MobileNavLink to="/orders" label={t('order.myOrders')} onClick={() => setMobileOpen(false)} />}
            {user?.role === 'buyer' && <MobileNavLink to="/favorites" label="Favorites" onClick={() => setMobileOpen(false)} />}
            {user?.role === 'farmer' && <MobileNavLink to="/products/add" label={t('product.addProduct')} onClick={() => setMobileOpen(false)} />}
            {!user && (
              <div className="flex gap-2 pt-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 btn-secondary text-center text-sm py-2">{t('nav.login')}</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1 btn-primary text-center text-sm py-2">{t('nav.register')}</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

const NavLink = ({ to, label, icon }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-green-50 text-paddy-green dark:bg-green-900/30 dark:text-earthy-green' : 'text-gray-600 dark:text-gray-300 hover:text-paddy-green hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
      {icon}{label}
    </Link>
  );
};

const MobileNavLink = ({ to, label, onClick }) => (
  <Link to={to} onClick={onClick} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
    {label}
  </Link>
);

const DropdownItem = ({ to, icon, label, onClick }) => (
  <Link to={to} onClick={onClick} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
    {icon}{label}
  </Link>
);
