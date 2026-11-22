import { useEffect, useState } from 'react';
import { Globe, Menu, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { LuxuryImage } from './LuxuryImage';

export function Navbar() {
  const {
    settings,
    cartCount,
    setCartOpen,
    navigate,
    currentPath,
    language,
    toggleLanguage,
    t,
  } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { label: t.nav.home, path: '/' },
    { label: t.nav.boutique, path: '/boutique' },
    { label: t.nav.homme, path: '/boutique?category=parfums-homme' },
    { label: t.nav.femme, path: '/boutique?category=parfums-femme' },
    { label: t.nav.collections, path: '/boutique?category=collections-exclusives' },
    { label: t.nav.contact, path: '/contact' },
  ];

  const handleNav = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  const showBanner =
    !bannerDismissed &&
    settings.announcement_enabled === 'true' &&
    Boolean(settings.announcement_banner?.trim());

  const bannerText =
    language === 'ar'
      ? 'توصيل مجاني في تونس ابتداءً من 250 د.ت · الدفع عند الاستلام'
      : settings.announcement_banner;

  return (
    <header className="fixed top-0 inset-x-0 z-40">
      {showBanner && (
        <div className="bg-[#0B1325] border-b border-[#D4AF6E]/15 text-[#E8CFA0] text-xs py-1.5 px-4 flex items-center justify-center relative">
          <span className="truncate max-w-[85vw] tracking-wide">
            {bannerText}
          </span>
          <button
            type="button"
            aria-label="Fermer l'annonce"
            onClick={() => setBannerDismissed(true)}
            className="absolute right-3 p-1 text-[#F7F4EE]/50 hover:text-[#F7F4EE] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div
        className={`transition-all duration-300 ${
          scrolled
            ? 'liquid-glass border-b border-[#D4AF6E]/20'
            : 'bg-gradient-to-b from-[#060B17]/85 via-[#060B17]/45 to-transparent'
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-6 sm:gap-8">
          {/* Zone 1: Single-line brand wordmark */}
          <button
            type="button"
            onClick={() => handleNav('/')}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF6E] rounded"
          >
            {settings.logo_image ? (
              <LuxuryImage
                src={settings.logo_image}
                alt={settings.logo_text}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <span className="font-serif text-xl sm:text-2xl font-semibold tracking-[0.14em] text-[#F7F4EE]">
                {settings.logo_text || 'ZEPHOR PARFUMS'}
              </span>
            )}
          </button>

          {/* Zone 2: Concise single-line navigation links */}
          <nav
            aria-label="Navigation principale"
            className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#F7F4EE]/80"
          >
            {navItems.map((item) => {
              const isActive =
                item.path === '/'
                  ? currentPath === '/'
                  : currentPath === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleNav(item.path)}
                  className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive ? 'text-[#E8CFA0]' : 'hover:text-[#F7F4EE]'
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute left-0 right-0 -bottom-0.5 h-px bg-[#D4AF6E] transition-transform duration-200 origin-left ${
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Language Switcher + Cart Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={language === 'fr' ? 'التبديل إلى العربية' : 'Passer en français'}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg liquid-glass-subtle text-[#E8CFA0] hover:border-[#D4AF6E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#D4AF6E]" strokeWidth={1.75} />
              <span>{language === 'fr' ? 'العربية' : 'FR'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={t.nav.cart}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-medium rounded-lg liquid-glass-subtle text-[#F7F4EE] hover:border-[#D4AF6E] hover:text-[#E8CFA0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#D4AF6E]" strokeWidth={1.75} />
              <span className="hidden sm:inline">{t.nav.cart}</span>
              <span className="tabular-nums text-[#E8CFA0]">({cartCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
              className="lg:hidden p-2 rounded-lg text-[#F7F4EE] hover:bg-[#101A33] cursor-pointer"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <div className="lg:hidden liquid-glass border-b border-[#D4AF6E]/20 px-6 py-5 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => handleNav(item.path)}
              className={`block w-full text-start py-2.5 text-base font-medium border-b border-[#D4AF6E]/10 last:border-none cursor-pointer ${
                currentPath === item.path ? 'text-[#E8CFA0]' : 'text-[#F7F4EE]/85'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
