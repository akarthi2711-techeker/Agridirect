import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Leaf, TrendingUp, Users, ShoppingBag, Star, ArrowRight, Sprout, Sun, Droplets } from 'lucide-react';
import ProductCard from '../components/ui/ProductCard';
import SkeletonCard from '../components/ui/SkeletonCard';
import api from '../services/api';

const TESTIMONIALS = [
  { name: 'Murugan K.', role: 'Paddy Farmer, Thanjavur', text: 'AgriDirect helped me sell my harvest directly to hotels. My income increased by 30% this season.', avatar: 'M' },
  { name: 'Priya S.', role: 'Vegetable Buyer, Chennai', text: 'I get fresh vegetables directly from farmers. The quality is excellent and prices are fair.', avatar: 'P' },
  { name: 'Rajan T.', role: 'Organic Farmer, Coimbatore', text: 'Finally a platform that understands Tamil farmers. Simple to use and very helpful.', avatar: 'R' },
];

export default function HomePage() {
  const { t } = useTranslation();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [stats, setStats] = useState({ farmers: 0, buyers: 0, products: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/products?limit=6&sort=latest');
        setFeaturedProducts(data.products || []);
        setStats({ farmers: 120, buyers: 340, products: data.total || 0 });
      } catch {}
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-paddy-green via-leaf-green to-earthy-green text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/20 blur-xl" />
          <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-golden/30 blur-2xl" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-white/10 blur-lg" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-6">
                <Leaf className="w-4 h-4" /> Farm Fresh · Direct Trade · Tamil Nadu
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-4">
                {t('hero.tagline')}
              </h1>
              <p className="text-lg text-green-100 mb-8 leading-relaxed">{t('hero.subtitle')}</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/register?role=farmer" className="bg-white text-paddy-green hover:bg-green-50 font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2">
                  <Sprout className="w-5 h-5" /> {t('hero.startSelling')}
                </Link>
                <Link to="/marketplace" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 border border-white/30 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" /> {t('hero.browseProducts')}
                </Link>
              </div>
            </div>
            {/* Hero Illustration */}
            <div className="hidden lg:flex justify-center">
              <div className="relative w-80 h-80">
                <div className="absolute inset-0 bg-white/10 rounded-3xl backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="text-8xl mb-4">🌾</div>
                    <p className="font-tamil text-xl font-bold text-golden">"உழுதுண்டு வாழ்வாரே வாழ்வார்"</p>
                    <p className="text-sm text-green-100 mt-2 italic">{t('tamil.quoteTranslation')}</p>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-golden/80 rounded-2xl flex items-center justify-center text-2xl shadow-lg">🥕</div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shadow-lg">🍅</div>
                <div className="absolute top-1/2 -right-8 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-xl">🌽</div>
              </div>
            </div>
          </div>
        </div>
        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 20C1200 60 960 0 720 20C480 40 240 0 0 20L0 60Z" className="fill-gray-50 dark:fill-charcoal" />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50 dark:bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-6">
            {[
              { icon: '👨‍🌾', value: `${stats.farmers}+`, label: t('stats.farmersRegistered') },
              { icon: '🛒', value: `${stats.buyers}+`, label: t('stats.buyersRegistered') },
              { icon: '📦', value: `${stats.products}+`, label: t('stats.productsListed') },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="text-2xl lg:text-3xl font-bold text-paddy-green dark:text-earthy-green">{s.value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fresh from the Farm</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Directly listed by farmers today</p>
            </div>
            <Link to="/marketplace" className="flex items-center gap-1 text-paddy-green hover:text-leaf-green font-medium text-sm transition-colors">
              {t('common.viewAll')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />) :
              featuredProducts.length > 0 ? featuredProducts.map(p => <ProductCard key={p.id} product={p} />) :
              <div className="col-span-3 text-center py-12 text-gray-500">{t('marketplace.noProducts')}</div>
            }
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50 dark:bg-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-12">Why AgriDirect Lite?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* For Farmers */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-paddy-green rounded-xl flex items-center justify-center text-xl">👨‍🌾</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">For Farmers</h3>
              </div>
              <ul className="space-y-3">
                {['Sell directly to buyers — no middlemen', 'Get fair market prices for your produce', 'Smart pricing suggestions based on quantity', 'Manage orders and track revenue easily', 'Reach hotels, hostels, and local buyers'].map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="text-paddy-green mt-0.5">✓</span> {b}
                  </li>
                ))}
              </ul>
              <Link to="/register?role=farmer" className="btn-primary mt-5 inline-flex items-center gap-2 text-sm">
                <Sprout className="w-4 h-4" /> Start Selling Today
              </Link>
            </div>
            {/* For Buyers */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-harvest-yellow rounded-xl flex items-center justify-center text-xl">🛒</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">For Buyers</h3>
              </div>
              <ul className="space-y-3">
                {['Browse fresh produce from verified farmers', 'Filter by category, price, and location', 'View harvest date and shelf life info', 'Place orders directly with farmers', 'Save favorites for quick reordering'].map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="text-harvest-yellow mt-0.5">✓</span> {b}
                  </li>
                ))}
              </ul>
              <Link to="/marketplace" className="btn-secondary mt-5 inline-flex items-center gap-2 text-sm">
                <ShoppingBag className="w-4 h-4" /> Browse Marketplace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tamil Heritage Section */}
      <section className="py-16 bg-gradient-to-br from-earth-brown to-coconut-brown text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 text-9xl flex items-center justify-center font-tamil">🌾</div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
            <Sun className="w-4 h-4 text-golden" /> {t('tamil.heritage')}
          </div>
          <blockquote className="font-tamil text-3xl lg:text-4xl font-bold text-golden mb-4">
            "{t('tamil.quote')}"
          </blockquote>
          <p className="text-lg text-orange-100 italic mb-6">"{t('tamil.quoteTranslation')}"</p>
          <p className="text-orange-200 max-w-2xl mx-auto text-sm leading-relaxed">{t('tamil.appreciation')}</p>
          <div className="flex justify-center gap-8 mt-10 text-4xl">
            {['🌾', '🚜', '🌱', '🏺', '🌻'].map((e, i) => (
              <span key={i} className="hover:scale-125 transition-transform cursor-default">{e}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">What Our Users Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card p-6">
                <div className="flex items-center gap-1 mb-3">
                  {Array(5).fill(0).map((_, j) => <Star key={j} className="w-4 h-4 fill-golden text-golden" />)}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-paddy-green rounded-full flex items-center justify-center text-white font-bold">{t.avatar}</div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-12 bg-paddy-green dark:bg-forest-dark text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Droplets className="w-10 h-10 mx-auto mb-4 text-green-300" />
          <h2 className="text-2xl font-bold mb-3">Ready to join AgriDirect Lite?</h2>
          <p className="text-green-100 mb-6">Join hundreds of farmers and buyers already trading directly on our platform.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/register" className="bg-white text-paddy-green hover:bg-green-50 font-semibold px-8 py-3 rounded-xl transition-all shadow-lg">
              Get Started Free
            </Link>
            <Link to="/marketplace" className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-xl transition-all border border-white/30">
              Explore Marketplace
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
