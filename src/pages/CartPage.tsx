import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { LuxuryImage } from '../components/LuxuryImage';
import { formatTnd, useStore } from '../context/StoreContext';

export function CartPage() {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    cartSubtotal,
    shippingCost,
    cartTotal,
    navigate,
    t,
  } = useStore();

  return (
    <main className="min-h-screen bg-[#060B17] pt-32 pb-24">
      <div className="max-w-[1160px] mx-auto px-5 sm:px-8">
        <div className="pb-8 border-b border-[#D4AF6E]/15">
          <p className="text-xs tracking-[0.24em] uppercase text-[#D4AF6E]">
            {t.cart.title}
          </p>
          <h1 className="mt-2 font-serif text-4xl font-medium text-[#F7F4EE]">
            {t.cart.pageTitle}
          </h1>
        </div>

        {cart.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <ShoppingBag className="w-12 h-12 text-[#D4AF6E]/50 mx-auto" strokeWidth={1.25} />
            <h2 className="font-serif text-2xl text-[#F7F4EE]">{t.cart.emptyTitle}</h2>
            <p className="text-sm text-[#F7F4EE]/60 max-w-md mx-auto">
              {t.cart.emptySub}
            </p>
            <button
              type="button"
              onClick={() => navigate('/boutique')}
              className="mt-4 px-7 py-3 text-sm font-semibold rounded-lg btn-gold-luxury cursor-pointer"
            >
              {t.cart.exploreBtn}
            </button>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-5">
              {cart.map((item) => (
                <div
                  key={item.variantId}
                  className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 rounded-2xl liquid-glass-card"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/parfum/${item.slug}`)}
                    className="w-24 h-24 rounded-lg overflow-hidden bg-[#060B17] shrink-0 cursor-pointer"
                  >
                    <LuxuryImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#D4AF6E]">{item.brand}</p>
                    <button
                      type="button"
                      onClick={() => navigate(`/parfum/${item.slug}`)}
                      className="font-serif text-2xl text-[#F7F4EE] hover:text-[#E8CFA0] text-start cursor-pointer"
                    >
                      {item.name}
                    </button>
                    <p className="text-xs text-[#F7F4EE]/55 mt-0.5">
                      {item.volume} · {formatTnd(item.unitPrice)} / {t.cart.unit}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="inline-flex items-center border border-[#D4AF6E]/25 rounded-lg bg-[#060B17]/70">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.variantId, item.quantity - 1)}
                        className="p-2 text-[#F7F4EE]/75 hover:text-[#E8CFA0] cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-3 text-sm tabular-nums text-[#F7F4EE]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.variantId, item.quantity + 1)}
                        className="p-2 text-[#F7F4EE]/75 hover:text-[#E8CFA0] cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-end min-w-[96px]">
                      <p className="text-base font-semibold tabular-nums text-[#E8CFA0]">
                        {formatTnd(item.unitPrice * item.quantity)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.variantId)}
                      aria-label={`Supprimer ${item.name}`}
                      className="p-2 text-[#F7F4EE]/45 hover:text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <aside className="lg:col-span-4">
              <div className="p-6 rounded-2xl liquid-glass space-y-5 lg:sticky lg:top-24">
                <h2 className="font-serif text-2xl font-medium text-[#F7F4EE] border-b border-[#D4AF6E]/15 pb-3">
                  {t.cart.summary}
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-[#F7F4EE]/75">
                    <span>{t.cart.subtotal}</span>
                    <span className="tabular-nums">{formatTnd(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#F7F4EE]/75">
                    <span>{t.cart.shipping}</span>
                    <span className="tabular-nums">
                      {shippingCost === 0 ? t.cart.free : formatTnd(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold text-[#F7F4EE] pt-3 border-t border-[#D4AF6E]/15">
                    <span>{t.cart.totalTtc}</span>
                    <span className="tabular-nums text-[#E8CFA0]">{formatTnd(cartTotal)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-lg btn-gold-luxury cursor-pointer"
                >
                  <span>{t.cart.finalizeBtn}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
