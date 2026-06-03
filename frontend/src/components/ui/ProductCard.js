import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, MapPin, User, ShoppingCart } from 'lucide-react';
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

export default function ProductCard({ product, onFavoriteToggle, isFavorited = false }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(isFavorited);
  const [loading, setLoading] = useState(false);

  const handleFavorite = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to save favorites'); return; }
    if (user.role !== 'buyer') return;
    setLoading(true);
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
      onFavoriteToggle?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating favorites');
    } finally {
      setLoading(false);
    }
  };

  const isAvailable = product.status === 'active' && parseFloat(product.quantity) > 0;

  return (
    <Link to={`/products/${product.id}`} className="card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group overflow-hidden block">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-700">
        <img
          src={product.image_url || PLACEHOLDER}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = PLACEHOLDER; }}
        />
        {/* Category Badge */}
        <span className={`absolute top-2 left-2 badge ${CATEGORY_COLORS[product.category] || CATEGORY_COLORS.other} capitalize`}>
          {t(`product.categories.${product.category}`) || product.category}
        </span>
        {/* Availability */}
        <span className={`absolute top-2 right-2 badge ${isAvailable ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {isAvailable ? t('product.available') : t('product.soldOut')}
        </span>
        {/* Favorite Button */}
        {user?.role === 'buyer' && (
          <button onClick={handleFavorite} disabled={loading}
            className="absolute bottom-2 right-2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform">
            <Heart className={`w-4 h-4 ${favorited ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1 truncate">{product.name}</h3>

        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-paddy-green dark:text-earthy-green">₹{product.price}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">per {product.unit || 'kg'}</span>
        </div>

        {product.suggested_price && product.suggested_price !== product.price && (
          <p className="text-xs text-harvest-yellow mb-2">
            💡 {t('product.suggestedPrice')}: ₹{product.suggested_price}
          </p>
        )}

        <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="truncate">{product.farmer_name}</span>
          </div>
          {product.farmer_location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{product.farmer_location || product.location}</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {product.quantity} {product.unit || 'kg'} available
          </span>
          <span className="flex items-center gap-1 text-xs text-paddy-green font-medium group-hover:underline">
            <ShoppingCart className="w-3 h-3" /> {t('product.viewDetails')}
          </span>
        </div>
      </div>
    </Link>
  );
}
