import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MapPin, User, Phone, Calendar, Clock, Package,
  ShoppingCart, Heart, ArrowLeft, Lightbulb, Star, Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80';

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  low_stock: 'bg-yellow-100 text-yellow-700',
  out_of_stock: 'bg-red-100 text-red-700',
};
const STATUS_LABELS = {
  active: '✅ Available',
  low_stock: '⚠️ Low Stock',
  out_of_stock: '❌ Out of Stock',
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({ quantity: '', delivery_address: '', notes: '' });
  const [ordering, setOrdering] = useState(false);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(({ data }) => setProduct(data.product))
      .catch(() => navigate('/marketplace'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleOrder = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to place an order');
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    setOrdering(true);
    try {
      const { data } = await api.post('/orders', { product_id: product.id, ...orderForm });
      toast.success(`Order #${data.orderId} placed! Total: ₹${data.totalPrice}`);
      setShowOrderForm(false);
      setOrderForm({ quantity: '', delivery_address: '', notes: '' });
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally { setOrdering(false); }
  };

  const toggleFavorite = async () => {
    if (!user) { toast.error('Login to save favorites'); return; }
    try {
      if (favorited) {
        await api.delete(`/favorites/${product.id}`);
        setFavorited(false);
        toast.success('Removed from favorites');
      } else {
        await api.post(`/favorites/${product.id}`);
        setFavorited(true);
        toast.success('Added to favorites');
      }
    } catch {}
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-paddy-green" />
    </div>
  );
  if (!product) return null;

  const isAvailable = product.status !== 'out_of_stock' && parseFloat(product.quantity) > 0;
  const totalPrice = orderForm.quantity ? (parseFloat(orderForm.quantity) * parseFloat(product.price)).toFixed(2) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-charcoal py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-gray-500 hover:text-paddy-green mb-6 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image */}
          <div>
            <div className="card overflow-hidden">
              <img src={product.image_url || PLACEHOLDER} alt={product.name}
                className="w-full h-80 lg:h-96 object-cover"
                onError={e => { e.target.src = PLACEHOLDER; }} />
            </div>
            {/* Farmer card below image on desktop */}
            <div className="card p-5 mt-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-paddy-green" /> Farmer Details
              </h3>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-paddy-green flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                  {product.farmer_photo
                    ? <img src={product.farmer_photo} alt={product.farmer_name} className="w-full h-full object-cover" />
                    : product.farmer_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 space-y-1.5 text-sm">
                  <p className="font-semibold text-gray-900 dark:text-white text-base">{product.farmer_name}</p>
                  {product.farmer_village && (
                    <p className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-paddy-green" />
                      {[product.farmer_village, product.farmer_district, product.farmer_state].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {product.farmer_location && !product.farmer_village && (
                    <p className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-paddy-green" /> {product.farmer_location}
                    </p>
                  )}
                  {product.farming_experience && (
                    <p className="text-gray-500 dark:text-gray-400 text-xs">{product.farming_experience} years farming experience</p>
                  )}
                  {product.farmer_total_products > 0 && (
                    <p className="text-xs text-paddy-green">{product.farmer_total_products} active listings</p>
                  )}
                </div>
              </div>
              {/* Contact buttons */}
              <div className="flex gap-2 mt-4">
                {product.farmer_mobile && (
                  <a href={`tel:${product.farmer_mobile}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-paddy-green hover:bg-leaf-green text-white text-sm font-medium py-2 rounded-lg transition-colors">
                    <Phone className="w-4 h-4" /> Call Farmer
                  </a>
                )}
                {product.farmer_email && (
                  <a href={`mailto:${product.farmer_email}`}
                    className="flex-1 flex items-center justify-center gap-1.5 btn-secondary text-sm py-2">
                    <Mail className="w-4 h-4" /> Email
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Name + price */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`badge capitalize text-xs ${STATUS_STYLES[product.status] || STATUS_STYLES.active}`}>
                  {STATUS_LABELS[product.status] || 'Available'}
                </span>
                <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize text-xs">
                  {t(`product.categories.${product.category}`)}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-paddy-green dark:text-earthy-green">₹{product.price}</span>
                <span className="text-gray-500">per {product.unit || 'kg'}</span>
              </div>
              {product.suggested_price && parseFloat(product.suggested_price) !== parseFloat(product.price) && (
                <div className="flex items-center gap-2 mt-2 p-2.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <Lightbulb className="w-4 h-4 text-harvest-yellow flex-shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t('product.suggestedPrice')}: <strong className="text-harvest-yellow">₹{product.suggested_price}</strong>/kg
                  </p>
                </div>
              )}
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Package className="w-4 h-4" />, label: 'Quantity', value: `${product.quantity} ${product.unit || 'kg'}` },
                { icon: <MapPin className="w-4 h-4" />, label: 'Location', value: product.location || product.farmer_location || 'N/A' },
                { icon: <Calendar className="w-4 h-4" />, label: 'Harvested', value: product.harvest_date ? new Date(product.harvest_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A' },
                {
                  icon: <Clock className="w-4 h-4" />,
                  label: 'Fresh Until',
                  value: product.fresh_until
                    ? new Date(product.fresh_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : product.shelf_life ? `${product.shelf_life} days` : 'N/A'
                },
              ].map((item, i) => (
                <div key={i} className="card p-3 flex items-start gap-2">
                  <span className="text-paddy-green mt-0.5 flex-shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {product.description && (
              <div className="card p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">About this product</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <a href={product.farmer_mobile ? `tel:${product.farmer_mobile}` : `#`}
                className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3 bg-white text-paddy-green border border-paddy-green hover:bg-green-50">
                <Phone className="w-5 h-5" /> Contact Farmer
              </a>
              {user?.role === 'buyer' && isAvailable && (
                <button onClick={() => setShowOrderForm(!showOrderForm)}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
                  <ShoppingCart className="w-5 h-5" /> {t('product.placeOrder')}
                </button>
              )}
              {user?.role === 'buyer' && (
                <button onClick={toggleFavorite}
                  className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${favorited ? 'bg-red-50 border-red-300 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-red-300'}`}>
                  <Heart className={`w-5 h-5 ${favorited ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>
              )}
              {!user && (
                <Link to="/login" state={{ from: `/products/${id}` }}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
                  Login to Order
                </Link>
              )}
            </div>
            {!isAvailable && product.status === 'out_of_stock' && (
              <p className="text-center text-red-500 font-medium text-sm">This product is currently out of stock</p>
            )}

            {/* Order form */}
            {showOrderForm && (
              <div className="card p-5 border-2 border-paddy-green animate-slide-up">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-paddy-green" /> {t('order.placeOrder')}
                </h3>
                <form onSubmit={handleOrder} className="space-y-3">
                  <div>
                    <label className="label">{t('order.orderQuantity')} ({product.unit || 'kg'}) *</label>
                    <input type="number" required min="0.1" max={product.quantity} step="0.1"
                      className="input-field"
                      placeholder={`Max: ${product.quantity} ${product.unit || 'kg'}`}
                      value={orderForm.quantity}
                      onChange={e => setOrderForm({ ...orderForm, quantity: e.target.value })} />
                    {totalPrice && (
                      <p className="text-sm text-paddy-green mt-1 font-semibold">
                        Total: ₹{totalPrice}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="label">{t('order.deliveryAddress')} *</label>
                    <textarea required className="input-field" rows={2}
                      placeholder="Door no, Street, City, Pincode"
                      value={orderForm.delivery_address}
                      onChange={e => setOrderForm({ ...orderForm, delivery_address: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">{t('order.notes')} (optional)</label>
                    <input type="text" className="input-field"
                      placeholder="Special instructions, preferred delivery time..."
                      value={orderForm.notes}
                      onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={ordering}
                      className="btn-primary flex-1 py-2.5 disabled:opacity-60">
                      {ordering ? 'Placing...' : 'Confirm Order'}
                    </button>
                    <button type="button" onClick={() => setShowOrderForm(false)}
                      className="btn-secondary flex-1 py-2.5">
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
