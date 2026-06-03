import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OrderStatusBadge from '../components/ui/OrderStatusBadge';
import api from '../services/api';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&q=80';

export default function OrdersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(data.orders || []);
    } catch {}
    finally { setLoading(false); }
  };

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success(`Order ${status}`);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally { setUpdating(null); }
  };

  const farmerActions = ['confirmed', 'shipped', 'delivered'];
  const buyerActions = ['cancelled'];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-paddy-green" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-charcoal py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-paddy-green" /> {t('order.myOrders')}
        </h1>

        {orders.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('order.noOrders')}</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="card p-5">
                <div className="flex items-start gap-4">
                  <img src={order.image_url || PLACEHOLDER} alt={order.product_name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    onError={e => { e.target.src = PLACEHOLDER; }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{order.product_name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {order.quantity} {order.unit || 'kg'} · ₹{order.unit_price}/kg
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user?.role === 'buyer' ? `Farmer: ${order.farmer_name}` : `Buyer: ${order.buyer_name}`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-paddy-green dark:text-earthy-green text-lg">₹{order.total_price}</p>
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </div>

                    {order.delivery_address && (
                      <p className="text-xs text-gray-500 mt-2">📍 {order.delivery_address}</p>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                      {/* Status Actions */}
                      <div className="flex gap-2">
                        {user?.role === 'farmer' && order.status === 'pending' && (
                          <button onClick={() => updateStatus(order.id, 'confirmed')} disabled={updating === order.id}
                            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-60">
                            Confirm
                          </button>
                        )}
                        {user?.role === 'farmer' && order.status === 'confirmed' && (
                          <button onClick={() => updateStatus(order.id, 'shipped')} disabled={updating === order.id}
                            className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-60">
                            Mark Shipped
                          </button>
                        )}
                        {user?.role === 'farmer' && order.status === 'shipped' && (
                          <button onClick={() => updateStatus(order.id, 'delivered')} disabled={updating === order.id}
                            className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-60">
                            Mark Delivered
                          </button>
                        )}
                        {user?.role === 'buyer' && ['pending', 'confirmed'].includes(order.status) && (
                          <button onClick={() => updateStatus(order.id, 'cancelled')} disabled={updating === order.id}
                            className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-60">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
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
