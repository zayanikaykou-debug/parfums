import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  ExternalLink,
  Globe,
  Lock,
  LogOut,
  Package,
  Palette,
  ShoppingCart,
} from 'lucide-react';
import { AdminCustomizeTab } from '../components/admin/AdminCustomizeTab';
import { AdminOrdersTab } from '../components/admin/AdminOrdersTab';
import { AdminProductsTab } from '../components/admin/AdminProductsTab';
import { RevenueChart } from '../components/admin/RevenueChart';
import { formatTnd, useStore } from '../context/StoreContext';
import type { AdminStats, Category, CustomerSummary, Order, Product } from '../types';
import { adminFetch, setAdminToken } from '../utils/adminApi';

type AdminTab = 'overview' | 'products' | 'orders' | 'customize';
type PeriodFilter = 'today' | 'week' | 'month' | 'all';

export function AdminPage() {
  const { settings, navigate, refreshStore, language, toggleLanguage, t } = useStore();
  const [authChecking, setAuthChecking] = useState(true);
  const [adminUser, setAdminUser] = useState<{
    id: number;
    email: string;
    name: string;
  } | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [banSecondsLeft, setBanSecondsLeft] = useState(0);

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [period, setPeriod] = useState<PeriodFilter>('month');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminCategories, setAdminCategories] = useState<Category[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);

  const [loadingData, setLoadingData] = useState(false);

  const loadAdminData = useCallback(
    async (selectedPeriod: PeriodFilter) => {
      setLoadingData(true);
      try {
        const [statsRes, prodRes, catRes, ordRes, custRes] = await Promise.all([
          adminFetch(`/api/admin/stats?period=${selectedPeriod}`),
          adminFetch('/api/admin/products'),
          adminFetch('/api/admin/categories'),
          adminFetch('/api/admin/orders'),
          adminFetch('/api/admin/customers'),
        ]);

        if (
          statsRes.status === 401 ||
          prodRes.status === 401 ||
          ordRes.status === 401 ||
          custRes.status === 401
        ) {
          setAdminToken(null);
          setAdminUser(null);
          setLoginError(t.admin.sessionExpired);
          return;
        }

        if (statsRes.ok) setStats(await statsRes.json());
        if (prodRes.ok) setAdminProducts(await prodRes.json());
        if (catRes.ok) setAdminCategories(await catRes.json());
        if (ordRes.ok) setAdminOrders(await ordRes.json());
        if (custRes.ok) setCustomers(await custRes.json());
      } finally {
        setLoadingData(false);
      }
    },
    []
  );

  useEffect(() => {
    Promise.all([
      adminFetch('/api/admin/me').then((res) => (res.ok ? res.json() : null)),
      adminFetch('/api/admin/login-status').then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([meData, statusData]) => {
        if (meData?.authenticated && meData.user) {
          setAdminUser(meData.user);
        } else {
          setAdminToken(null);
          if (statusData?.banned && statusData.retryAfterSeconds > 0) {
            setBanSecondsLeft(statusData.retryAfterSeconds);
            setLoginError(t.admin.bannedMsg);
          }
        }
      })
      .finally(() => setAuthChecking(false));
  }, []);

  useEffect(() => {
    if (banSecondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setBanSecondsLeft((prev) => {
        if (prev <= 1) {
          setLoginError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [banSecondsLeft]);

  useEffect(() => {
    if (adminUser) {
      loadAdminData(period);
    }
  }, [adminUser, period, loadAdminData]);

  const handleRefreshAll = async () => {
    await Promise.all([loadAdminData(period), refreshStore()]);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (banSecondsLeft > 0) return;
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await adminFetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 && data.retryAfterSeconds) {
          setBanSecondsLeft(Number(data.retryAfterSeconds));
        }
        setLoginError(data.error || t.admin.invalidCreds);
        setLoggingIn(false);
        return;
      }
      setBanSecondsLeft(0);
      if (data.token) {
        setAdminToken(data.token);
      }
      setAdminUser(data.user);
    } catch {
      setLoginError(t.admin.serverError);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await adminFetch('/api/admin/logout', { method: 'POST' });
    setAdminToken(null);
    setAdminUser(null);
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#060B17] flex items-center justify-center text-sm text-[#F7F4EE]/60">
        {t.admin.checkingSession}
      </div>
    );
  }

  if (!adminUser) {
    const isBanned = banSecondsLeft > 0;
    return (
      <main className="min-h-screen bg-[#060B17] flex items-center justify-center p-5">
        <div className="w-full max-w-md p-8 sm:p-10 rounded-2xl liquid-glass space-y-7">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg liquid-glass-subtle text-[#E8CFA0] hover:border-[#D4AF6E] transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#D4AF6E]" />
              <span>{language === 'fr' ? 'العربية' : 'FR'}</span>
            </button>
          </div>

          <div className="text-center space-y-2">
            <div className="w-11 h-11 rounded-full bg-[#101A33] border border-[#D4AF6E]/30 flex items-center justify-center mx-auto text-[#D4AF6E]">
              <Lock className="w-5 h-5" />
            </div>
            <p className="text-xs tracking-[0.24em] uppercase text-[#D4AF6E] pt-2">
              {t.admin.secureAdmin}
            </p>
            <h1 className="font-serif text-3xl font-medium text-[#F7F4EE]">
              {settings.logo_text || 'ZEPHOR PARFUMS'}
            </h1>
          </div>

          {(loginError || isBanned) && (
            <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-400/30 text-xs text-rose-200 space-y-1">
              <p>{loginError}</p>
              {isBanned && (
                <p className="font-mono tabular-nums text-[#E8CFA0]">
                  {t.admin.unlockIn} {formatCountdown(banSecondsLeft)}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs text-[#F7F4EE]/75">{t.admin.usernameLabel}</label>
              <input
                type="text"
                required
                autoComplete="username"
                disabled={isBanned}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder={t.admin.usernamePlaceholder}
                className="w-full px-4 py-2.5 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE] focus:outline-none focus:border-[#D4AF6E] disabled:opacity-40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-[#F7F4EE]/75">{t.admin.passwordLabel}</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                disabled={isBanned}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 text-sm rounded-lg bg-[#060B17] border border-[#D4AF6E]/20 text-[#F7F4EE] focus:outline-none focus:border-[#D4AF6E] disabled:opacity-40"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn || isBanned}
              className="w-full py-3 text-sm font-semibold rounded-lg btn-gold-luxury disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
            >
              {isBanned
                ? `${t.admin.lockedBtn} (${formatCountdown(banSecondsLeft)})`
                : loggingIn
                  ? t.admin.loggingIn
                  : t.admin.loginBtn}
            </button>
          </form>

          <div className="pt-4 border-t border-[#D4AF6E]/12 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs text-[#E8CFA0] hover:underline cursor-pointer"
            >
              {t.admin.backToStore}
            </button>
          </div>
        </div>
      </main>
    );
  }

  const navTabs: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: t.admin.tabs.overview, icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'products', label: t.admin.tabs.products, icon: <Package className="w-4 h-4" /> },
    { id: 'orders', label: t.admin.tabs.orders, icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'customize', label: t.admin.tabs.customize, icon: <Palette className="w-4 h-4" /> },
  ];

  const getStatusLabel = (status: string) =>
    t.admin.statuses[status as keyof typeof t.admin.statuses] || status;

  return (
    <div className="min-h-screen bg-[#060B17] text-[#F7F4EE] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-64 shrink-0 bg-[#080E1D] border-b lg:border-b-0 lg:border-e border-[#D4AF6E]/15 p-5 flex flex-col justify-between">
        <div className="space-y-8">
          <div className="flex items-center justify-between lg:block">
            <div>
              <p className="text-[10px] tracking-[0.22em] uppercase text-[#D4AF6E]">
                {t.admin.brandOverline}
              </p>
              <h1 className="font-serif text-xl font-semibold tracking-[0.12em] text-[#F7F4EE] mt-0.5">
                {t.admin.brandTitle}
              </h1>
            </div>
          </div>

          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {navTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#D4AF6E] text-[#060B17] font-semibold'
                    : 'text-[#F7F4EE]/75 hover:bg-[#101A33] hover:text-[#F7F4EE]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="hidden lg:block space-y-2 pt-6 border-t border-[#D4AF6E]/12">
          <button
            type="button"
            onClick={toggleLanguage}
            className="w-full inline-flex items-center justify-between px-3.5 py-2 text-xs rounded-lg border border-[#D4AF6E]/20 text-[#E8CFA0] hover:bg-[#101A33] cursor-pointer"
          >
            <span className="inline-flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#D4AF6E]" />
              <span>{language === 'fr' ? 'Langue : Français' : 'اللغة : العربية'}</span>
            </span>
            <span className="font-semibold text-[#D4AF6E]">
              {language === 'fr' ? 'العربية' : 'FR'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full inline-flex items-center justify-between px-3.5 py-2 text-xs rounded-lg text-[#E8CFA0] hover:bg-[#101A33] cursor-pointer"
          >
            <span>{t.admin.viewPublicSite}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg text-[#F7F4EE]/60 hover:text-rose-300 hover:bg-[#101A33] cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.admin.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 p-5 sm:p-8 lg:p-10 space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D4AF6E]/15">
          <div>
            <p className="text-xs text-[#D4AF6E]">
              {t.admin.connected} · {adminUser.email}
            </p>
            <h2 className="font-serif text-3xl font-medium text-[#F7F4EE] mt-0.5">
              {navTabs.find((tab) => tab.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-[#D4AF6E]/25 text-[#E8CFA0] cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#D4AF6E]" />
              <span>{language === 'fr' ? 'العربية' : 'FR'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-3 py-2 text-xs rounded-lg border border-[#D4AF6E]/25 text-[#E8CFA0]"
            >
              {t.admin.publicSiteShort}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 text-xs rounded-lg border border-[#D4AF6E]/25 text-[#F7F4EE]/70"
            >
              {t.admin.logout}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={language === 'fr' ? 'التبديل إلى العربية' : 'Passer en français'}
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg liquid-glass-subtle text-[#E8CFA0] hover:border-[#D4AF6E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#D4AF6E]" />
              <span>{language === 'fr' ? 'العربية' : 'FR'}</span>
            </button>

            {activeTab === 'overview' && (
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#0B1325] border border-[#D4AF6E]/15">
                {[
                  { id: 'today', label: t.admin.periods.today },
                  { id: 'week', label: t.admin.periods.week },
                  { id: 'month', label: t.admin.periods.month },
                  { id: 'all', label: t.admin.periods.all },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriod(p.id as PeriodFilter)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      period === p.id
                        ? 'bg-[#D4AF6E] text-[#060B17]'
                        : 'text-[#F7F4EE]/70 hover:text-[#F7F4EE]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {activeTab === 'overview' && !stats && loadingData && (
          <div className="py-12 text-center text-xs text-[#F7F4EE]/55">
            {t.admin.loadingStats}
          </div>
        )}

        {activeTab === 'overview' && stats && (
          <div className="space-y-8">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: t.admin.kpis.totalRevenue, value: formatTnd(stats.total_revenue), accent: true },
                { label: t.admin.kpis.todayRevenue, value: formatTnd(stats.today_revenue) },
                { label: t.admin.kpis.weeklyRevenue, value: formatTnd(stats.weekly_revenue) },
                { label: t.admin.kpis.monthlyRevenue, value: formatTnd(stats.monthly_revenue) },
                {
                  label: t.admin.kpis.periodRevenue,
                  value: formatTnd(stats.period_revenue),
                },
                { label: t.admin.kpis.totalOrders, value: String(stats.total_orders) },
                { label: t.admin.kpis.pendingOrders, value: String(stats.pending_orders) },
                { label: t.admin.kpis.deliveredOrders, value: String(stats.delivered_orders) },
                {
                  label: t.admin.kpis.productsLowStock,
                  value: `${stats.total_products} / ${stats.low_stock_products}`,
                },
                { label: t.admin.kpis.customers, value: String(stats.total_customers) },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="p-4 rounded-xl bg-[#0B1325]/80 border border-[#D4AF6E]/15"
                >
                  <p className="text-[11px] text-[#F7F4EE]/55">{kpi.label}</p>
                  <p
                    className={`mt-2 text-xl font-semibold tabular-nums ${
                      kpi.accent ? 'text-[#E8CFA0]' : 'text-[#F7F4EE]'
                    }`}
                  >
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Chart & Status Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 p-6 rounded-xl bg-[#0B1325]/80 border border-[#D4AF6E]/15">
                <RevenueChart data={stats.revenue_series} />
              </div>

              <div className="lg:col-span-4 p-6 rounded-xl bg-[#0B1325]/80 border border-[#D4AF6E]/15 space-y-4">
                <h3 className="font-serif text-xl text-[#F7F4EE]">
                  {t.admin.statusBreakdownTitle}
                </h3>
                <div className="space-y-3 pt-2">
                  {stats.status_breakdown.map((s) => {
                    const pct =
                      stats.total_orders > 0
                        ? Math.round((s.count / stats.total_orders) * 100)
                        : 0;
                    return (
                      <div key={s.status} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#F7F4EE]/80">{getStatusLabel(s.status)}</span>
                          <span className="tabular-nums text-[#E8CFA0]">
                            {s.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#060B17] overflow-hidden">
                          <div
                            className="h-full bg-[#D4AF6E] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <AdminProductsTab
            products={adminProducts}
            categories={adminCategories}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === 'orders' && (
          <AdminOrdersTab
            orders={adminOrders}
            customers={customers}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === 'customize' && (
          <AdminCustomizeTab
            settings={settings}
            categories={adminCategories}
            products={adminProducts}
            onRefresh={handleRefreshAll}
          />
        )}
      </div>
    </div>
  );
}
