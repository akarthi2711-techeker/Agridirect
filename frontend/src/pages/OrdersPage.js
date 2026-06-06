import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Phone, MapPin, User, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OrderStatusBadge from '../components/ui/OrderStatusBadge';
import api from '../services/api';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&q=80';
const STEPS = ['pending', 'accepted', 'packed', 'shipped', 'delivered'];
const STEP_LABELS = {
  pending: 'Pending', accepted: 'Accepted',
  packed: 'Packed', shipped: 'Shipped', delivered: 'Delivered',
};

function OrderProgress({ status }) {
  if (status === 'cancelled') {
    return <p className="text-xs text-red-500 font-medium mt-2">❌ Order Cancelled</p>;
  }
  const current = STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 mt-3">
      {STEPS.map((step, i) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
              ${i <= current
                ? 'border-paddy-green bg-paddy-green text-white'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400'}`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-xs mt-0.5 hidden sm:block text-center ${i <= current ? 'text-paddy-green' : 'text-gray-400'}`}>
              {STEP_LABELS[step]}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mb-4 ${i < current ? 'bg-paddy-green' : 'bg-gray-200 dark:bg-gray-700'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // tracks which order is being updated
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders');
      setOrders(data.orders || []);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // FIX 1: Use api (not axios), set updating state correctly, add proper error feedback
  const updateStatus = async (orderId, status) => {
    if (updating) return; // prevent double-click
    setUpdating(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success(`Order ${status}`);
      await fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-paddy-green" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-charcoal py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-paddy-green" />
            {user?.role === 'farmer' ? 'Orders Received' : t('order.myOrders')}
          </h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">{orders.length} orders</span>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6 overflow-x-auto">
          {['all', 'pending', 'accepted', 'packed', 'shipped', 'delivered', 'cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all
                ${filter === s
                  ? 'bg-white dark:bg-gray-700 text-paddy-green shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {s === 'all'
                ? `All (${orders.length})`
                : `${s} (${orders.filter(o => o.status === s).length})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('order.noOrders')}</h3>
            {user?.role === 'buyer' && (
              <Link to="/marketplace" className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
                <ShoppingBag className="w-4 h-4" /> Browse Marketplace
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => (
              <div key={order.id} className="card p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">Order #{order.id}</span>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="flex items-start gap-4">
                  <img
                    src={order.image_url || PLACEHOLDER}
                    alt={order.product_name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    onError={e => { e.target.src = PLACEHOLDER; }}
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{order.product_name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {order.quantity} {order.unit || 'kg'} × ₹{order.unit_price}/kg ={' '}
                      <strong className="text-paddy-green dark:text-earthy-green">₹{order.total_price}</strong>
                    </p>

                    {/* Buyer sees farmer details */}
                    {user?.role === 'buyer' && (
                      <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="font-medium text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-paddy-green" /> {order.farmer_name}
                        </p>
                        {order.farmer_mobile && (
                          <a href={`tel:${order.farmer_mobile}`}
                            className="text-xs text-paddy-green flex items-center gap-1 mt-1 hover:underline font-medium">
                            <Phone className="w-3 h-3" /> {order.farmer_mobile} — Call Farmer
                          </a>
                        )}
                        {order.farmer_location && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {order.farmer_location}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Farmer sees buyer details */}
                    {user?.role === 'farmer' && (
                      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="font-medium text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-600" /> {order.buyer_name}
                        </p>
                        {order.buyer_company && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {order.buyer_company}
                            {order.buyer_type && ` · ${order.buyer_type}`}
                          </p>
                        )}
                        {order.buyer_mobile && (
                          <a href={`tel:${order.buyer_mobile}`}
                            className="text-xs text-blue-600 flex items-center gap-1 mt-1 hover:underline font-medium">
                            <Phone className="w-3 h-3" /> {order.buyer_mobile}
                          </a>
                        )}
                        {order.buyer_location && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {order.buyer_location}
                          </p>
                        )}
                      </div>
                    )}

                    {order.delivery_address && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-start gap-1">
                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{order.delivery_address}</span>
                      </p>
                    )}

                    {order.notes && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">Note: {order.notes}</p>
                    )}

                    {/* Progress tracker */}
                    <OrderProgress status={order.status} />

                    {/* FIX: Farmer action buttons — disabled uses updating===order.id correctly */}
                    {user?.role === 'farmer' && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(order.id, 'accepted')}
                              disabled={updating === order.id}
                              className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              {updating === order.id ? 'Processing...' : '✅ Accept'}
                            </button>
                            <button
                              onClick={() => updateStatus(order.id, 'cancelled')}
                              disabled={updating === order.id}
                              className="text-xs bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              {updating === order.id ? 'Processing...' : '❌ Reject'}
                            </button>
                          </>
                        )}
                        {order.status === 'accepted' && (
                          <button
                            onClick={() => updateStatus(order.id, 'packed')}
                            disabled={updating === order.id}
                            className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {updating === order.id ? 'Processing...' : '📦 Mark Packed'}
                          </button>
                        )}
                        {order.status === 'packed' && (
                          <button
                            onClick={() => updateStatus(order.id, 'shipped')}
                            disabled={updating === order.id}
                            className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {updating === order.id ? 'Processing...' : '🚚 Mark Shipped'}
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => updateStatus(order.id, 'delivered')}
                            disabled={updating === order.id}
                            className="text-xs bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {updating === order.id ? 'Processing...' : '🎉 Mark Delivered'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Buyer cancel */}
                    {user?.role === 'buyer' && ['pending', 'accepted'].includes(order.status) && (
                      <button
                        onClick={() => updateStatus(order.id, 'cancelled')}
                        disabled={updating === order.id}
                        className="mt-3 text-xs text-red-500 hover:text-red-600 underline disabled:opacity-50 disabled:cursor-not-allowed">
                        {updating === order.id ? 'Cancelling...' : 'Cancel this order'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
