import { useEffect, useState } from 'react';
import { CheckCircle2, PackageCheck } from 'lucide-react';
import { LuxuryImage } from '../components/LuxuryImage';
import { formatTnd, useStore } from '../context/StoreContext';
import type { Order } from '../types';

const STATUS_LABELS_FR: Record<string, string> = {
  Pending: 'En attente de confirmation',
  Confirmed: 'Confirmée',
  Preparing: 'En préparation',
  Shipped: 'Expédiée',
  Delivered: 'Livrée',
  Cancelled: 'Annulée',
};

const STATUS_LABELS_AR: Record<string, string> = {
  Pending: 'في انتظار التأكيد',
  Confirmed: 'تم التأكيد',
  Preparing: 'قيد التحضير',
  Shipped: 'تم الشحن',
  Delivered: 'تم التوصيل',
  Cancelled: 'ملغاة',
};

export function ConfirmationPage({ orderNumber }: { orderNumber: string }) {
  const { navigate, language, t } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/orders/${encodeURIComponent(orderNumber)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Introuvable'))))
      .then((data: Order) => {
        if (active) setOrder(data);
      })
      .catch(() => {
        if (active) setOrder(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orderNumber]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#060B17] pt-36 pb-24 text-center">
        <p className="text-sm text-[#F7F4EE]/60">{t.confirmation.loading}</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-[#060B17] pt-36 pb-24 text-center px-5">
        <h1 className="font-serif text-4xl text-[#F7F4EE]">{t.confirmation.notFound}</h1>
        <button
          type="button"
          onClick={() => navigate('/boutique')}
          className="mt-6 px-6 py-3 text-sm font-semibold rounded-lg btn-gold-luxury cursor-pointer"
        >
          {t.product.backToBoutique}
        </button>
      </main>
    );
  }

  const statusText =
    language === 'ar'
      ? STATUS_LABELS_AR[order.status] || order.status
      : STATUS_LABELS_FR[order.status] || order.status;

  return (
    <main className="min-h-screen bg-[#060B17] pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <div className="p-8 sm:p-10 rounded-2xl liquid-glass space-y-8">
          <div className="text-center space-y-3 pb-6 border-b border-[#D4AF6E]/15">
            <CheckCircle2 className="w-12 h-12 text-[#D4AF6E] mx-auto" strokeWidth={1.5} />
            <p className="text-xs tracking-[0.24em] uppercase text-[#D4AF6E]">
              {t.confirmation.thanks}
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#F7F4EE]">
              {t.confirmation.orderWord} {order.order_number} {t.confirmation.confirmedTitle}
            </h1>
            <p className="text-sm text-[#F7F4EE]/70">
              {t.confirmation.currentStatus}{' '}
              <span className="text-[#E8CFA0] font-medium">{statusText}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-[0.16em] text-[#D4AF6E]">
                {t.confirmation.recipient}
              </p>
              <p className="font-medium text-[#F7F4EE]">{order.customer_name}</p>
              <p dir="ltr" className="text-[#F7F4EE]/70 w-fit">
                {order.phone}
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-[0.16em] text-[#D4AF6E]">
                {t.confirmation.deliveryPay}
              </p>
              <p className="text-[#F7F4EE]">{order.address}</p>
              <p className="text-[#F7F4EE]/70">{order.city}</p>
              <p className="text-[#E8CFA0] text-xs">{t.checkout.codTitle}</p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#D4AF6E]/15">
            <p className="text-xs uppercase tracking-[0.16em] text-[#D4AF6E]">
              {t.confirmation.orderedItems}
            </p>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#060B17] border border-[#D4AF6E]/15 shrink-0">
                  <LuxuryImage
                    src={item.image_url}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-lg text-[#F7F4EE] truncate">
                    {item.product_name}
                  </p>
                  <p className="text-xs text-[#F7F4EE]/60">
                    {item.volume} × {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-medium tabular-nums text-[#E8CFA0]">
                  {formatTnd(item.unit_price_tnd * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#D4AF6E]/15 space-y-2 text-sm">
            <div className="flex justify-between text-[#F7F4EE]/70">
              <span>{t.cart.subtotal}</span>
              <span className="tabular-nums">{formatTnd(order.subtotal_tnd)}</span>
            </div>
            <div className="flex justify-between text-[#F7F4EE]/70">
              <span>{t.cart.shipping}</span>
              <span className="tabular-nums">
                {order.shipping_tnd === 0 ? t.cart.free : formatTnd(order.shipping_tnd)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-[#F7F4EE] pt-2 border-t border-[#D4AF6E]/15">
              <span>{t.confirmation.totalCod}</span>
              <span className="tabular-nums text-[#E8CFA0]">
                {formatTnd(order.total_tnd)}
              </span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-xs text-[#F7F4EE]/60">
              <PackageCheck className="w-4 h-4 text-[#D4AF6E]" />
              {t.confirmation.teamContact}
            </span>

            <button
              type="button"
              onClick={() => navigate('/boutique')}
              className="px-6 py-3 text-xs font-semibold rounded-lg btn-gold-luxury cursor-pointer"
            >
              {t.confirmation.continueBtn}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
