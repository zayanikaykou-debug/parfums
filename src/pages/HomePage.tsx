import { ArrowRight, Mail, MessageCircle, Phone } from 'lucide-react';
import { LuxuryImage } from '../components/LuxuryImage';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';

export function HomePage() {
  const { settings, categories, products, navigate, language, t, getCategoryLabel } =
    useStore();

  const featuredProducts = products.filter((p) => p.is_featured).slice(0, 6);
  const displayProducts =
    featuredProducts.length > 0 ? featuredProducts : products.slice(0, 6);

  const whatsappUrl = `https://wa.me/${(settings.contact_whatsapp || '').replace(/[^0-9]/g, '')}`;

  const heroTagline = language === 'ar' ? t.hero.tagline : settings.hero_tagline || t.hero.tagline;
  const heroSubtitle = language === 'ar' ? t.hero.subtitle : settings.hero_subtitle || t.hero.subtitle;
  const ctaPrimary = language === 'ar' ? t.hero.ctaPrimary : settings.hero_cta_primary || t.hero.ctaPrimary;
  const ctaSecondary = language === 'ar' ? t.hero.ctaSecondary : settings.hero_cta_secondary || t.hero.ctaSecondary;
  const aboutTitle = language === 'ar' ? t.home.aboutTitle : settings.about_title || t.home.aboutTitle;
  const aboutText = language === 'ar' ? t.home.aboutText : settings.about_text || t.home.aboutText;

  return (
    <main>
      {/* 1. CINEMATIC HERO */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#060B17]">
        <div className="absolute inset-0">
          <LuxuryImage
            src={settings.hero_image}
            alt={settings.hero_title}
            priority
            className="w-full h-full object-cover object-center scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060B17]/95 via-[#060B17]/68 to-[#060B17]/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060B17] via-transparent to-[#060B17]/45" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_68%_45%,rgba(212,175,110,0.12),transparent_52%)]" />
        </div>

        <div className="relative z-10 max-w-[1280px] mx-auto w-full px-5 sm:px-8 pt-28 pb-20">
          <div className="max-w-2xl animate-hero-in">
            <div className="inline-flex items-center gap-3 mb-5">
              <span className="h-px w-8 bg-[#D4AF6E]/70" />
              <p className="text-xs tracking-[0.3em] uppercase text-[#D4AF6E]">
                {t.hero.eyebrow}
              </p>
            </div>

            <h1
              className="font-serif text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-[0.06em] text-[#F7F4EE] leading-[1.04]"
              style={{ textWrap: 'balance' }}
            >
              {settings.hero_title || 'ZEPHOR PARFUMS'}
            </h1>

            <p className="mt-4 font-serif italic text-2xl sm:text-3xl text-[#E8CFA0]">
              {heroTagline}
            </p>

            <p className="mt-4 text-base sm:text-lg text-[#F7F4EE]/75 max-w-lg leading-relaxed">
              {heroSubtitle}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/boutique?category=collections-exclusives')}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-semibold rounded-lg btn-gold-luxury cursor-pointer"
              >
                <span>{ctaPrimary}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/boutique')}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-medium rounded-lg liquid-glass-subtle text-[#F7F4EE] hover:border-[#D4AF6E]/60 hover:text-[#E8CFA0] transition-all cursor-pointer"
              >
                <span>{ctaSecondary}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Subtle Haute-Parfumerie Divider */}
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 pt-6">
        <div className="gold-ornament-divider">
          <span className="w-1.5 h-1.5 rotate-45 bg-[#D4AF6E]/60" />
        </div>
      </div>

      {/* 2. CATEGORIES SHOWCASE */}
      <section className="max-w-[1280px] mx-auto px-5 sm:px-8 py-18 sm:py-22">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <p className="text-xs tracking-[0.26em] uppercase text-[#D4AF6E]">
              {t.home.universes}
            </p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-medium text-[#F7F4EE]">
              {t.home.collections}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/boutique')}
            className="inline-flex items-center gap-2 text-sm text-[#E8CFA0] hover:text-[#F7F4EE] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>{t.home.browseAll}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {categories.map((cat, idx) => {
            const spanClass = idx < 2 ? 'md:col-span-3' : 'md:col-span-2';
            const aspectClass = idx < 2 ? 'aspect-[16/10]' : 'aspect-[4/3]';
            const localized = getCategoryLabel(cat);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigate(`/boutique?category=${cat.slug}`)}
                className={`${spanClass} group relative block w-full ${aspectClass} rounded-2xl overflow-hidden liquid-glass-card text-start cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF6E]`}
              >
                <LuxuryImage
                  src={cat.image_url}
                  alt={localized.name}
                  fallbackTitle={localized.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#060B17]/95 via-[#060B17]/30 to-transparent" />
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_100%,rgba(212,175,110,0.18),transparent_65%)]" />
                <div className="absolute inset-x-4 bottom-4 z-10 p-4 rounded-xl liquid-glass-subtle flex items-end justify-between gap-4 transition-transform duration-300 group-hover:-translate-y-0.5">
                  <div className="min-w-0">
                    <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#F7F4EE] group-hover:text-[#E8CFA0] transition-colors truncate">
                      {localized.name}
                    </h3>
                    <p className="mt-1 text-xs text-[#F7F4EE]/70 line-clamp-1">
                      {localized.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#D4AF6E] shrink-0 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. FEATURED CREATIONS */}
      <section className="relative border-t border-[#D4AF6E]/12 bg-[#080E1D]/75">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(212,175,110,0.06),transparent_70%)]" />
        <div className="relative max-w-[1280px] mx-auto px-5 sm:px-8 py-20 sm:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-xs tracking-[0.26em] uppercase text-[#D4AF6E]">
                {t.home.maisonSelection}
              </p>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-medium text-[#F7F4EE]">
                {t.home.signatureCreations}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/boutique')}
              className="inline-flex items-center gap-2 text-sm text-[#E8CFA0] hover:text-[#F7F4EE] transition-colors cursor-pointer self-start sm:self-auto"
            >
              <span>{t.home.viewBoutique}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. MAISON SAVOIR-FAIRE & CONCIERGERIE */}
      <section className="max-w-[1280px] mx-auto px-5 sm:px-8 py-20 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-[#D4AF6E]/20 bg-[#0B1325] min-h-[340px] shadow-2xl">
            <LuxuryImage
              src={settings.about_image}
              alt={aboutTitle}
              className="w-full h-full object-cover lg:h-full"
            />
          </div>

          <div className="lg:col-span-6 flex flex-col justify-between p-8 sm:p-10 rounded-2xl liquid-glass">
            <div>
              <p className="text-xs tracking-[0.26em] uppercase text-[#D4AF6E]">
                {t.home.hauteParfumerie}
              </p>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-medium text-[#F7F4EE] leading-tight">
                {aboutTitle}
              </h2>
              <p className="mt-5 text-base text-[#F7F4EE]/75 leading-relaxed">
                {aboutText}
              </p>
            </div>

            <div className="mt-10 pt-8 border-t border-[#D4AF6E]/15 space-y-4">
              <p className="text-xs tracking-[0.22em] uppercase text-[#D4AF6E]">
                {t.home.privateConcierge}
              </p>
              <div className="flex flex-wrap gap-3">
                {settings.contact_whatsapp && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg btn-gold-luxury"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{t.home.whatsappAdvice}</span>
                  </a>
                )}
                {settings.contact_phone && (
                  <a
                    href={`tel:${settings.contact_phone.replace(/\s+/g, '')}`}
                    dir="ltr"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium rounded-lg liquid-glass-subtle text-[#F7F4EE] hover:border-[#D4AF6E]/60 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[#D4AF6E]" />
                    <span>{settings.contact_phone}</span>
                  </a>
                )}
                {settings.contact_email && (
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium rounded-lg liquid-glass-subtle text-[#F7F4EE] hover:border-[#D4AF6E]/60 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-[#D4AF6E]" />
                    <span>{t.home.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
