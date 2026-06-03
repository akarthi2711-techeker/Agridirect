import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';
import ProductCard from '../components/ui/ProductCard';
import SkeletonCard from '../components/ui/SkeletonCard';
import api from '../services/api';

export default function FavoritesPage() {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      const { data } = await api.get('/favorites');
      setFavorites(data.favorites || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFavorites(); }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-charcoal py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500 fill-red-500" /> My Favorites
        </h1>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : favorites.length === 0 ? (
          <div className="card p-12 text-center">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No favorites yet</h3>
            <p className="text-gray-500 mt-2">Browse the marketplace and save products you like</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map(f => <ProductCard key={f.id} product={f} isFavorited={true} onFavoriteToggle={fetchFavorites} />)}
          </div>
        )}
      </div>
    </div>
  );
}
