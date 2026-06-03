import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Package, ShoppingBag, TrendingUp, Shield, ToggleLeft, ToggleRight, Trash2, Search } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import OrderStatusBadge from '../components/ui/OrderStatusBadge';
import api from '../services/api';
import toast from 'react-hot-toast';

const TABS = ['overview', 'users', 'products', 'orders'];

export default function AdminPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    else if (tab === 'products') fetchProducts();
    else if (tab === 'orders') fetchOrders();
  }, [tab]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data.stats);
    } catch { toast.error('Failed to load stats'); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { search } });
      setUsers(data.users || []);
    } catch {} finally { setLoading(false); }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/products');
      setProducts(data.products || []);
    } catch {} finally { setLoading(false); }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/orders');
      setOrders(data.orders || []);
    } catch {} finally { setLoading(false); }
  };

  const toggleUser = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}/toggle`);
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch { toast.error('Failed to update user'); }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const updateProductStatus = async (productId, status) => {
    try {
      await api.put(`/admin/products/${productId}/status`, { status });
      toast.success(`Product set to ${status}`);
      fetchProducts();
    } catch { toast.error('Failed to update product'); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-charcoal py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-paddy-green rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage users, products, and orders</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6 w-fit">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-white dark:bg-gray-700 text-paddy-green shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<Users className="w-6 h-6" />} label="Total Users" value={stats.totalUsers} color="green" />
              <StatCard icon={<Users className="w-6 h-6" />} label="Farmers" value={stats.totalFarmers} color="blue" />
              <StatCard icon={<Users className="w-6 h-6" />} label="Buyers" value={stats.totalBuyers} color="orange" />
              <StatCard icon={<Package className="w-6 h-6" />} label="Products" value={stats.totalProducts} color="yellow" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<Package className="w-6 h-6" />} label="Active Products" value={stats.activeProducts} color="green" />
              <StatCard icon={<ShoppingBag className="w-6 h-6" />} label="Total Orders" value={stats.totalOrders} color="blue" />
              <StatCard icon={<ShoppingBag className="w-6 h-6" />} label="Pending Orders" value={stats.pendingOrders} color="orange" />
              <StatCard icon={<TrendingUp className="w-6 h-6" />} label="Revenue" value={`₹${parseFloat(stats.totalRevenue).toLocaleString()}`} color="yellow" />
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input-field pl-9 text-sm" placeholder="Search users..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchUsers()} />
              </div>
              <button onClick={fetchUsers} className="btn-primary text-sm px-4 py-2">Search</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {['Name', 'Email', 'Role', 'Location', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-500">No users found</td></tr>
                  ) : users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{u.name}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`badge capitalize ${u.role === 'farmer' ? 'bg-green-100 text-green-700' : u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.location || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.is_active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleUser(u.id, u.is_active)} title={u.is_active ? 'Deactivate' : 'Activate'}
                            className="text-gray-400 hover:text-paddy-green transition-colors">
                            {u.is_active ? <ToggleRight className="w-5 h-5 text-paddy-green" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <button onClick={() => deleteUser(u.id)} title="Delete user"
                            className="text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {tab === 'products' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {['Product', 'Farmer', 'Category', 'Price', 'Qty', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td></tr>
                  ) : products.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-500">No products found</td></tr>
                  ) : products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-32 truncate">{p.name}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.farmer_name}</td>
                      <td className="px-4 py-3 capitalize text-gray-500 dark:text-gray-400">{p.category}</td>
                      <td className="px-4 py-3 text-paddy-green font-semibold">₹{p.price}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.quantity} {p.unit || 'kg'}</td>
                      <td className="px-4 py-3">
                        <span className={`badge capitalize ${p.status === 'active' ? 'bg-green-100 text-green-700' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <select className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          value={p.status} onChange={e => updateProductStatus(p.id, e.target.value)}>
                          {['active', 'inactive', 'pending', 'sold_out'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {['Order ID', 'Product', 'Buyer', 'Farmer', 'Qty', 'Total', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-500">Loading...</td></tr>
                  ) : orders.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-500">No orders found</td></tr>
                  ) : orders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">#{o.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-28 truncate">{o.product_name}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{o.buyer_name}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{o.farmer_name}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{o.quantity}</td>
                      <td className="px-4 py-3 text-paddy-green font-semibold">₹{o.total_price}</td>
                      <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
