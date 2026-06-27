import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package, ShoppingBag, TrendingUp, Star, Plus, Eye, LayoutDashboard, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/ui/StatCard';
import OrderStatusBadge from '../components/ui/OrderStatusBadge';
import AIAdvisor from '../components/ai/AIAdvisor';
import api from '../services/api';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-paddy-green" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-charcoal py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-paddy-green" /> {t('nav.dashboard')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.welcome')}, {user?.name}! 👋</p>
          </div>
          {user?.role?.toLowerCase() === 'farmer' && (
            <Link to="/products/add" className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> {t('product.addProduct')}
            </Link>
          )}
        </div>

        {/* ── FARMER ── */}
        {user?.role?.toLowerCase() === 'farmer' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={<Package className="w-6 h-6" />} label={t('dashboard.totalProducts')} value={data?.stats?.totalProducts || 0} color="green" />
              <StatCard icon={<Eye className="w-6 h-6" />} label={t('dashboard.activeListings')} value={data?.stats?.activeListings || 0} color="blue" />
              <StatCard icon={<ShoppingBag className="w-6 h-6" />} label={t('dashboard.totalOrders')} value={data?.stats?.totalOrders || 0} color="orange" />
              <StatCard icon={<TrendingUp className="w-6 h-6" />} label={t('dashboard.revenue')} value={`Rs.${parseFloat(data?.stats?.revenue || 0).toLocaleString()}`} color="yellow" />
            </div>

            {/* Quick nav for farmer */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
              {[
                { to: '/products/add', icon: '➕', title: 'Add Product', desc: 'List new produce' },
                { to: '/orders', icon: '📦', title: 'Orders Received', desc: 'Manage buyer orders' },
                { to: '/marketplace', icon: '🌿', title: 'Marketplace', desc: 'View marketplace' },
                { to: '#notifications', icon: '🔔', title: 'Notifications', desc: 'View alerts' },
                { to: '/profile', icon: '👤', title: 'Profile Settings', desc: 'Update details' },
              ].map(item => (
                <Link key={item.to} to={item.to} className="card p-4 hover:shadow-md transition-shadow group text-center">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-paddy-green transition-colors">{item.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                </Link>
              ))}
            </div>

            <FarmerProductsSection />
            <RecentOrdersSection orders={data?.recentOrders || []} role="farmer" />
          </>
        )}

        {/* ── AI Advisor — farmer only ── */}
        {user?.role?.toLowerCase() === 'farmer' && <AIAdvisor />}

        {/* ── BUYER ── */}
        {user?.role?.toLowerCase() === 'buyer' && data && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <StatCard icon={<ShoppingBag className="w-6 h-6" />} label={t('dashboard.ordersPlaced')} value={data.stats.ordersPlaced} color="green" />
              <StatCard icon={<Star className="w-6 h-6" />} label={t('dashboard.favorites')} value={data.stats.favorites} color="yellow" />
              <StatCard icon={<TrendingUp className="w-6 h-6" />} label="Recent (30d)" value={data.stats.recentPurchases} color="blue" />
            </div>

            {/* Quick nav for buyer */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
              {[
                { to: '/marketplace', icon: '🛒', title: 'Marketplace', desc: 'Browse fresh produce' },
                { to: '/orders', icon: '📦', title: 'My Orders', desc: 'Track your orders' },
                { to: '/favorites', icon: '❤️', title: 'Favorites', desc: 'Saved products' },
                { to: '#notifications', icon: '🔔', title: 'Notifications', desc: 'View alerts' },
                { to: '/profile', icon: '👤', title: 'Profile Settings', desc: 'Update details' },
              ].map(item => (
                <Link key={item.to} to={item.to} className="card p-4 hover:shadow-md transition-shadow group text-center">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-paddy-green transition-colors">{item.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                </Link>
              ))}
            </div>

            <RecentOrdersSection orders={data.recentOrders} role="buyer" />
          </>
        )}

        {/* ── ADMIN ── */}
        {user?.role?.toLowerCase() === 'admin' && data && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <StatCard icon={<Package className="w-6 h-6" />} label="Total Users" value={data.stats.totalUsers} color="green" />
              <StatCard icon={<Package className="w-6 h-6" />} label="Farmers" value={data.stats.totalFarmers} color="blue" />
              <StatCard icon={<ShoppingBag className="w-6 h-6" />} label="Buyers" value={data.stats.totalBuyers} color="orange" />
              <StatCard icon={<Package className="w-6 h-6" />} label="Products" value={data.stats.totalProducts} color="yellow" />
              <StatCard icon={<ShoppingBag className="w-6 h-6" />} label="Orders" value={data.stats.totalOrders} color="green" />
              <StatCard icon={<TrendingUp className="w-6 h-6" />} label="Revenue" value={`Rs.${parseFloat(data.stats.totalRevenue || 0).toLocaleString()}`} color="yellow" />
            </div>
            <Link to="/admin" className="btn-primary inline-flex items-center gap-2 text-sm">
              Open Admin Panel
            </Link>
          </>
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
    api.get('/market/farmer/my')
      .then(({ data }) => setProducts(data.products?.slice(0, 5) || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const STATUS_COLORS = {
    active: 'bg-green-100 text-green-700',
    low_stock: 'bg-yellow-100 text-yellow-700',
    out_of_stock: 'bg-red-100 text-red-700',
    inactive: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">My Products</h2>
        <Link to="/products/add" className="text-sm text-paddy-green hover:underline flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add New
        </Link>
      </div>
      {loading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}</div>
      ) : products.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">
          No products yet.{' '}
          <Link to="/products/add" className="text-paddy-green hover:underline">Add your first product</Link>
        </p>
      ) : (
        <div className="space-y-2">
          {products.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-500">Rs.{p.price}/kg · {p.quantity} {p.unit || 'kg'}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className={`badge text-xs capitalize ${STATUS_COLORS[p.status] || STATUS_COLORS.inactive}`}>
                  {p.status?.replace('_', ' ')}
                </span>
                <Link to={`/products/edit/${p.id}`} className="text-xs text-paddy-green hover:underline">{t('common.edit')}</Link>
                <button 
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this product?')) {
                      try {
                        await api.delete(`/market/${p.id}`);
                        setProducts(products.filter(prod => prod.id !== p.id));
                        toast.success('Product deleted successfully');
                      } catch (err) {
                        toast.error('Failed to delete product');
                      }
                    }
                  }}
                  className="text-xs text-red-500 hover:underline ml-2"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          <Link to="/orders" className="text-sm text-paddy-green hover:underline block text-center pt-2">{t('common.viewAll')}</Link>
        </div>
      )}
    </div>
  );
}

function RecentOrdersSection({ orders, role }) {
  const { t } = useTranslation();
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          {role === 'farmer' ? 'Recent Orders Received' : t('dashboard.recentOrders')}
        </h2>
        <Link to="/orders" className="text-sm text-paddy-green hover:underline">{t('common.viewAll')}</Link>
      </div>
      {!orders || orders.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">{t('order.noOrders')}</p>
      ) : (
        <div className="space-y-2">
          {orders.map(o => (
            <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{o.product_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {role === 'farmer' ? `Buyer: ${o.buyer_name}` : `Farmer: ${o.farmer_name}`}
                  {' · '}Rs.{o.total_price}
                </p>
              </div>
              <OrderStatusBadge status={o.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
