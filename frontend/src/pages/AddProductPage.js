import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Upload, Lightbulb, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['vegetables', 'fruits', 'grains', 'organic', 'other'];

export default function AddProductPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', category: 'vegetables', quantity: '', price: '',
    location: '', description: '', harvest_date: '', shelf_life: '', status: 'active',
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const calcSuggested = (qty, price) => {
    const q = parseFloat(qty);
    if (!q) return;
    const base = parseFloat(price) || 20;
    if (q > 100) setSuggestedPrice((base * 0.9).toFixed(2));
    else if (q >= 50) setSuggestedPrice(base.toFixed(2));
    else setSuggestedPrice((base * 1.1).toFixed(2));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'quantity' || name === 'price') {
      calcSuggested(name === 'quantity' ? value : form.quantity, name === 'price' ? value : form.price);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (preview) {
        payload.imageUrl = preview;
      }
      
      await api.post('/market', payload);
      
      toast.success('Product added successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add product');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-charcoal py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-gray-500 hover:text-paddy-green mb-6 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="card p-8">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('product.addProduct')}</h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Image Upload */}
            <div>
              <label className="label">{t('product.uploadImage')}</label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center hover:border-paddy-green transition-colors cursor-pointer"
                onClick={() => document.getElementById('img-input').click()}>
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                ) : (
                  <div className="py-6">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Click to upload (JPEG, PNG, WebP · max 5MB)</p>
                  </div>
                )}
                <input id="img-input" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">{t('product.productName')} *</label>
                <input name="name" required className="input-field" placeholder="e.g. Fresh Tomatoes"
                  value={form.name} onChange={handleChange} />
              </div>
              <div>
                <label className="label">{t('product.category')} *</label>
                <select name="category" required className="input-field" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{t(`product.categories.${c}`)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Availability Status</label>
                <select name="status" className="input-field" value={form.status || 'active'} onChange={handleChange}>
                  <option value="active">Available</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
              <div>
                <label className="label">{t('product.quantity')} (kg) *</label>
                <input name="quantity" type="number" required min="0.1" step="0.1" className="input-field"
                  placeholder="e.g. 100" value={form.quantity} onChange={handleChange} />
              </div>
              <div>
                <label className="label">{t('product.price')} *</label>
                <input name="price" type="number" required min="0.01" step="0.01" className="input-field"
                  placeholder="e.g. 20" value={form.price} onChange={handleChange} />
                {suggestedPrice && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-harvest-yellow">
                    <Lightbulb className="w-3 h-3" /> {t('product.suggestedPrice')}: ₹{suggestedPrice}/kg
                  </div>
                )}
              </div>
              <div>
                <label className="label">{t('product.location')}</label>
                <input name="location" className="input-field" placeholder="e.g. Thanjavur, TN"
                  value={form.location} onChange={handleChange} />
              </div>
              <div>
                <label className="label">{t('product.harvestDate')}</label>
                <input name="harvest_date" type="date" className="input-field"
                  value={form.harvest_date} onChange={handleChange} />
              </div>
              <div>
                <label className="label">{t('product.shelfLife')} (days)</label>
                <input name="shelf_life" type="number" min="1" max="365" className="input-field"
                  placeholder="e.g. 7" value={form.shelf_life} onChange={handleChange} />
                {form.harvest_date && form.shelf_life && (
                  <p className="text-xs text-paddy-green mt-1">
                    Fresh until: {new Date(new Date(form.harvest_date).setDate(new Date(form.harvest_date).getDate() + parseInt(form.shelf_life))).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <label className="label">{t('product.description')}</label>
                <textarea name="description" className="input-field" rows={3}
                  placeholder="Describe your product quality, farming method, etc."
                  value={form.description} onChange={handleChange} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 disabled:opacity-60">
                {loading ? t('common.loading') : t('product.addProduct')}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary px-6 py-3">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
