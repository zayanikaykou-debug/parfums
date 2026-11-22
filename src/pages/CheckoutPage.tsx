import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, MapPin, ShieldCheck, Truck } from 'lucide-react';
import { LuxuryImage } from '../components/LuxuryImage';
import { formatTnd, useStore } from '../context/StoreContext';
import { GOVERNORATE_NAMES, TUNISIA_GOVERNORATES } from '../data/tunisiaLocations';
import type { Order } from '../types';

export function CheckoutPage() {
  const {
    cart,
    cartSubtotal,
    shippingCost,
    cartTotal,
    clearCart,
    refreshStore,
    navigate,
    t,
  } = useStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gouvernorat, setGouvernorat] = useState('Tunis');
  const [ville, setVille] = useState(TUNISIA_GOVERNORATES['Tunis'][0]);
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const availableVilles = TUNISIA_GOVERNORATES[gouvernorat] || [];

  const handleGovernorateChange = (nextGouv: string) => {
    setGouvernorat(nextGouv);
    const nextCities = TUNISIA_GOVERNORATES[nextGouv] || [];
    setVille(nextCities[0] || '');
  };

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-[#060B17] pt-36 pb-24 text-center px-5">
        <h1 className="font-serif text-4xl text-[#F7F4EE]">{t.cart.emptyTitle}</h1>
        <p className="mt-3 text-sm text-[#F7F4EE]/65">{t.cart.emptySub}</p>
        <button
          type="button"
          onClick={() => navigate('/boutique')}
          className="mt-8 px-6 py-3 text-sm font-semibold rounded-lg btn-gold-luxury cursor-pointer"
        >
          {t.cart.exploreBtn}
        </button>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (
      !fullName.trim() ||
      !phone.trim() ||
      !gouvernorat.trim() ||
      !ville.trim() ||
      !address.trim()
    ) {
      setError(t.checkout.errRequired);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim(),
          city: `${ville.trim()}, ${gouvernorat.trim()}`,
          address: address.trim(),
          note: note.trim(),
          items: cart.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.checkout.errServer);
        setSubmitting(false);
        return;
      }

      const created = data as Order;
      clearCart();
      await refreshStore();
      navigate(`/confirmation/${created.order_number}`);
    } catch {
      setError(t.checkout.errServer);
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#060B17] pt-28 pb-24">
      <div className="max-w-[1160px] mx-auto px-5 sm:px-8">
        <button
          type="button"
          onClick={() => navigate('/panier')}
          className="inline-flex items-center gap-2 text-xs text-[#F7F4EE]/65 hover:text-[#E8CFA0] mb-8 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{t.checkout.backToCart}</span>
        </button>

        <div className="pb-8 border-b border-[#D4AF6E]/15">
          <p className="text-xs tracking-[0.26em] uppercase text-[#D4AF6E]">
            {t.checkout.eyebrow}
          </p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl font-medium text-[#F7F4EE]">
            {t.checkout.title}
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10"
        >
          {/* Customer Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 sm:p-8 rounded-2xl liquid-glass space-y-6">
              <div className="flex items-center justify-between border-b border-[#D4AF6E]/12 pb-4">
                <h2 className="font-serif text-2xl text-[#F7F4EE]">
                  {t.checkout.detailsTitle}
                </h2>
                <MapPin className="w-4 h-4 text-[#D4AF6E]/70" />
              </div>

              {error && (
                <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-400/30 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs tracking-wide text-[#F7F4EE]/75">
                    {t.checkout.fullName} <span className="text-[#D4AF6E]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t.checkout.fullNamePlaceholder}
                    className="w-full px-4 py-3 text-sm rounded-lg bg-[#060B17]/80 border border-[#D4AF6E]/20 text-[#F7F4EE] placeholder:text-[#F7F4EE]/35 focus:outline-none focus:border-[#D4AF6E] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs tracking-wide text-[#F7F4EE]/75">
                    {t.checkout.phone} <span className="text-[#D4AF6E]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.checkout.phonePlaceholder}
                    className="w-full px-4 py-3 text-sm rounded-lg bg-[#060B17]/80 border border-[#D4AF6E]/20 text-[#F7F4EE] placeholder:text-[#F7F4EE]/35 focus:outline-none focus:border-[#D4AF6E] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="gouvernorat-select"
                    className="block text-xs tracking-wide text-[#F7F4EE]/75"
                  >
                    {t.checkout.governorate} <span className="text-[#D4AF6E]">*</span>
                  </label>
                  <select
                    id="gouvernorat-select"
                    required
                    value={gouvernorat}
                    onChange={(e) => handleGovernorateChange(e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-lg bg-[#060B17]/80 border border-[#D4AF6E]/20 text-[#F7F4EE] focus:outline-none focus:border-[#D4AF6E] transition-colors cursor-pointer"
                  >
                    {GOVERNORATE_NAMES.map((g) => (
                      <option key={g} value={g} className="bg-[#0B1325] text-[#F7F4EE]">
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="ville-select"
                    className="block text-xs tracking-wide text-[#F7F4EE]/75"
                  >
                    {t.checkout.city} <span className="text-[#D4AF6E]">*</span>
                  </label>
                  <select
                    id="ville-select"
                    required
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-lg bg-[#060B17]/80 border border-[#D4AF6E]/20 text-[#F7F4EE] focus:outline-none focus:border-[#D4AF6E] transition-colors cursor-pointer"
                  >
                    {availableVilles.map((v) => (
                      <option key={v} value={v} className="bg-[#0B1325] text-[#F7F4EE]">
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs tracking-wide text-[#F7F4EE]/75">
                  {t.checkout.address} <span className="text-[#D4AF6E]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t.checkout.addressPlaceholder}
                  className="w-full px-4 py-3 text-sm rounded-lg bg-[#060B17]/80 border border-[#D4AF6E]/20 text-[#F7F4EE] placeholder:text-[#F7F4EE]/35 focus:outline-none focus:border-[#D4AF6E] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs tracking-wide text-[#F7F4EE]/75">
                  {t.checkout.note}
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t.checkout.notePlaceholder}
                  className="w-full px-4 py-3 text-sm rounded-lg bg-[#060B17]/80 border border-[#D4AF6E]/20 text-[#F7F4EE] placeholder:text-[#F7F4EE]/35 focus:outline-none focus:border-[#D4AF6E] transition-colors"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="p-6 rounded-2xl liquid-glass-subtle flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-[#101A33] border border-[#D4AF6E]/25 text-[#D4AF6E]">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#F7F4EE]">
                  {t.checkout.codTitle}
                </h3>
                <p className="text-xs text-[#F7F4EE]/65 mt-1 leading-relaxed">
                  {t.checkout.codDesc}
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <aside className="lg:col-span-5">
            <div className="p-6 sm:p-8 rounded-2xl liquid-glass space-y-6 lg:sticky lg:top-24">
              <h2 className="font-serif text-2xl font-medium text-[#F7F4EE] border-b border-[#D4AF6E]/15 pb-3">
                {t.checkout.yourOrder}
              </h2>

              <div className="space-y-4 max-h-80 overflow-y-auto pe-1">
                {cart.map((item) => (
                  <div key={item.variantId} className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#060B17] border border-[#D4AF6E]/20 shrink-0">
                      <LuxuryImage
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-base text-[#F7F4EE] truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#F7F4EE]/55">
                        {item.volume} × {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-medium tabular-nums text-[#E8CFA0]">
                      {formatTnd(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5 pt-4 border-t border-[#D4AF6E]/15 text-sm">
                <div className="flex justify-between text-[#F7F4EE]/70">
                  <span>{t.cart.subtotal}</span>
                  <span className="tabular-nums">{formatTnd(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-[#F7F4EE]/70">
                  <span>
                    {t.cart.shipping} ({gouvernorat})
                  </span>
                  <span className="tabular-nums">
                    {shippingCost === 0 ? t.cart.free : formatTnd(shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-[#F7F4EE] pt-3 border-t border-[#D4AF6E]/15">
                  <span>{t.checkout.totalToPay}</span>
                  <span className="tabular-nums text-[#E8CFA0]">{formatTnd(cartTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold rounded-lg btn-gold-luxury disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {submitting ? t.checkout.submitting : t.checkout.confirmOrder}
                </span>
              </button>

              <p className="flex items-center justify-center gap-2 text-xs text-[#F7F4EE]/50">
                <ShieldCheck className="w-4 h-4 text-[#D4AF6E]" />
                <span>{t.checkout.noOnlinePay}</span>
              </p>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}
