import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package, ShoppingBag, TrendingUp, Star, Plus, Eye, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/ui/StatCard';
import OrderStatusBadge from '../components/ui/OrderStatusBadge';
import api from '../services/api';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: d } = await api.get('/dashboard');
        setData(d);
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-paddy-green" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-charcoal py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-paddy-green" /> {t('nav.dashboard')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.welcome')}, {user?.name}! 👋</p>
          </div>
          {user?.role === 'farmer' && (
            <Link to="/products/add" className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> {t('product.addProduct')}
            </Link>
          )}
        </div>

        {/* Farmer Dashboard */}
        {user?.role === 'farmer' && data && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={<Package className="w-6 h-6" />} label={t('dashboard.totalProducts')} value={data.stats.totalProducts} color="green" />
              <StatCard icon={<Eye className="w-6 h-6" />} label={t('dashboard.activeListings')} value={data.stats.activeListings} color="blue" />
              <StatCard icon={<ShoppingBag className="w-6 h-6" />} label={t('dashboard.totalOrders')} value={data.stats.totalOrders} color="orange" />
              <StatCard icon={<TrendingUp className="w-6 h-6" />} label={t('dashboard.revenue')} value={`₹${parseFloat(data.stats.revenue).toLocaleString()}`} color="yellow" />
            </div>
            <FarmerProductsSection />
            <RecentOrdersSection orders={data.recentOrders} role="farmer" />
          </>
        )}

        {/* Buyer Dashboard */}
        {user?.role === 'buyer' && data && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <StatCard icon={<ShoppingBag className="w-6 h-6" />} label={t('dashboard.ordersPlaced')} value={data.stats.ordersPlaced} color="green" />
              <StatCard icon={<Star className="w-6 h-6" />} label={t('dashboard.favorites')} value={data.stats.favorites} color="yellow" />
              <StatCard icon={<TrendingUp className="w-6 h-6" />} label={t('dashboard.recentPurchases')} value={data.stats.recentPurchases} color="blue" />
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <Link to="/marketplace" className="card p-6 hover:shadow-md transition-shadow flex items-center gap-4 group">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-2xl">🛒</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-paddy-green transition-colors">Browse Marketplace</h3>
                  <p className="text-sm text-gray-500">Find fresh produce from farmers</p>
                </div>
              </Link>
              <Link to="/favorites" className="card p-6 hover:shadow-md transition-shadow flex items-center gap-4 group">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-2xl">❤️</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-paddy-green transition-colors">My Favorites</h3>
                  <p className="text-sm text-gray-500">View saved products</p>
                </div>
              </Link>
            </div>
            <RecentOrdersSection orders={data.recentOrders} role="buyer" />
          </>
        )}

        {/* Admin Dashboard */}
        {user?.role === 'admin' && data && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard icon={<Package className="w-6 h-6" />} label="Total Users" value={data.stats.totalUsers} color="green" />
            <StatCard icon={<Package className="w-6 h-6" />} label="Farmers" value={data.stats.totalFarmers} color="blue" />
            <StatCard icon={<ShoppingBag className="w-6 h-6" />} label="Buyers" value={data.stats.totalBuyers} color="orange" />
            <StatCard icon={<Package className="w-6 h-6" />} label="Products" value={data.stats.totalProducts} color="yellow" />
            <StatCard icon={<ShoppingBag className="w-6 h-6" />} label="Orders" value={data.stats.totalOrders} color="green" />
            <StatCard icon={<TrendingUp className="w-6 h-6" />} label="Revenue" value={`₹${parseFloat(data.stats.totalRevenue).toLocaleString()}`} color="yellow" />
          </div>
        )}
      </div>
    </div>
  );
}

function FarmerProductsSection() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products/farmer/my').then(({ data }) => setProducts(data.products?.slice(0, 5) || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">My Products</h2>
        <Link to="/products/add" className="text-sm text-paddy-green hover:underline">{t('product.addProduct')}</Link>
      </div>
      {loading ? <div className="animate-pulse space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded" />)}</div> :
        products.length === 0 ? <p className="text-gray-500 text-sm text-center py-4">No products yet. <Link to="/products/add" className="text-paddy-green hover:underline">Add your first product</Link></p> :
        <div className="space-y-3">
          {products.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{p.name}</p>
                <p className="text-xs text-gray-500">₹{p.price}/kg · {p.quantity} {p.unit || 'kg'} available</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge text-xs ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                <Link to={`/products/edit/${p.id}`} className="text-xs text-paddy-green hover:underline">{t('common.edit')}</Link>
              </div>
            </div>
          ))}
          <Link to="/orders" className="text-sm text-paddy-green hover:underline block text-center mt-2">{t('common.viewAll')}</Link>
        </div>
      }
    </div>
  );
}

function RecentOrdersSection({ orders, role }) {
  const { t } = useTranslation();
  if (!orders || orders.length === 0) return (
    <div className="card p-6">
      <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.recentOrders')}</h2>
      <p className="text-gray-500 text-sm text-center py-4">{t('order.noOrders')}</p>
    </div>
  );
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">{t('dashboard.recentOrders')}</h2>
        <Link to="/orders" className="text-sm text-paddy-green hover:underline">{t('common.viewAll')}</Link>
      </div>
      <div className="space-y-3">
        {orders.map(o => (
          <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">{o.product_name}</p>
              <p className="text-xs text-gray-500">{role === 'farmer' ? `Buyer: ${o.buyer_name}` : `Farmer: ${o.farmer_name}`} · ₹{o.total_price}</p>
            </div>
            <OrderStatusBadge status={o.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
