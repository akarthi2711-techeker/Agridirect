import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Upload, Lightbulb, ArrowLeft, Trash2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['vegetables', 'fruits', 'grains', 'organic', 'other'];
const STATUSES = ['active', 'inactive', 'sold_out'];

export default function EditProductPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState(null);

  useEffect(() => {
    api.get(`/market/${id}`).then(({ data }) => {
      const p = data.product;
      setForm({
        name: p.name, category: p.category, quantity: p.quantity, price: p.price,
        location: p.location || '', description: p.description || '',
        harvest_date: p.harvest_date ? p.harvest_date.split('T')[0] : '',
        shelf_life: p.shelf_life || '', status: p.status,
      });
      setPreview(p.image_url);
    }).catch(() => navigate('/dashboard'));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'quantity' || name === 'price') {
      const qty = name === 'quantity' ? value : form.quantity;
      const price = name === 'price' ? value : form.price;
      const q = parseFloat(qty);
      const base = parseFloat(price) || 20;
      if (q > 100) setSuggestedPrice((base * 0.9).toFixed(2));
      else if (q >= 50) setSuggestedPrice(base.toFixed(2));
      else setSuggestedPrice((base * 1.1).toFixed(2));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v !== null && v !== undefined && fd.append(k, v));
      if (image) fd.append('image', image);
      await api.put(`/market/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Product updated successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update product');
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setDeleting(true);
    try {
      await api.delete(`/market/${id}`);
      toast.success('Product deleted');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally { setDeleting(false); }
  };

  if (!form) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-paddy-green" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-charcoal py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-gray-500 hover:text-paddy-green mb-6 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="card p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('product.editProduct')}</h1>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger flex items-center gap-1 text-sm py-1.5 px-3">
              <Trash2 className="w-4 h-4" /> {deleting ? 'Deleting...' : t('common.delete')}
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">{t('product.uploadImage')}</label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center hover:border-paddy-green transition-colors cursor-pointer"
                onClick={() => document.getElementById('edit-img').click()}>
                {preview ? <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-lg" /> :
                  <div className="py-6"><Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" /><p className="text-sm text-gray-500">Click to change image</p></div>}
                <input id="edit-img" type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files[0]; if (f) { setImage(f); setPreview(URL.createObjectURL(f)); } }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">{t('product.productName')} *</label>
                <input name="name" required className="input-field" value={form.name} onChange={handleChange} />
              </div>
              <div>
                <label className="label">{t('product.category')} *</label>
                <select name="category" required className="input-field" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{t(`product.categories.${c}`)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select name="status" className="input-field" value={form.status} onChange={handleChange}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t('product.quantity')} (kg) *</label>
                <input name="quantity" type="number" required min="0.1" step="0.1" className="input-field" value={form.quantity} onChange={handleChange} />
              </div>
              <div>
                <label className="label">{t('product.price')} *</label>
                <input name="price" type="number" required min="0.01" step="0.01" className="input-field" value={form.price} onChange={handleChange} />
                {suggestedPrice && <div className="flex items-center gap-1 mt-1 text-xs text-harvest-yellow"><Lightbulb className="w-3 h-3" /> Suggested: ₹{suggestedPrice}/kg</div>}
              </div>
              <div>
                <label className="label">{t('product.location')}</label>
                <input name="location" className="input-field" value={form.location} onChange={handleChange} />
              </div>
              <div>
                <label className="label">{t('product.harvestDate')}</label>
                <input name="harvest_date" type="date" className="input-field" value={form.harvest_date} onChange={handleChange} />
              </div>
              <div>
                <label className="label">{t('product.shelfLife')}</label>
                <input name="shelf_life" className="input-field" value={form.shelf_life} onChange={handleChange} />
              </div>
              <div className="col-span-2">
                <label className="label">{t('product.description')}</label>
                <textarea name="description" className="input-field" rows={3} value={form.description} onChange={handleChange} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 disabled:opacity-60">
                {loading ? t('common.loading') : t('common.save')}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary px-6 py-3">{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
