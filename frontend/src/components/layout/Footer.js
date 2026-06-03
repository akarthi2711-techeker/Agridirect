import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Leaf, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-paddy-green dark:bg-forest-dark text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">AgriDirect Lite</span>
                <p className="text-xs text-green-200">Powered by AWS</p>
              </div>
            </div>
            <p className="text-green-100 text-sm leading-relaxed mb-4">{t('footer.tagline')}</p>
            <p className="font-tamil text-sm text-golden italic">"உழுதுண்டு வாழ்வாரே வாழ்வார்"</p>
            <div className="flex gap-3 mt-4">
              {['facebook', 'twitter', 'instagram', 'youtube'].map(s => (
                <a key={s} href={`https://${s}.com`} target="_blank" rel="noreferrer"
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors text-xs font-bold uppercase">
                  {s[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4 text-green-100">Quick Links</h3>
            <ul className="space-y-2 text-sm text-green-200">
              {[
                { to: '/', label: t('nav.home') },
                { to: '/marketplace', label: t('nav.marketplace') },
                { to: '/register', label: t('nav.register') },
                { to: '/login', label: t('nav.login') },
              ].map(l => (
                <li key={l.to}><Link to={l.to} className="hover:text-white transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-green-100">{t('footer.contact')}</h3>
            <ul className="space-y-3 text-sm text-green-200">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 flex-shrink-0" /> support@agridirect.in</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 flex-shrink-0" /> +91 98765 43210</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 flex-shrink-0" /> Chennai, Tamil Nadu</li>
            </ul>
            <div className="mt-4 flex gap-3 text-xs text-green-300">
              <Link to="/privacy" className="hover:text-white">{t('footer.privacy')}</Link>
              <span>·</span>
              <Link to="/terms" className="hover:text-white">{t('footer.terms')}</Link>
              <span>·</span>
              <Link to="/about" className="hover:text-white">{t('footer.about')}</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-green-300">
          <p>© {new Date().getFullYear()} AgriDirect Lite. All rights reserved.</p>
          <p>Built with ❤️ for Tamil Nadu Farmers · Hosted on AWS</p>
        </div>
      </div>
    </footer>
  );
}
