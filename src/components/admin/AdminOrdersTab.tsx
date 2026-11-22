import { useState } from 'react';
import { Eye, Search, X } from 'lucide-react';
import { formatTnd, useStore } from '../../context/StoreContext';
import type { CustomerSummary, Order, OrderStatus } from '../../types';
import { adminFetch } from '../../utils/adminApi';
import { LuxuryImage } from '../LuxuryImage';

interface AdminOrdersTabProps {
  orders: Order[];
  customers: CustomerSummary[];
  onRefresh: () => Promise<void>;
}

const ORDER_STATUS_CONFIG: Array<{ value: OrderStatus; colorClass: string }> = [
  { value: 'Pending', colorClass: 'text-amber-300' },
  { value: 'Confirmed', colorClass: 'text-sky-300' },
  { value: 'Preparing', colorClass: 'text-indigo-300' },
  { value: 'Shipped', colorClass: 'text-[#E8CFA0]' },
  { value: 'Delivered', colorClass: 'text-emerald-300' },
  { value: 'Cancelled', colorClass: 'text-rose-300' },
];

export function AdminOrdersTab({
  orders,
  customers,
  onRefresh,
}: AdminOrdersTabProps) {
  const { t, language } = useStore();
  const [subView, setSubView] = useState<'orders' | 'customers'>('orders');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleStatusChange = async (orderId: number, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await adminFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = (await res.json()) as Order;
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(updated);
        }
        await onRefresh();
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.phone.toLowerCase().includes(q) ||
      o.city.toLowerCase().includes(q)
    );
  });

  const filteredCustomers = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.full_name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  const getStatusLabel = (status: OrderStatus) => t.admin.statuses[status] || status;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubView('orders')}
            className={`px-4 py-2 text-xs font-medium rounded-lg cursor-pointer ${
              subView === 'orders'
                ? 'bg-[#D4AF6E] text-[#060B17]'
                : 'bg-[#0B1325] text-[#F7F4EE]/75 border border-[#D4AF6E]/15'
            }`}
          >
            {t.admin.ordersTab.ordersBtn} ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView('customers')}
            className={`px-4 py-2 text-xs font-medium rounded-lg cursor-pointer ${
              subView === 'customers'
                ? 'bg-[#D4AF6E] text-[#060B17]'
                : 'bg-[#0B1325] text-[#F7F4EE]/75 border border-[#D4AF6E]/15'
            }`}
          >
            {t.admin.ordersTab.customersBtn} ({customers.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#D4AF6E]/70 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.admin.ordersTab.searchPlaceholder}
              className="ps-9 pe-3 py-2 text-xs rounded-lg bg-[#0B1325] border border-[#D4AF6E]/20 text-[#F7F4EE] focus:outline-none focus:border-[#D4AF6E]"
            />
          </div>

          {subView === 'orders' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-[#0B1325] border border-[#D4AF6E]/20 text-[#F7F4EE] focus:outline-none focus:border-[#D4AF6E]"
            >
              <option value="all">{t.admin.ordersTab.allStatuses}</option>
              {ORDER_STATUS_CONFIG.map((s) => (
                <option key={s.value} value={s.value}>
                  {getStatusLabel(s.value)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {subView === 'orders' ? (
        <div className="rounded-xl border border-[#D4AF6E]/15 bg-[#0B1325]/70 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-[#D4AF6E]/15 text-[11px] uppercase tracking-wider text-[#D4AF6E]">
                  <th className="py-3.5 px-4 font-medium text-start">
                    {t.admin.ordersTab.colOrderNum}
                  </th>
                  <th className="py-3.5 px-4 font-medium text-start">
                    {t.admin.ordersTab.colClient}
                  </th>
                  <th className="py-3.5 px-4 font-medium text-start">
                    {t.admin.ordersTab.colAddress}
                  </th>
                  <th className="py-3.5 px-4 font-medium text-start">
                    {t.admin.ordersTab.colItems}
                  </th>
                  <th className="py-3.5 px-4 font-medium text-end">
                    {t.admin.ordersTab.colTotal}
                  </th>
                  <th className="py-3.5 px-4 font-medium text-start">
                    {t.admin.ordersTab.colStatus}
                  </th>
                  <th className="py-3.5 px-4 font-medium text-end">
                    {t.admin.ordersTab.colDetails}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4AF6E]/10 text-xs">
                {filteredOrders.map((o) => {
                  const qtySum = o.items.reduce((s, it) => s + it.quantity, 0);
                  const st = ORDER_STATUS_CONFIG.find((s) => s.value === o.status);
                  return (
                    <tr key={o.id} className="hover:bg-[#101A33]/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[#E8CFA0]">
                        <div dir="ltr" className="inline-block">
                          {o.order_number}
                        </div>
                        <div className="text-[10px] text-[#F7F4EE]/45">
                          {new Date(o.created_at).toLocaleDateString(
                            language === 'ar' ? 'ar-TN' : 'fr-FR'
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#F7F4EE]">{o.customer_name}</div>
                        <div className="text-[#F7F4EE]/55" dir="ltr">
                          {o.phone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#F7F4EE]/70 max-w-[200px] truncate">
                        {o.city} · {o.address}
                      </td>
                      <td className="py-3.5 px-4 text-[#F7F4EE]/80">
                        {o.items.map((it) => `${it.product_name} (${it.quantity})`).join(', ')}
                        <div className="text-[11px] text-[#F7F4EE]/45">
                          {qtySum} {t.admin.ordersTab.itemsCount}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-end font-semibold tabular-nums text-[#E8CFA0]">
                        {formatTnd(o.total_tnd)}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          disabled={updatingId === o.id}
                          value={o.status}
                          onChange={(e) =>
                            handleStatusChange(o.id, e.target.value as OrderStatus)
                          }
                          className={`px-2.5 py-1.5 rounded-md bg-[#060B17] border border-[#D4AF6E]/20 font-medium ${
                            st?.colorClass || 'text-[#F7F4EE]'
                          }`}
                        >
                          {ORDER_STATUS_CONFIG.map((opt) => (
                            <option key={opt.value} value={opt.value} className="text-[#F7F4EE]">
                              {getStatusLabel(opt.value)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-end">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(o)}
                          className="p-2 rounded-lg text-[#F7F4EE]/70 hover:text-[#E8CFA0] hover:bg-[#101A33] cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[#D4AF6E]/15 bg-[#0B1325]/70 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-[#D4AF6E]/15 text-[11px] uppercase tracking-wider text-[#D4AF6E]">
                  <th className="py-3.5 px-4 font-medium text-start">
                    {t.admin.ordersTab.colClient}
                  </th>
                  <th className="py-3.5 px-4 font-medium text-start">
                    {t.admin.ordersTab.colPhone}
                  </th>
                  <th className="py-3.5 px-4 font-medium text-start">
                    {t.admin.ordersTab.colCityAddress}
                  </th>
                  <th className="py-3.5 px-4 font-medium text-end">
                    {t.admin.ordersTab.colOrdersCount}
                  </th>
                  <th className="py-3.5 px-4 font-medium text-end">
                    {t.admin.ordersTab.colTotalSpent}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4AF6E]/10 text-xs">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#101A33]/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#F7F4EE]">{c.full_name}</div>
                      {c.email && <div className="text-[#F7F4EE]/50">{c.email}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-[#F7F4EE]/80" dir="ltr">
                      {c.phone}
                    </td>
                    <td className="py-3.5 px-4 text-[#F7F4EE]/70">
                      {c.city} · {c.address}
                    </td>
                    <td className="py-3.5 px-4 text-end tabular-nums text-[#F7F4EE]">
                      {c.order_count}
                    </td>
                    <td className="py-3.5 px-4 text-end tabular-nums font-semibold text-[#E8CFA0]">
                      {formatTnd(c.total_spent_tnd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060B17]/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl liquid-glass p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D4AF6E]/15 pb-4">
              <div>
                <p className="font-mono text-xs text-[#D4AF6E]" dir="ltr">
                  {selectedOrder.order_number}
                </p>
                <h3 className="font-serif text-2xl text-[#F7F4EE]">
                  {selectedOrder.customer_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-[#F7F4EE]/60 hover:text-[#F7F4EE] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-[#D4AF6E] uppercase tracking-wider mb-1">
                  {t.admin.ordersTab.contactLabel}
                </p>
                <p className="text-[#F7F4EE]" dir="ltr">
                  {selectedOrder.phone}
                </p>
                {selectedOrder.email && (
                  <p className="text-[#F7F4EE]/70">{selectedOrder.email}</p>
                )}
              </div>
              <div>
                <p className="text-[#D4AF6E] uppercase tracking-wider mb-1">
                  {t.admin.ordersTab.addressLabel}
                </p>
                <p className="text-[#F7F4EE]">{selectedOrder.city}</p>
                <p className="text-[#F7F4EE]/70">{selectedOrder.address}</p>
              </div>
            </div>

            {selectedOrder.note && (
              <div className="p-3 rounded-lg bg-[#060B17]/70 border border-[#D4AF6E]/15 text-xs text-[#F7F4EE]/80">
                <span className="text-[#D4AF6E]">{t.admin.ordersTab.clientNote}</span>{' '}
                {selectedOrder.note}
              </div>
            )}

            <div className="space-y-3 pt-2 border-t border-[#D4AF6E]/15">
              {selectedOrder.items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 text-xs">
                  <div className="w-10 h-10 rounded overflow-hidden bg-[#060B17] shrink-0">
                    <LuxuryImage
                      src={it.image_url}
                      alt={it.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#F7F4EE] font-medium truncate">
                      {it.product_name}
                    </p>
                    <p className="text-[#F7F4EE]/55">
                      {it.volume} × {it.quantity}
                    </p>
                  </div>
                  <span className="tabular-nums text-[#E8CFA0]">
                    {formatTnd(it.unit_price_tnd * it.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#D4AF6E]/15 flex items-center justify-between text-sm">
              <span className="text-[#F7F4EE]/75">
                {t.admin.ordersTab.totalLabel} ({t.admin.ordersTab.codPayment})
              </span>
              <span className="font-semibold tabular-nums text-[#E8CFA0]">
                {formatTnd(selectedOrder.total_tnd)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
