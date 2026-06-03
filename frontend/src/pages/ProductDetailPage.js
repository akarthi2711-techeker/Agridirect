import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, User, Phone, Calendar, Clock, Package, ShoppingCart, Heart, ArrowLeft, Lightbulb } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OrderStatusBadge from '../components/ui/OrderStatusBadge';
import api from '../services/api';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderForm, setOrderForm] = useState({ quantity: '', delivery_address: '', notes: '' });
  const [ordering, setOrdering] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.product);
      } catch { navigate('/marketplace'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const handleOrder = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to place an order'); navigate('/login'); return; }
    setOrdering(true);
    try {
      const { data } = await api.post('/orders', { product_id: product.id, ...orderForm });
      toast.success(`Order placed! Total: ₹${data.totalPrice}`);
      setShowOrderForm(false);
      setOrderForm({ quantity: '', delivery_address: '', notes: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally { setOrdering(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-paddy-green" />
    </div>
  );

  if (!product) return null;

  const isAvailable = product.status === 'active' && parseFloat(product.quantity) > 0;
  const totalPrice = orderForm.quantity ? (parseFloat(orderForm.quantity) * parseFloat(product.price)).toFixed(2) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-charcoal py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-gray-500 hover:text-paddy-green mb-6 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image */}
          <div className="card overflow-hidden">
            <img src={product.image_url || PLACEHOLDER} alt={product.name}
              className="w-full h-80 lg:h-96 object-cover"
              onError={e => { e.target.src = PLACEHOLDER; }} />
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <span className="badge bg-green-100 text-green-700 capitalize mb-2">{t(`product.categories.${product.category}`)}</span>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{product.name}</h1>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-paddy-green dark:text-earthy-green">₹{product.price}</span>
                <span className="text-gray-500">per {product.unit || 'kg'}</span>
              </div>
              {product.suggested_price && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <Lightbulb className="w-4 h-4 text-harvest-yellow flex-shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t('product.suggestedPrice')}: <strong className="text-harvest-yellow">₹{product.suggested_price}</strong>/kg
                  </p>
                </div>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Package className="w-4 h-4" />, label: 'Available', value: `${product.quantity} ${product.unit || 'kg'}` },
                { icon: <MapPin className="w-4 h-4" />, label: 'Location', value: product.location || product.farmer_location || 'N/A' },
                { icon: <Calendar className="w-4 h-4" />, label: 'Harvest Date', value: product.harvest_date ? new Date(product.harvest_date).toLocaleDateString() : 'N/A' },
                { icon: <Clock className="w-4 h-4" />, label: 'Shelf Life', value: product.shelf_life || 'N/A' },
              ].map((item, i) => (
                <div key={i} className="card p-3 flex items-start gap-2">
                  <span className="text-paddy-green mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Farmer Info */}
            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-paddy-green" /> Farmer Details
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700 dark:text-gray-300"><strong>Name:</strong> {product.farmer_name}</p>
                {product.farmer_location && <p className="text-gray-700 dark:text-gray-300 flex items-center gap-1"><MapPin className="w-3 h-3" /> {product.farmer_location}</p>}
                {product.farmer_mobile && <p className="text-gray-700 dark:text-gray-300 flex items-center gap-1"><Phone className="w-3 h-3" /> {product.farmer_mobile}</p>}
              </div>
            </div>

            {product.description && (
              <div className="card p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Action Buttons */}
            {user?.role === 'buyer' && isAvailable && (
              <button onClick={() => setShowOrderForm(!showOrderForm)} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                <ShoppingCart className="w-5 h-5" /> {t('product.placeOrder')}
              </button>
            )}
            {!user && (
              <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                Login to Order
              </Link>
            )}
            {!isAvailable && <p className="text-center text-red-500 font-medium">{t('product.soldOut')}</p>}

            {/* Order Form */}
            {showOrderForm && (
              <div className="card p-5 border-2 border-paddy-green animate-slide-up">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('order.placeOrder')}</h3>
                <form onSubmit={handleOrder} className="space-y-3">
                  <div>
                    <label className="label">{t('order.orderQuantity')} ({product.unit || 'kg'})</label>
                    <input type="number" required min="0.1" max={product.quantity} step="0.1" className="input-field"
                      placeholder={`Max: ${product.quantity} ${product.unit || 'kg'}`}
                      value={orderForm.quantity} onChange={e => setOrderForm({ ...orderForm, quantity: e.target.value })} />
                    {totalPrice && <p className="text-sm text-paddy-green mt-1 font-semibold">Total: ₹{totalPrice}</p>}
                  </div>
                  <div>
                    <label className="label">{t('order.deliveryAddress')}</label>
                    <textarea className="input-field" rows={2} placeholder="Enter delivery address"
                      value={orderForm.delivery_address} onChange={e => setOrderForm({ ...orderForm, delivery_address: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">{t('order.notes')} (optional)</label>
                    <input type="text" className="input-field" placeholder="Any special instructions"
                      value={orderForm.notes} onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={ordering} className="btn-primary flex-1 py-2.5 disabled:opacity-60">
                      {ordering ? t('common.loading') : t('common.confirm')}
                    </button>
                    <button type="button" onClick={() => setShowOrderForm(false)} className="btn-secondary flex-1 py-2.5">
                      {t('common.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
