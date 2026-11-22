import React, { useState } from 'react';
import { Check, Lock, Upload } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { Category, Product, SiteSettings } from '../../types';
import { adminFetch } from '../../utils/adminApi';
import { LuxuryImage } from '../LuxuryImage';

interface AdminCustomizeTabProps {
  settings: SiteSettings;
  categories: Category[];
  products: Product[];
  onRefresh: () => Promise<void>;
}

export function AdminCustomizeTab({
  settings,
  categories,
  products,
  onRefresh,
}: AdminCustomizeTabProps) {
  const { t, getCategoryLabel } = useStore();
  const [form, setForm] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  const uploadImageForSetting = async (
    key: keyof SiteSettings,
    file: File | undefined
  ) => {
    if (!file) return;
    setUploadingKey(key);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await adminFetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm((prev) => ({ ...prev, [key]: data.url }));
      }
    } finally {
      setUploadingKey(null);
    }
  };

  const uploadCategoryImage = async (catId: number, file: File | undefined) => {
    if (!file) return;
    setUploadingKey(`cat-${catId}`);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await adminFetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        await adminFetch(`/api/admin/categories/${catId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: data.url }),
        });
        await onRefresh();
      }
    } finally {
      setUploadingKey(null);
    }
  };

  const toggleFeaturedProduct = async (p: Product) => {
    await adminFetch(`/api/admin/products/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p, is_featured: !p.is_featured }),
    });
    await onRefresh();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedToast(false);
    try {
      const res = await adminFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        await onRefresh();
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg('');
    const res = await adminFetch('/api/admin/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setPwMsg(t.admin.customizeTab.pwUpdated);
      setCurrentPassword('');
      setNewPassword('');
    } else {
      setPwMsg(data.error || t.admin.customizeTab.pwUpdateErr);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* Identity & Hero */}
        <section className="p-6 rounded-xl bg-[#0B1325]/70 border border-[#D4AF6E]/15 space-y-5">
          <div className="flex items-center justify-between border-b border-[#D4AF6E]/12 pb-3">
            <h2 className="font-serif text-2xl text-[#F7F4EE]">
              {t.admin.customizeTab.identityTitle}
            </h2>
            {savedToast && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300">
                <Check className="w-4 h-4" />
                {t.admin.customizeTab.savedToast}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs text-[#F7F4EE]/75">
                {t.admin.customizeTab.logoTextLabel}
              </label>
              <input
                type="text"
                value={form.logo_text}
                onChange={(e) => setForm({ ...form, logo_text: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-[#F7F4EE]/75">
                {t.admin.customizeTab.logoImageLabel}
              </label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg border border-[#D4AF6E]/30 text-[#E8CFA0] cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {uploadingKey === 'logo_image'
                      ? t.admin.customizeTab.sending
                      : t.admin.customizeTab.uploadLogo}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => uploadImageForSetting('logo_image', e.target.files?.[0])}
                    className="hidden"
                  />
                </label>
                {form.logo_image && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, logo_image: '' })}
                    className="text-xs text-rose-300 cursor-pointer"
                  >
                    {t.admin.customizeTab.remove}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs text-[#F7F4EE]/75">
                {t.admin.customizeTab.heroTitleLabel}
              </label>
              <input
                type="text"
                value={form.hero_title}
                onChange={(e) => setForm({ ...form, hero_title: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-[#F7F4EE]/75">
                {t.admin.customizeTab.heroTaglineLabel}
              </label>
              <input
                type="text"
                value={form.hero_tagline}
                onChange={(e) => setForm({ ...form, hero_tagline: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs text-[#F7F4EE]/75">
              {t.admin.customizeTab.heroSubtitleLabel}
            </label>
            <input
              type="text"
              value={form.hero_subtitle}
              onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs text-[#F7F4EE]/75">
                {t.admin.customizeTab.heroPrimaryBtnLabel}
              </label>
              <input
                type="text"
                value={form.hero_cta_primary}
                onChange={(e) => setForm({ ...form, hero_cta_primary: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-[#F7F4EE]/75">
                {t.admin.customizeTab.heroSecondaryBtnLabel}
              </label>
              <input
                type="text"
                value={form.hero_cta_secondary}
                onChange={(e) => setForm({ ...form, hero_cta_secondary: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-[#F7F4EE]/75">
              {t.admin.customizeTab.heroImageLabel}
            </label>
            <div className="flex items-center gap-4">
              <div className="w-32 h-20 rounded-lg overflow-hidden border border-[#D4AF6E]/20 bg-[#060B17]">
                <LuxuryImage
                  src={form.hero_image}
                  alt={t.admin.customizeTab.heroImageLabel}
                  className="w-full h-full object-cover"
                />
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 text-xs rounded-lg border border-[#D4AF6E]/35 text-[#E8CFA0] cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {uploadingKey === 'hero_image'
                    ? t.admin.productsTab.uploading
                    : t.admin.customizeTab.changeHeroPhoto}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => uploadImageForSetting('hero_image', e.target.files?.[0])}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </section>

        {/* Banners & Shipping */}
        <section className="p-6 rounded-xl bg-[#0B1325]/70 border border-[#D4AF6E]/15 space-y-4">
          <h2 className="font-serif text-2xl text-[#F7F4EE] border-b border-[#D4AF6E]/12 pb-3">
            {t.admin.customizeTab.bannerShippingTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs text-[#F7F4EE]/75">
                {t.admin.customizeTab.announcementLabel}
              </label>
              <input
                type="text"
                value={form.announcement_banner}
                onChange={(e) => setForm({ ...form, announcement_banner: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-[#F7F4EE]/75">
                {t.admin.customizeTab.showBannerLabel}
              </label>
              <select
                value={form.announcement_enabled}
                onChange={(e) => setForm({ ...form, announcement_enabled: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
              >
                <option value="true">{t.admin.customizeTab.enabled}</option>
                <option value="false">{t.admin.customizeTab.hiddenOpt}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs text-[#F7F4EE]/75">
                {t.admin.customizeTab.freeShippingLabel}
              </label>
              <input
                type="number"
                value={form.free_shipping_threshold_tnd}
                onChange={(e) =>
                  setForm({ ...form, free_shipping_threshold_tnd: e.target.value })
                }
                className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE] tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-[#F7F4EE]/75">
                {t.admin.customizeTab.shippingFeeLabel}
              </label>
              <input
                type="number"
                value={form.shipping_fee_tnd}
                onChange={(e) => setForm({ ...form, shipping_fee_tnd: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE] tabular-nums"
              />
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="p-6 rounded-xl bg-[#0B1325]/70 border border-[#D4AF6E]/15 space-y-4">
          <h2 className="font-serif text-2xl text-[#F7F4EE] border-b border-[#D4AF6E]/12 pb-3">
            {t.admin.customizeTab.aboutTitle}
          </h2>
          <div className="space-y-1.5">
            <label className="block text-xs text-[#F7F4EE]/75">
              {t.admin.customizeTab.sectionTitleLabel}
            </label>
            <input
              type="text"
              value={form.about_title}
              onChange={(e) => setForm({ ...form, about_title: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs text-[#F7F4EE]/75">
              {t.admin.customizeTab.editorialTextLabel}
            </label>
            <textarea
              rows={3}
              value={form.about_text}
              onChange={(e) => setForm({ ...form, about_text: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-28 h-20 rounded-lg overflow-hidden border border-[#D4AF6E]/20 bg-[#060B17]">
              <LuxuryImage
                src={form.about_image}
                alt={t.admin.customizeTab.aboutTitle}
                className="w-full h-full object-cover"
              />
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 text-xs rounded-lg border border-[#D4AF6E]/35 text-[#E8CFA0] cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>
                {uploadingKey === 'about_image'
                  ? t.admin.customizeTab.sending
                  : t.admin.customizeTab.changeAtelierImg}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => uploadImageForSetting('about_image', e.target.files?.[0])}
                className="hidden"
              />
            </label>
          </div>
        </section>

        {/* Contact & Socials */}
        <section className="p-6 rounded-xl bg-[#0B1325]/70 border border-[#D4AF6E]/15 space-y-4">
          <h2 className="font-serif text-2xl text-[#F7F4EE] border-b border-[#D4AF6E]/12 pb-3">
            {t.admin.customizeTab.contactSocialTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs text-[#F7F4EE]/75">
                {t.admin.customizeTab.phoneLabel}
              </label>
              <input
                type="text"
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-[#F7F4EE]/75">
                {t.admin.customizeTab.whatsappLabel}
              </label>
              <input
                type="text"
                value={form.contact_whatsapp}
                onChange={(e) => setForm({ ...form, contact_whatsapp: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-[#F7F4EE]/75">
                {t.admin.customizeTab.emailLabel}
              </label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-[#F7F4EE]/75">
                {t.admin.customizeTab.addressLabel}
              </label>
              <input
                type="text"
                value={form.contact_address}
                onChange={(e) => setForm({ ...form, contact_address: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-[#F7F4EE]/75">
                {t.admin.customizeTab.instagramLabel}
              </label>
              <input
                type="url"
                value={form.social_instagram}
                onChange={(e) => setForm({ ...form, social_instagram: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-[#F7F4EE]/75">
                {t.admin.customizeTab.facebookLabel}
              </label>
              <input
                type="url"
                value={form.social_facebook}
                onChange={(e) => setForm({ ...form, social_facebook: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-7 py-3 text-xs font-semibold rounded-lg bg-[#D4AF6E] text-[#060B17] hover:bg-[#E8CFA0] disabled:opacity-50 cursor-pointer"
          >
            {saving ? t.admin.customizeTab.publishing : t.admin.customizeTab.publishBtn}
          </button>
        </div>
      </form>

      {/* Category Images */}
      <section className="p-6 rounded-xl bg-[#0B1325]/70 border border-[#D4AF6E]/15 space-y-4">
        <h2 className="font-serif text-2xl text-[#F7F4EE] border-b border-[#D4AF6E]/12 pb-3">
          {t.admin.customizeTab.categoryVisualsTitle}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-4 rounded-lg bg-[#060B17]/70 border border-[#D4AF6E]/15 space-y-3"
            >
              <div className="aspect-[4/3] rounded overflow-hidden bg-[#0B1325]">
                <LuxuryImage
                  src={cat.image_url}
                  alt={getCategoryLabel(cat).name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#F7F4EE] truncate">
                  {getCategoryLabel(cat).name}
                </span>
                <label className="text-[11px] text-[#E8CFA0] hover:underline cursor-pointer shrink-0">
                  {uploadingKey === `cat-${cat.id}`
                    ? t.admin.customizeTab.sending
                    : t.admin.customizeTab.changeImage}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => uploadCategoryImage(cat.id, e.target.files?.[0])}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Perfumes Quick Selector */}
      <section className="p-6 rounded-xl bg-[#0B1325]/70 border border-[#D4AF6E]/15 space-y-4">
        <h2 className="font-serif text-2xl text-[#F7F4EE] border-b border-[#D4AF6E]/12 pb-3">
          {t.admin.customizeTab.featuredPerfumesTitle}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-[#060B17]/70 border border-[#D4AF6E]/15 cursor-pointer hover:border-[#D4AF6E]/35"
            >
              <input
                type="checkbox"
                checked={p.is_featured}
                onChange={() => toggleFeaturedProduct(p)}
                className="accent-[#D4AF6E]"
              />
              <span className="text-xs text-[#F7F4EE] truncate">{p.name}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Admin Security */}
      <section className="p-6 rounded-xl bg-[#0B1325]/70 border border-[#D4AF6E]/15 space-y-4">
        <h2 className="font-serif text-2xl text-[#F7F4EE] flex items-center gap-2 border-b border-[#D4AF6E]/12 pb-3">
          <Lock className="w-5 h-5 text-[#D4AF6E]" />
          <span>{t.admin.customizeTab.securityTitle}</span>
        </h2>
        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="space-y-1.5">
            <label className="block text-xs text-[#F7F4EE]/75">
              {t.admin.customizeTab.currentPwLabel}
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs text-[#F7F4EE]/75">
              {t.admin.customizeTab.newPwLabel}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold rounded-lg border border-[#D4AF6E]/40 text-[#E8CFA0] hover:bg-[#D4AF6E] hover:text-[#060B17] transition-colors cursor-pointer"
          >
            {t.admin.customizeTab.updatePwBtn}
          </button>
        </form>
        {pwMsg && <p className="text-xs text-[#E8CFA0]">{pwMsg}</p>}
      </section>
    </div>
  );
}
