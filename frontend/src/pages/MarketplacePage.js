import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, X, SlidersHorizontal, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ui/ProductCard';
import SkeletonCard from '../components/ui/SkeletonCard';
import api from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['all', 'vegetables', 'fruits', 'grains', 'organic', 'other'];
const AVAILABILITY = [
  { value: 'all', label: 'All' },
  { value: 'active', label: '✅ Available' },
  { value: 'low_stock', label: '⚠️ Low Stock' },
  { value: 'out_of_stock', label: '❌ Out of Stock' },
];

export default function MarketplacePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [location, setLocation] = useState('');
  const [availability, setAvailability] = useState('all');
  const searchTimer = useRef(null);

  // Debounced fetch on filter changes
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchProducts(true), 350);
    return () => clearTimeout(searchTimer.current);
  }, [search, category, sort, minPrice, maxPrice, location, availability]);

  useEffect(() => {
    if (page > 1) fetchProducts(false);
  }, [page]);

  const fetchProducts = async (reset = false) => {
    setLoading(true);
    try {
      const p = reset ? 1 : page;
      const params = { search, category, sort, page: p, limit: 12 };
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (location) params.location = location;
      if (availability !== 'all') params.availability = availability;

      const { data } = await api.get('/products', { params });
      setProducts(reset ? data.products : prev => [...prev, ...data.products]);
      setTotalPages(data.pages);
      setTotal(data.total);
      if (reset) setPage(1);
    } catch {}
    finally { setLoading(false); }
  };

  const clearAll = () => {
    setSearch(''); setCategory('all'); setMinPrice('');
    setMaxPrice(''); setLocation(''); setAvailability('all');
  };

  const hasFilters = search || category !== 'all' || minPrice || maxPrice || location || availability !== 'all';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-charcoal py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🌿 {t('nav.marketplace')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{total} products from local farmers</p>
        </div>

        {/* Farmer: My Listings management panel */}
        {user?.role === 'farmer' && <FarmerListingsPanel onProductDeleted={() => fetchProducts(true)} />}

        {/* Search bar + controls */}
        <div className="card p-4 mb-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="input-field pl-9 pr-9"
                placeholder={t('marketplace.search')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select className="input-field w-44" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="latest">{t('marketplace.latest')}</option>
              <option value="price_asc">{t('marketplace.priceLow')}</option>
              <option value="price_desc">{t('marketplace.priceHigh')}</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${showFilters ? 'bg-paddy-green text-white border-paddy-green' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-paddy-green'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasFilters && <span className="w-2 h-2 bg-harvest-yellow rounded-full" />}
            </button>
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${category === cat ? 'bg-paddy-green text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                {t(`product.categories.${cat}`)}
              </button>
            ))}
          </div>

          {/* Advanced filters panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-up">
              <div>
                <label className="label text-xs">Min Price (₹)</label>
                <input type="number" className="input-field text-sm" placeholder="0"
                  value={minPrice} onChange={e => setMinPrice(e.target.value)} />
              </div>
              <div>
                <label className="label text-xs">Max Price (₹)</label>
                <input type="number" className="input-field text-sm" placeholder="Any"
                  value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
              </div>
              <div>
                <label className="label text-xs">Location / District</label>
                <input type="text" className="input-field text-sm" placeholder="e.g. Coimbatore"
                  value={location} onChange={e => setLocation(e.target.value)} />
              </div>
              <div>
                <label className="label text-xs">Availability</label>
                <select className="input-field text-sm" value={availability} onChange={e => setAvailability(e.target.value)}>
                  {AVAILABILITY.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              {hasFilters && (
                <div className="col-span-2 sm:col-span-4">
                  <button onClick={clearAll} className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1">
                    <X className="w-3 h-3" /> Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {loading && products.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('marketplace.noProducts')}</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
            {hasFilters && <button onClick={clearAll} className="btn-primary mt-4 text-sm">Clear Filters</button>}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
              {loading && Array(4).fill(0).map((_, i) => <SkeletonCard key={`sk-${i}`} />)}
            </div>
            {page < totalPages && (
              <div className="text-center mt-8">
                <button onClick={() => setPage(prev => prev + 1)} disabled={loading} className="btn-secondary px-8 py-3">
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

// ── Farmer's own listings with edit + delete ──────────────────────────────
function FarmerListingsPanel({ onProductDeleted }) {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get('/products/farmer/my')
      .then(({ data }) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeleting(product.id);
    try {
      await api.delete(`/products/${product.id}`);
      toast.success(`"${product.name}" deleted.`);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      onProductDeleted?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleting(null);
    }
  };

  const STATUS_COLORS = {
    active: 'bg-green-100 text-green-700',
    low_stock: 'bg-yellow-100 text-yellow-700',
    out_of_stock: 'bg-red-100 text-red-700',
    inactive: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="card mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-white">My Listings</span>
          <span className="badge bg-paddy-green text-white text-xs">{products.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/products/add"
            onClick={e => e.stopPropagation()}
            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Product
          </Link>
          <span className="text-gray-400 text-xs">{open ? '▲ Hide' : '▼ Show'}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3">
          {loading ? (
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}
            </div>
          ) : products.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No products yet.{' '}
              <Link to="/products/add" className="text-paddy-green hover:underline">Add your first product</Link>
            </p>
          ) : (
            <div className="space-y-2">
              {products.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{p.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ₹{p.price}/kg · {p.quantity} {p.unit || 'kg'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className={`badge text-xs capitalize ${STATUS_COLORS[p.status] || STATUS_COLORS.inactive}`}>
                      {p.status?.replace('_', ' ')}
                    </span>
                    <Link
                      to={`/products/edit/${p.id}`}
                      className="p-1.5 text-gray-400 hover:text-paddy-green transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(p)}
                      disabled={deleting === p.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
