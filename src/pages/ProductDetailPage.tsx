import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, Sparkles } from 'lucide-react';
import { LuxuryImage } from '../components/LuxuryImage';
import { ProductCard } from '../components/ProductCard';
import { formatTnd, useStore } from '../context/StoreContext';
import type { Product } from '../types';

export function ProductDetailPage({ slug }: { slug: string }) {
  const { addToCart, navigate, t, getCategoryLabel } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<number>(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/products/${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Introuvable'))))
      .then((data: { product: Product; related: Product[] }) => {
        if (!active) return;
        setProduct(data.product);
        setRelated(data.related || []);
        setSelectedImageIdx(0);
        setQuantity(1);
        if (data.product.variants.length > 0) {
          setSelectedVariantId(data.product.variants[0].id);
        }
      })
      .catch(() => {
        if (active) setProduct(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#060B17] pt-32 pb-24">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 animate-pulse">
          <div className="lg:col-span-6 aspect-[4/3] rounded-xl bg-[#0B1325]" />
          <div className="lg:col-span-6 space-y-5">
            <div className="h-4 w-40 bg-[#0B1325] rounded" />
            <div className="h-12 w-3/4 bg-[#0B1325] rounded" />
            <div className="h-24 w-full bg-[#0B1325] rounded" />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[#060B17] pt-36 pb-24 text-center px-5">
        <h1 className="font-serif text-4xl text-[#F7F4EE]">{t.product.notFound}</h1>
        <p className="mt-3 text-sm text-[#F7F4EE]/65">{t.product.notFoundSub}</p>
        <button
          type="button"
          onClick={() => navigate('/boutique')}
          className="mt-8 px-6 py-3 text-sm font-semibold rounded-lg btn-gold-luxury cursor-pointer"
        >
          {t.product.backToBoutique}
        </button>
      </main>
    );
  }

  const activeVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  const hasSale =
    activeVariant &&
    activeVariant.sale_price_tnd !== null &&
    activeVariant.sale_price_tnd > 0 &&
    activeVariant.sale_price_tnd < activeVariant.price_tnd;
  const effectivePrice = activeVariant
    ? hasSale
      ? activeVariant.sale_price_tnd!
      : activeVariant.price_tnd
    : 0;
  const inStock = activeVariant ? activeVariant.stock > 0 : false;

  const catLabel = getCategoryLabel({
    slug: product.category_slug,
    name: product.category_name || '',
  }).name;

  const handleBuyNow = () => {
    if (!activeVariant || !inStock) return;
    addToCart(product, activeVariant.id, quantity, false);
    navigate('/checkout');
  };

  return (
    <main className="min-h-screen bg-[#060B17] pt-28 pb-24">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
        <button
          type="button"
          onClick={() => navigate('/boutique')}
          className="inline-flex items-center gap-2 text-xs tracking-wide text-[#F7F4EE]/65 hover:text-[#E8CFA0] transition-colors mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{t.product.backToBoutique}</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Sticky Photography Gallery */}
          <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-4">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden liquid-glass p-1.5">
              <div className="w-full h-full rounded-xl overflow-hidden bg-[#060B17]">
                <LuxuryImage
                  src={product.images[selectedImageIdx] || product.images[0] || ''}
                  alt={product.name}
                  fallbackTitle={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    type="button"
                    onClick={() => setSelectedImageIdx(i)}
                    className={`aspect-[4/3] rounded-lg overflow-hidden border transition-all cursor-pointer ${
                      selectedImageIdx === i
                        ? 'border-[#D4AF6E] ring-1 ring-[#D4AF6E]'
                        : 'border-[#D4AF6E]/15 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <LuxuryImage
                      src={img}
                      alt={`${product.name} ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Contiguous Purchase Module & Fragrance Pyramid */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs tracking-wider uppercase text-[#D4AF6E]">
                <span>{product.brand}</span>
                <span aria-hidden="true">·</span>
                <span>{catLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{product.olfactory_family}</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl font-medium text-[#F7F4EE] leading-tight">
                {product.name}
              </h1>

              <div className="flex items-baseline gap-3 tabular-nums pt-1">
                <span className="text-3xl font-semibold text-[#E8CFA0]">
                  {formatTnd(effectivePrice)}
                </span>
                {hasSale && activeVariant && (
                  <span className="text-lg text-[#F7F4EE]/40 line-through">
                    {formatTnd(activeVariant.price_tnd)}
                  </span>
                )}
              </div>

              <p className="text-base text-[#F7F4EE]/75 leading-relaxed pt-2">
                {product.description}
              </p>
            </div>

            {/* Volume / Variation Selector */}
            <div className="space-y-3 pt-4 border-t border-[#D4AF6E]/15">
              <div className="flex items-center justify-between text-xs">
                <span className="uppercase tracking-[0.16em] text-[#F7F4EE]/70">
                  {t.product.volume}
                </span>
                <span className={inStock ? 'text-[#E8CFA0]' : 'text-rose-300'}>
                  {inStock
                    ? activeVariant && activeVariant.stock <= 5
                      ? `${t.product.limitedStock} (${activeVariant.stock} ${t.product.remaining})`
                      : t.product.inStockFast
                    : t.product.outOfStockShort}
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {product.variants.map((variant) => {
                  const selected = variant.id === activeVariant?.id;
                  const vPrice =
                    variant.sale_price_tnd !== null && variant.sale_price_tnd > 0
                      ? variant.sale_price_tnd
                      : variant.price_tnd;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariantId(variant.id);
                        setQuantity(1);
                      }}
                      className={`px-4 py-2.5 rounded-lg border text-start transition-all cursor-pointer ${
                        selected
                          ? 'border-[#D4AF6E] liquid-glass-subtle text-[#F7F4EE]'
                          : 'border-[#D4AF6E]/20 bg-[#0B1325]/70 text-[#F7F4EE]/70 hover:border-[#D4AF6E]/45'
                      }`}
                    >
                      <div className="text-xs font-semibold">{variant.volume}</div>
                      <div className="text-[11px] tabular-nums text-[#E8CFA0] mt-0.5">
                        {formatTnd(vPrice)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity & Action CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <div className="inline-flex items-center justify-between border border-[#D4AF6E]/25 rounded-lg bg-[#0B1325] px-2 py-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2.5 text-[#F7F4EE]/80 hover:text-[#E8CFA0] cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-semibold tabular-nums text-[#F7F4EE]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(activeVariant?.stock || 1, q + 1))
                  }
                  className="p-2.5 text-[#F7F4EE]/80 hover:text-[#E8CFA0] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={!inStock || !activeVariant}
                onClick={() =>
                  activeVariant && addToCart(product, activeVariant.id, quantity, true)
                }
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-lg btn-gold-luxury disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{t.product.addToCart}</span>
              </button>

              <button
                type="button"
                disabled={!inStock || !activeVariant}
                onClick={handleBuyNow}
                className="px-6 py-3.5 text-sm font-medium rounded-lg liquid-glass-subtle text-[#F7F4EE] hover:border-[#D4AF6E] hover:text-[#E8CFA0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {t.product.buyNow}
              </button>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#F7F4EE]/60 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#D4AF6E]" />
                {t.product.codBadge}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF6E]" />
                {t.product.highConcBadge}
              </span>
            </div>

            {/* Olfactory Pyramid */}
            <div className="p-6 rounded-2xl liquid-glass space-y-5">
              <div className="flex items-center justify-between border-b border-[#D4AF6E]/15 pb-3">
                <h2 className="font-serif text-2xl font-medium text-[#F7F4EE]">
                  {t.product.pyramidTitle}
                </h2>
                <span className="text-xs text-[#D4AF6E]">{product.olfactory_family}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#D4AF6E] mb-1.5">
                    {t.product.topNotes}
                  </p>
                  <p className="text-sm text-[#F7F4EE]/80 leading-relaxed">
                    {product.top_notes || 'Bergamote, Épices fines'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#D4AF6E] mb-1.5">
                    {t.product.heartNotes}
                  </p>
                  <p className="text-sm text-[#F7F4EE]/80 leading-relaxed">
                    {product.heart_notes || 'Fleurs nocturnes, Résines'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#D4AF6E] mb-1.5">
                    {t.product.baseNotes}
                  </p>
                  <p className="text-sm text-[#F7F4EE]/80 leading-relaxed">
                    {product.base_notes || 'Ambre gris, Bois précieux'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Perfumes */}
        {related.length > 0 && (
          <section className="mt-24 pt-16 border-t border-[#D4AF6E]/15">
            <p className="text-xs tracking-[0.24em] uppercase text-[#D4AF6E]">
              {t.product.sameWake}
            </p>
            <h2 className="mt-2 font-serif text-3xl font-medium text-[#F7F4EE] mb-10">
              {t.product.similarCreations}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
