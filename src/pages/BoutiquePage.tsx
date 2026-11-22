import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { formatTnd, useStore } from '../context/StoreContext';

export function BoutiquePage() {
  const { products, categories, currentPath, t, getCategoryLabel } = useStore();

  const initialCategory = useMemo(() => {
    const query = currentPath.split('?')[1] || '';
    const params = new URLSearchParams(query);
    return params.get('category') || 'all';
  }, [currentPath]);

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [search, setSearch] = useState('');
  const [selectedVolume, setSelectedVolume] = useState('all');
  const [highlightFilter, setHighlightFilter] = useState<'all' | 'bestseller' | 'new' | 'featured'>('all');
  const [maxPrice, setMaxPrice] = useState<number>(600);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const availableVolumes = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      for (const v of p.variants) {
        set.add(v.volume);
      }
    }
    return Array.from(set);
  }, [products]);

  const priceCeiling = useMemo(() => {
    let max = 500;
    for (const p of products) {
      for (const v of p.variants) {
        const eff = v.sale_price_tnd ?? v.price_tnd;
        if (eff > max) max = eff;
      }
    }
    return Math.ceil(max / 50) * 50;
  }, [products]);

  useEffect(() => {
    setMaxPrice(priceCeiling);
  }, [priceCeiling]);

  const getProductMinPrice = (p: (typeof products)[number]) => {
    if (!p.variants.length) return 0;
    return Math.min(
      ...p.variants.map((v) =>
        v.sale_price_tnd !== null && v.sale_price_tnd > 0 ? v.sale_price_tnd : v.price_tnd
      )
    );
  };

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => {
      if (selectedCategory !== 'all' && p.category_slug !== selectedCategory) return false;
      if (highlightFilter === 'bestseller' && !p.is_bestseller) return false;
      if (highlightFilter === 'new' && !p.is_new) return false;
      if (highlightFilter === 'featured' && !p.is_featured) return false;
      if (
        selectedVolume !== 'all' &&
        !p.variants.some((v) => v.volume === selectedVolume)
      ) {
        return false;
      }
      const minP = getProductMinPrice(p);
      if (minP > maxPrice) return false;

      if (q) {
        const hay = `${p.name} ${p.brand} ${p.description} ${p.olfactory_family} ${p.top_notes} ${p.heart_notes} ${p.base_notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return getProductMinPrice(a) - getProductMinPrice(b);
      if (sortBy === 'price-desc') return getProductMinPrice(b) - getProductMinPrice(a);
      if (sortBy === 'newest') return (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0);
      return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    });
  }, [products, selectedCategory, highlightFilter, selectedVolume, maxPrice, search, sortBy]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearch('');
    setSelectedVolume('all');
    setHighlightFilter('all');
    setMaxPrice(priceCeiling);
    setSortBy('featured');
  };

  const activeCategoryObj = categories.find((c) => c.slug === selectedCategory);
  const localizedCat = activeCategoryObj ? getCategoryLabel(activeCategoryObj) : null;

  return (
    <main className="min-h-screen bg-[#060B17] pt-28 pb-24">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="pb-10 border-b border-[#D4AF6E]/15 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs tracking-[0.24em] uppercase text-[#D4AF6E]">
              {t.boutique.eyebrow}
            </p>
            <h1 className="mt-2 font-serif text-4xl sm:text-5xl font-medium text-[#F7F4EE]">
              {localizedCat ? localizedCat.name : t.boutique.titleAll}
            </h1>
            <p className="mt-2 text-sm text-[#F7F4EE]/65 max-w-xl">
              {localizedCat?.description || t.boutique.subtitleAll}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 text-[#D4AF6E]/70 absolute start-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.boutique.searchPlaceholder}
                className="w-full ps-10 pe-4 py-2.5 text-sm rounded-lg bg-[#0B1325] border border-[#D4AF6E]/20 text-[#F7F4EE] placeholder:text-[#F7F4EE]/40 focus:outline-none focus:border-[#D4AF6E]"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFiltersMobile((v) => !v)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-lg border border-[#D4AF6E]/25 bg-[#0B1325] text-[#F7F4EE] cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#D4AF6E]" />
              <span>{t.boutique.filters}</span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="py-6 flex items-center gap-2 overflow-x-auto border-b border-[#D4AF6E]/10">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#D4AF6E] text-[#060B17]'
                : 'bg-[#0B1325] text-[#F7F4EE]/75 hover:text-[#F7F4EE] border border-[#D4AF6E]/15'
            }`}
          >
            {t.boutique.allCollections}
          </button>
          {categories.map((cat) => {
            const loc = getCategoryLabel(cat);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === cat.slug
                    ? 'bg-[#D4AF6E] text-[#060B17]'
                    : 'bg-[#0B1325] text-[#F7F4EE]/75 hover:text-[#F7F4EE] border border-[#D4AF6E]/15'
                }`}
              >
                {loc.name}
              </button>
            );
          })}
        </div>

        <div className="pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Filters */}
          <aside
            className={`lg:col-span-3 space-y-7 ${
              showFiltersMobile ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="p-6 rounded-2xl liquid-glass space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold tracking-[0.18em] uppercase text-[#D4AF6E]">
                  {t.boutique.refine}
                </h2>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-xs text-[#F7F4EE]/55 hover:text-[#E8CFA0] cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.boutique.reset}</span>
                </button>
              </div>

              {/* Highlights */}
              <div className="space-y-2.5">
                <p className="text-xs font-medium text-[#F7F4EE]/80">{t.boutique.selection}</p>
                <div className="flex flex-col gap-1.5">
                  {[
                    { id: 'all', label: t.boutique.allPerfumes },
                    { id: 'bestseller', label: t.boutique.bestsellers },
                    { id: 'new', label: t.boutique.newArrivals },
                    { id: 'featured', label: t.boutique.featured },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setHighlightFilter(opt.id as typeof highlightFilter)
                      }
                      className={`text-start px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                        highlightFilter === opt.id
                          ? 'bg-[#101A33] text-[#E8CFA0] border border-[#D4AF6E]/35'
                          : 'text-[#F7F4EE]/65 hover:text-[#F7F4EE]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume */}
              <div className="space-y-2.5 pt-4 border-t border-[#D4AF6E]/10">
                <p className="text-xs font-medium text-[#F7F4EE]/80">{t.product.volume}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVolume('all')}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                      selectedVolume === 'all'
                        ? 'bg-[#D4AF6E] text-[#060B17] font-medium'
                        : 'bg-[#060B17] text-[#F7F4EE]/70 border border-[#D4AF6E]/15 hover:border-[#D4AF6E]/40'
                    }`}
                  >
                    {t.boutique.allVolumes}
                  </button>
                  {availableVolumes.map((vol) => (
                    <button
                      key={vol}
                      type="button"
                      onClick={() => setSelectedVolume(vol)}
                      className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                        selectedVolume === vol
                          ? 'bg-[#D4AF6E] text-[#060B17] font-medium'
                          : 'bg-[#060B17] text-[#F7F4EE]/70 border border-[#D4AF6E]/15 hover:border-[#D4AF6E]/40'
                      }`}
                    >
                      {vol}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="space-y-3 pt-4 border-t border-[#D4AF6E]/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#F7F4EE]/80">{t.boutique.maxPrice}</span>
                  <span className="tabular-nums text-[#E8CFA0] font-semibold">
                    {formatTnd(maxPrice)}
                  </span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={priceCeiling}
                  step={10}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#D4AF6E] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-[#F7F4EE]/45 tabular-nums">
                  <span>100 TND</span>
                  <span>{formatTnd(priceCeiling)}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="lg:col-span-9 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-[#F7F4EE]/60 tabular-nums">
                {filteredProducts.length} {t.boutique.displayedCount}
              </p>

              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="text-xs text-[#F7F4EE]/60">
                  {t.boutique.sortBy}
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-3 py-2 text-xs rounded-lg bg-[#0B1325] border border-[#D4AF6E]/20 text-[#F7F4EE] focus:outline-none focus:border-[#D4AF6E]"
                >
                  <option value="featured">{t.boutique.sortFeatured}</option>
                  <option value="newest">{t.boutique.sortNewest}</option>
                  <option value="price-asc">{t.boutique.sortPriceAsc}</option>
                  <option value="price-desc">{t.boutique.sortPriceDesc}</option>
                </select>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="p-14 text-center rounded-xl bg-[#0B1325]/60 border border-[#D4AF6E]/15">
                <p className="font-serif text-2xl text-[#F7F4EE]">
                  {t.boutique.emptyTitle}
                </p>
                <p className="mt-2 text-sm text-[#F7F4EE]/60">
                  {t.boutique.emptySub}
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-6 px-6 py-2.5 text-xs font-semibold rounded-lg btn-gold-luxury cursor-pointer"
                >
                  {t.boutique.showAll}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
