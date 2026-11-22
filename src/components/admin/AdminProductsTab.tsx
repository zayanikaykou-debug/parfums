import React, { useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { formatTnd, useStore } from '../../context/StoreContext';
import type { Category, Product } from '../../types';
import { adminFetch } from '../../utils/adminApi';
import { LuxuryImage } from '../LuxuryImage';

interface AdminProductsTabProps {
  products: Product[];
  categories: Category[];
  onRefresh: () => Promise<void>;
}

interface VariantDraft {
  volume: string;
  price_tnd: string;
  sale_price_tnd: string;
  stock: string;
  sku: string;
}

interface ProductFormState {
  id: number | null;
  name: string;
  brand: string;
  category_slug: string;
  olfactory_family: string;
  description: string;
  top_notes: string;
  heart_notes: string;
  base_notes: string;
  images: string[];
  is_featured: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  is_visible: boolean;
  is_gift_set: boolean;
  variants: VariantDraft[];
}

const EMPTY_FORM = (defaultCategory: string): ProductFormState => ({
  id: null,
  name: '',
  brand: 'Zephor Parfums',
  category_slug: defaultCategory || 'parfums-unisexe',
  olfactory_family: 'Ambré Boisé',
  description: '',
  top_notes: '',
  heart_notes: '',
  base_notes: '',
  images: [],
  is_featured: false,
  is_bestseller: false,
  is_new: true,
  is_visible: true,
  is_gift_set: false,
  variants: [{ volume: '50 ml', price_tnd: '240', sale_price_tnd: '', stock: '10', sku: '' }],
});

export function AdminProductsTab({
  products,
  categories,
  onRefresh,
}: AdminProductsTabProps) {
  const { t, getCategoryLabel } = useStore();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(() =>
    EMPTY_FORM(categories[0]?.slug || 'parfums-unisexe')
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  const openCreate = () => {
    setError('');
    setForm(EMPTY_FORM(categories[0]?.slug || 'parfums-unisexe'));
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setError('');
    setForm({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category_slug: p.category_slug,
      olfactory_family: p.olfactory_family,
      description: p.description,
      top_notes: p.top_notes,
      heart_notes: p.heart_notes,
      base_notes: p.base_notes,
      images: p.images || [],
      is_featured: p.is_featured,
      is_bestseller: p.is_bestseller,
      is_new: p.is_new,
      is_visible: p.is_visible,
      is_gift_set: p.is_gift_set,
      variants:
        p.variants.length > 0
          ? p.variants.map((v) => ({
              volume: v.volume,
              price_tnd: String(v.price_tnd),
              sale_price_tnd: v.sale_price_tnd ? String(v.sale_price_tnd) : '',
              stock: String(v.stock),
              sku: v.sku || '',
            }))
          : [{ volume: '50 ml', price_tnd: '240', sale_price_tnd: '', stock: '10', sku: '' }],
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await adminFetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec du téléversement');
      setForm((prev) => ({ ...prev, images: [...prev.images, data.url] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur upload');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCreatingCat(true);
    try {
      const res = await adminFetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      if (res.ok) {
        const created = (await res.json()) as Category;
        setNewCategoryName('');
        await onRefresh();
        setForm((prev) => ({ ...prev, category_slug: created.slug }));
      }
    } finally {
      setCreatingCat(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError(t.admin.productsTab.errNameRequired);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim() || 'Zephor Parfums',
        category_slug: form.category_slug,
        olfactory_family: form.olfactory_family.trim(),
        description: form.description.trim(),
        top_notes: form.top_notes.trim(),
        heart_notes: form.heart_notes.trim(),
        base_notes: form.base_notes.trim(),
        images: form.images,
        is_featured: form.is_featured,
        is_bestseller: form.is_bestseller,
        is_new: form.is_new,
        is_visible: form.is_visible,
        is_gift_set: form.is_gift_set,
        variants: form.variants.map((v) => ({
          volume: v.volume.trim() || '50 ml',
          price_tnd: Number(v.price_tnd || 0),
          sale_price_tnd: v.sale_price_tnd.trim() ? Number(v.sale_price_tnd) : null,
          stock: Math.max(0, Math.floor(Number(v.stock || 0))),
          sku: v.sku.trim(),
        })),
      };

      const url = form.id ? `/api/admin/products/${form.id}` : '/api/admin/products';
      const method = form.id ? 'PUT' : 'POST';
      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la sauvegarde.');
      setModalOpen(false);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Product) => {
    await adminFetch(`/api/admin/products/${p.id}`, { method: 'DELETE' });
    await onRefresh();
  };

  const toggleVisibility = async (p: Product) => {
    await adminFetch(`/api/admin/products/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p, is_visible: !p.is_visible }),
    });
    await onRefresh();
  };

  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      (p.category_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#D4AF6E]/70 absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.admin.productsTab.searchPlaceholder}
            className="w-full ps-10 pe-4 py-2.5 text-sm rounded-lg bg-[#0B1325] border border-[#D4AF6E]/20 text-[#F7F4EE] focus:outline-none focus:border-[#D4AF6E]"
          />
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-[#D4AF6E] text-[#060B17] hover:bg-[#E8CFA0] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.admin.productsTab.addPerfume}</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-[#D4AF6E]/15 bg-[#0B1325]/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-[#D4AF6E]/15 text-[11px] uppercase tracking-wider text-[#D4AF6E]">
                <th className="py-3.5 px-4 font-medium text-start">
                  {t.admin.productsTab.colFragrance}
                </th>
                <th className="py-3.5 px-4 font-medium text-start">
                  {t.admin.productsTab.colCategory}
                </th>
                <th className="py-3.5 px-4 font-medium text-start">
                  {t.admin.productsTab.colVariants}
                </th>
                <th className="py-3.5 px-4 font-medium text-end">
                  {t.admin.productsTab.colStock}
                </th>
                <th className="py-3.5 px-4 font-medium text-start">
                  {t.admin.productsTab.colStatus}
                </th>
                <th className="py-3.5 px-4 font-medium text-end">
                  {t.admin.productsTab.colActions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF6E]/10 text-sm">
              {filtered.map((p) => {
                const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
                const catLabel = getCategoryLabel({
                  slug: p.category_slug,
                  name: p.category_name || p.category_slug,
                }).name;
                return (
                  <tr key={p.id} className="hover:bg-[#101A33]/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#060B17] border border-[#D4AF6E]/15 shrink-0">
                          <LuxuryImage
                            src={p.images[0] || ''}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-serif text-base text-[#F7F4EE]">
                            {p.name}
                          </div>
                          <div className="text-xs text-[#F7F4EE]/50">
                            {p.brand}
                            {p.is_featured && ` · ${t.admin.productsTab.featuredTag}`}
                            {p.is_gift_set && ` · ${t.admin.productsTab.giftSetTag}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#F7F4EE]/75">{catLabel}</td>
                    <td className="py-3.5 px-4 text-xs tabular-nums text-[#F7F4EE]/80">
                      {p.variants.map((v) => (
                        <div key={v.id}>
                          {v.volume} :{' '}
                          <span className="text-[#E8CFA0]">
                            {formatTnd(v.sale_price_tnd ?? v.price_tnd)}
                          </span>
                        </div>
                      ))}
                    </td>
                    <td className="py-3.5 px-4 text-end tabular-nums">
                      <span
                        className={`text-xs font-medium ${
                          totalStock === 0
                            ? 'text-rose-300'
                            : totalStock <= 5
                              ? 'text-amber-300'
                              : 'text-[#F7F4EE]'
                        }`}
                      >
                        {totalStock}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <button
                        type="button"
                        onClick={() => toggleVisibility(p)}
                        className={`inline-flex items-center gap-1.5 cursor-pointer ${
                          p.is_visible ? 'text-emerald-300' : 'text-[#F7F4EE]/45'
                        }`}
                      >
                        {p.is_visible ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {p.is_visible
                            ? t.admin.productsTab.visible
                            : t.admin.productsTab.hidden}
                        </span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-end">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          aria-label={p.name}
                          className="p-2 rounded-lg text-[#F7F4EE]/70 hover:text-[#E8CFA0] hover:bg-[#101A33] cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          aria-label={p.name}
                          className="p-2 rounded-lg text-[#F7F4EE]/55 hover:text-rose-300 hover:bg-[#101A33] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060B17]/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl liquid-glass p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#D4AF6E]/15 pb-4">
              <h2 className="font-serif text-2xl text-[#F7F4EE]">
                {form.id ? t.admin.productsTab.editTitle : t.admin.productsTab.createTitle}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 text-[#F7F4EE]/60 hover:text-[#F7F4EE] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-400/30 text-xs text-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs text-[#F7F4EE]/75">
                    {t.admin.productsTab.nameLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE] focus:outline-none focus:border-[#D4AF6E]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs text-[#F7F4EE]/75">
                    {t.admin.productsTab.brandLabel}
                  </label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE] focus:outline-none focus:border-[#D4AF6E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs text-[#F7F4EE]/75">
                    {t.admin.productsTab.categoryLabel}
                  </label>
                  <select
                    value={form.category_slug}
                    onChange={(e) => setForm({ ...form, category_slug: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE] focus:outline-none focus:border-[#D4AF6E]"
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {getCategoryLabel(c).name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs text-[#F7F4EE]/75">
                    {t.admin.productsTab.familyLabel}
                  </label>
                  <input
                    type="text"
                    value={form.olfactory_family}
                    onChange={(e) =>
                      setForm({ ...form, olfactory_family: e.target.value })
                    }
                    placeholder={t.admin.productsTab.familyPlaceholder}
                    className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE] focus:outline-none focus:border-[#D4AF6E]"
                  />
                </div>
              </div>

              {/* Quick create category */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={t.admin.productsTab.newCategoryPlaceholder}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-[#060B17] border border-[#D4AF6E]/15 text-[#F7F4EE]"
                />
                <button
                  type="button"
                  disabled={creatingCat || !newCategoryName.trim()}
                  onClick={handleCreateCategory}
                  className="px-3 py-1.5 text-xs rounded-lg border border-[#D4AF6E]/30 text-[#E8CFA0] hover:bg-[#101A33] disabled:opacity-40 cursor-pointer"
                >
                  {t.admin.productsTab.createCategoryBtn}
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs text-[#F7F4EE]/75">
                  {t.admin.productsTab.descriptionLabel}
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE] focus:outline-none focus:border-[#D4AF6E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs text-[#F7F4EE]/75">
                    {t.admin.productsTab.topNotes}
                  </label>
                  <input
                    type="text"
                    value={form.top_notes}
                    onChange={(e) => setForm({ ...form, top_notes: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs text-[#F7F4EE]/75">
                    {t.admin.productsTab.heartNotes}
                  </label>
                  <input
                    type="text"
                    value={form.heart_notes}
                    onChange={(e) => setForm({ ...form, heart_notes: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs text-[#F7F4EE]/75">
                    {t.admin.productsTab.baseNotes}
                  </label>
                  <input
                    type="text"
                    value={form.base_notes}
                    onChange={(e) => setForm({ ...form, base_notes: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
                  />
                </div>
              </div>

              {/* Images */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-[#F7F4EE]/75">
                    {t.admin.productsTab.galleryLabel}
                  </label>
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-[#D4AF6E]/35 text-[#E8CFA0] hover:bg-[#101A33] cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {uploading
                        ? t.admin.productsTab.uploading
                        : t.admin.productsTab.uploadImage}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-3">
                  {form.images.map((img, i) => (
                    <div
                      key={`${img}-${i}`}
                      className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#D4AF6E]/25 bg-[#060B17]"
                    >
                      <LuxuryImage src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            images: prev.images.filter((_, idx) => idx !== i),
                          }))
                        }
                        className="absolute top-1 end-1 p-0.5 rounded bg-[#060B17]/80 text-[#F7F4EE] hover:text-rose-300 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Variations */}
              <div className="space-y-3 pt-2 border-t border-[#D4AF6E]/15">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#D4AF6E]">
                    {t.admin.productsTab.variantsTitle}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        variants: [
                          ...prev.variants,
                          {
                            volume: '100 ml',
                            price_tnd: '320',
                            sale_price_tnd: '',
                            stock: '10',
                            sku: '',
                          },
                        ],
                      }))
                    }
                    className="text-xs text-[#E8CFA0] hover:underline cursor-pointer"
                  >
                    {t.admin.productsTab.addVariant}
                  </button>
                </div>

                <div className="space-y-2.5">
                  {form.variants.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        placeholder="50 ml"
                        value={v.volume}
                        onChange={(e) => {
                          const next = [...form.variants];
                          next[idx] = { ...v, volume: e.target.value };
                          setForm({ ...form, variants: next });
                        }}
                        className="col-span-3 px-2.5 py-2 text-xs rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
                      />
                      <input
                        type="number"
                        placeholder={t.admin.productsTab.pricePlaceholder}
                        value={v.price_tnd}
                        onChange={(e) => {
                          const next = [...form.variants];
                          next[idx] = { ...v, price_tnd: e.target.value };
                          setForm({ ...form, variants: next });
                        }}
                        className="col-span-3 px-2.5 py-2 text-xs rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE] tabular-nums"
                      />
                      <input
                        type="number"
                        placeholder={t.admin.productsTab.promoPlaceholder}
                        value={v.sale_price_tnd}
                        onChange={(e) => {
                          const next = [...form.variants];
                          next[idx] = { ...v, sale_price_tnd: e.target.value };
                          setForm({ ...form, variants: next });
                        }}
                        className="col-span-3 px-2.5 py-2 text-xs rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE] tabular-nums"
                      />
                      <input
                        type="number"
                        placeholder={t.admin.productsTab.stockPlaceholder}
                        value={v.stock}
                        onChange={(e) => {
                          const next = [...form.variants];
                          next[idx] = { ...v, stock: e.target.value };
                          setForm({ ...form, variants: next });
                        }}
                        className="col-span-2 px-2.5 py-2 text-xs rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE] tabular-nums"
                      />
                      <button
                        type="button"
                        disabled={form.variants.length <= 1}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            variants: prev.variants.filter((_, i) => i !== idx),
                          }))
                        }
                        className="col-span-1 p-1.5 text-[#F7F4EE]/50 hover:text-rose-300 disabled:opacity-25 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flags */}
              <div className="flex flex-wrap gap-5 pt-2 text-xs text-[#F7F4EE]/80">
                {[
                  { key: 'is_featured', label: t.admin.productsTab.flagFeatured },
                  { key: 'is_bestseller', label: t.admin.productsTab.flagBestseller },
                  { key: 'is_new', label: t.admin.productsTab.flagNew },
                  { key: 'is_gift_set', label: t.admin.productsTab.flagGiftSet },
                  { key: 'is_visible', label: t.admin.productsTab.flagVisible },
                ].map((flag) => (
                  <label key={flag.key} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(form[flag.key as keyof ProductFormState])}
                      onChange={(e) =>
                        setForm({ ...form, [flag.key]: e.target.checked })
                      }
                      className="accent-[#D4AF6E]"
                    />
                    <span>{flag.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#D4AF6E]/15">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 text-xs rounded-lg border border-[#D4AF6E]/25 text-[#F7F4EE]/80 hover:text-[#F7F4EE] cursor-pointer"
                >
                  {t.admin.productsTab.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 text-xs font-semibold rounded-lg bg-[#D4AF6E] text-[#060B17] hover:bg-[#E8CFA0] disabled:opacity-50 cursor-pointer"
                >
                  {saving ? t.admin.productsTab.saving : t.admin.productsTab.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
