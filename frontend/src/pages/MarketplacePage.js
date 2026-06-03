import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '../components/ui/ProductCard';
import SkeletonCard from '../components/ui/SkeletonCard';
import api from '../services/api';

const CATEGORIES = ['all', 'vegetables', 'fruits', 'grains', 'organic', 'other'];

export default function MarketplacePage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProducts = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const p = reset ? 1 : page;
      const { data } = await api.get('/products', { params: { search, category, sort, page: p, limit: 12 } });
      setProducts(reset ? data.products : prev => [...prev, ...data.products]);
      setTotalPages(data.pages);
      setTotal(data.total);
      if (reset) setPage(1);
    } catch {}
    finally { setLoading(false); }
  }, [search, category, sort, page]);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(true), 400);
    return () => clearTimeout(timer);
  }, [search, category, sort]);

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  useEffect(() => {
    if (page > 1) fetchProducts(false);
  }, [page]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-charcoal py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🌿 {t('nav.marketplace')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{total} products available from local farmers</p>
        </div>

        {/* Search & Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" className="input-field pl-9" placeholder={t('marketplace.search')}
                value={search} onChange={e => setSearch(e.target.value)} />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {/* Sort */}
            <select className="input-field sm:w-48" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="latest">{t('marketplace.latest')}</option>
              <option value="price_asc">{t('marketplace.priceLow')}</option>
              <option value="price_desc">{t('marketplace.priceHigh')}</option>
            </select>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mt-3">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${category === cat ? 'bg-paddy-green text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                {t(`product.categories.${cat}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {loading && products.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('marketplace.noProducts')}</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
            <button onClick={() => { setSearch(''); setCategory('all'); }} className="btn-primary mt-4 text-sm">Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
              {loading && Array(4).fill(0).map((_, i) => <SkeletonCard key={`sk-${i}`} />)}
            </div>
            {page < totalPages && (
              <div className="text-center mt-8">
                <button onClick={loadMore} disabled={loading} className="btn-secondary px-8 py-3">
                  {loading ? t('common.loading') : t('marketplace.loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
