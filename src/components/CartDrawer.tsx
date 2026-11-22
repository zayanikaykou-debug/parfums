import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { formatTnd, useStore } from '../context/StoreContext';
import { LuxuryImage } from './LuxuryImage';

export function CartDrawer() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    updateCartQuantity,
    removeFromCart,
    cartSubtotal,
    shippingCost,
    cartTotal,
    settings,
    navigate,
    t,
  } = useStore();

  if (!cartOpen) return null;

  const threshold = Number(settings.free_shipping_threshold_tnd || 250);
  const remainingForFree = Math.max(0, threshold - cartSubtotal);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-[#060B17]/75 backdrop-blur-sm"
        onClick={() => setCartOpen(false)}
      />

      <aside
        aria-label={t.cart.title}
        className="relative z-10 w-full max-w-md h-full liquid-glass border-s border-[#D4AF6E]/25 flex flex-col"
      >
        <div className="px-6 py-5 border-b border-[#D4AF6E]/15 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-medium text-[#F7F4EE]">
              {t.cart.title}
            </h2>
            <p className="text-xs text-[#F7F4EE]/55 mt-0.5">
              {cart.length === 0
                ? t.cart.emptyDrawer
                : `${cart.reduce((s, i) => s + i.quantity, 0)} ${t.cart.bottlesSelected}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Fermer"
            className="p-2 rounded-lg text-[#F7F4EE]/70 hover:text-[#F7F4EE] hover:bg-[#101A33] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <ShoppingBag className="w-10 h-10 text-[#D4AF6E]/50 mb-4" strokeWidth={1.25} />
              <p className="font-serif text-xl text-[#F7F4EE]">{t.cart.emptyTitle}</p>
              <p className="text-sm text-[#F7F4EE]/60 mt-2 max-w-xs">
                {t.cart.emptySub}
              </p>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('/boutique');
                }}
                className="mt-6 px-6 py-2.5 text-sm font-semibold rounded-lg btn-gold-luxury cursor-pointer"
              >
                {t.cart.exploreBtn}
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.variantId}
                className="flex gap-4 pb-5 border-b border-[#D4AF6E]/12 last:border-none"
              >
                <button
                  type="button"
                  onClick={() => {
                    setCartOpen(false);
                    navigate(`/parfum/${item.slug}`);
                  }}
                  className="w-20 h-20 rounded-lg overflow-hidden bg-[#060B17] shrink-0 border border-[#D4AF6E]/15 cursor-pointer"
                >
                  <LuxuryImage
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </button>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-serif text-lg text-[#F7F4EE] truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#F7F4EE]/55">{item.volume}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.variantId)}
                      aria-label={`Retirer ${item.name}`}
                      className="p-1 text-[#F7F4EE]/45 hover:text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="inline-flex items-center border border-[#D4AF6E]/25 rounded-lg bg-[#060B17]/60">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.variantId, item.quantity - 1)}
                        className="p-1.5 text-[#F7F4EE]/75 hover:text-[#E8CFA0] cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-medium tabular-nums text-[#F7F4EE]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.variantId, item.quantity + 1)}
                        className="p-1.5 text-[#F7F4EE]/75 hover:text-[#E8CFA0] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-sm font-semibold tabular-nums text-[#E8CFA0]">
                      {formatTnd(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-[#D4AF6E]/20 bg-[#060B17]/80 space-y-4">
            {remainingForFree > 0 ? (
              <p className="text-xs text-[#F7F4EE]/65 text-center">
                {t.cart.addForFreePrefix}{' '}
                <span className="text-[#E8CFA0] font-medium tabular-nums">
                  {formatTnd(remainingForFree)}
                </span>{' '}
                {t.cart.addForFreeSuffix}
              </p>
            ) : (
              <p className="text-xs text-[#E8CFA0] text-center">
                {t.cart.freeApplied}
              </p>
            )}

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#F7F4EE]/70">
                <span>{t.cart.subtotal}</span>
                <span className="tabular-nums">{formatTnd(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-[#F7F4EE]/70">
                <span>{t.cart.shipping}</span>
                <span className="tabular-nums">
                  {shippingCost === 0 ? t.cart.free : formatTnd(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold text-[#F7F4EE] pt-2 border-t border-[#D4AF6E]/15">
                <span>{t.cart.total}</span>
                <span className="tabular-nums text-[#E8CFA0]">{formatTnd(cartTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('/panier');
                }}
                className="px-4 py-3 text-xs font-medium rounded-lg liquid-glass-subtle text-[#F7F4EE] hover:border-[#D4AF6E] transition-colors cursor-pointer"
              >
                {t.cart.viewCart}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('/checkout');
                }}
                className="px-4 py-3 text-xs font-semibold rounded-lg btn-gold-luxury cursor-pointer"
              >
                {t.cart.checkoutBtn}
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
