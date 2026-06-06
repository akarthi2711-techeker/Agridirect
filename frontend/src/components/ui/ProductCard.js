import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, MapPin, User, ShoppingCart, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';

const CATEGORY_COLORS = {
  vegetables: 'bg-green-100 text-green-700',
  fruits: 'bg-orange-100 text-orange-700',
  grains: 'bg-yellow-100 text-yellow-700',
  organic: 'bg-emerald-100 text-emerald-700',
  other: 'bg-gray-100 text-gray-700',
};

const AVAIL_BADGE = {
  active: 'bg-green-500 text-white',
  low_stock: 'bg-yellow-500 text-white',
  out_of_stock: 'bg-red-500 text-white',
};
const AVAIL_LABEL = {
  active: 'Available',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
};

export default function ProductCard({ product, onFavoriteToggle, isFavorited = false }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(isFavorited);
  const [favLoading, setFavLoading] = useState(false);

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('Please login to save favorites'); return; }
    if (user.role !== 'buyer') return;
    setFavLoading(true);
    try {
      if (favorited) {
        await api.delete(`/favorites/${product.id}`);
        setFavorited(false);
        toast.success('Removed from favorites');
      } else {
        await api.post(`/favorites/${product.id}`);
        setFavorited(true);
        toast.success('Saved to favorites');
      }
      onFavoriteToggle?.();
    } catch (err) {
      toast.error('Error updating favorites');
    } finally { setFavLoading(false); }
  };

  const status = product.status || 'active';
  const isAvailable = status !== 'out_of_stock' && parseFloat(product.quantity) > 0;

  const freshUntil = product.fresh_until
    ? new Date(product.fresh_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null;

  return (
    <Link to={`/products/${product.id}`}
      className="card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group overflow-hidden block">

      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-700">
        <img
          src={product.image_url || PLACEHOLDER}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { e.target.src = PLACEHOLDER; }}
        />
        <span className={`absolute top-2 left-2 badge capitalize text-xs ${CATEGORY_COLORS[product.category] || CATEGORY_COLORS.other}`}>
          {t(`product.categories.${product.category}`) || product.category}
        </span>
        <span className={`absolute top-2 right-2 badge text-xs ${AVAIL_BADGE[status] || AVAIL_BADGE.active}`}>
          {AVAIL_LABEL[status] || 'Available'}
        </span>
        {user?.role === 'buyer' && (
          <button
            onClick={handleFavorite}
            disabled={favLoading}
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            className="absolute bottom-2 right-2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform">
            <Heart className={`w-4 h-4 ${favorited ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1 truncate">{product.name}</h3>

        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-bold text-paddy-green dark:text-earthy-green">Rs.{product.price}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">/ {product.unit || 'kg'}</span>
        </div>

        {freshUntil && (
          <div className="flex items-center gap-1 mb-2 text-xs text-green-600 dark:text-green-400">
            <Calendar className="w-3 h-3" />
            <span>Fresh until {freshUntil}</span>
          </div>
        )}

        <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{product.farmer_name}</span>
          </div>
          {(product.farmer_district || product.farmer_location || product.location) && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {product.farmer_district || product.farmer_location || product.location}
              </span>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-gray-50 dark:border-gray-700 pt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {product.quantity} {product.unit || 'kg'} avail.
          </span>
          <span className="flex items-center gap-1 text-xs text-paddy-green font-medium group-hover:underline">
            <ShoppingCart className="w-3 h-3" />
            {isAvailable ? 'View & Order' : 'View Details'}
          </span>
        </div>
      </div>
    </Link>
  );
}
