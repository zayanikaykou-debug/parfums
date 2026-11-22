import { ShoppingBag } from 'lucide-react';
import { formatTnd, useStore } from '../context/StoreContext';
import type { Product } from '../types';
import { LuxuryImage } from './LuxuryImage';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { navigate, addToCart, t, getCategoryLabel } = useStore();
  const primaryVariant = product.variants[0];
  const hasSale =
    primaryVariant &&
    primaryVariant.sale_price_tnd !== null &&
    primaryVariant.sale_price_tnd > 0 &&
    primaryVariant.sale_price_tnd < primaryVariant.price_tnd;

  const displayPrice = primaryVariant
    ? hasSale
      ? primaryVariant.sale_price_tnd!
      : primaryVariant.price_tnd
    : 0;

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const inStock = totalStock > 0;

  const catLabel = getCategoryLabel({
    slug: product.category_slug,
    name: product.category_name || 'Haute Parfumerie',
  }).name;

  return (
    <article className="group flex flex-col liquid-glass-card rounded-2xl overflow-hidden hover:-translate-y-1">
      <button
        type="button"
        onClick={() => navigate(`/parfum/${product.slug}`)}
        className="relative w-full aspect-[4/3] overflow-hidden bg-[#060B17] text-start cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF6E]"
      >
        <LuxuryImage
          src={product.images[0] || ''}
          alt={product.name}
          fallbackTitle={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#060B17]/85 via-[#060B17]/10 to-transparent opacity-80" />
        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_20%,rgba(212,175,110,0.16),transparent_65%)]" />
        {(product.is_new || product.is_bestseller || hasSale) && (
          <div className="absolute top-3.5 start-3.5 text-[10px] tracking-[0.18em] uppercase text-[#E8CFA0] liquid-glass-subtle px-3 py-1 rounded">
            {hasSale
              ? t.product.privilegeEdition
              : product.is_new
                ? t.product.newArrival
                : t.product.signature}
          </div>
        )}
      </button>

      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#F7F4EE]/55 tracking-wide">
            <span className="truncate">{catLabel}</span>
            {primaryVariant && (
              <>
                <span aria-hidden="true">·</span>
                <span className="whitespace-nowrap shrink-0">{primaryVariant.volume}</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate(`/parfum/${product.slug}`)}
            className="mt-1.5 block text-start w-full cursor-pointer focus-visible:outline-none focus-visible:text-[#D4AF6E]"
          >
            <h3 className="font-serif text-2xl font-medium text-[#F7F4EE] group-hover:text-[#E8CFA0] transition-colors leading-snug truncate">
              {product.name}
            </h3>
          </button>

          <p className="mt-1 text-xs text-[#F7F4EE]/50 truncate">
            {product.olfactory_family}
            {!inStock && ` · ${t.product.outOfStockShort}`}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3.5 border-t border-[#D4AF6E]/12 gap-3">
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-base font-semibold text-[#E8CFA0]">
              {formatTnd(displayPrice)}
            </span>
            {hasSale && primaryVariant && (
              <span className="text-xs text-[#F7F4EE]/40 line-through">
                {formatTnd(primaryVariant.price_tnd)}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={!inStock || !primaryVariant}
            onClick={() => primaryVariant && addToCart(product, primaryVariant.id, 1, true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg liquid-glass-subtle text-[#F7F4EE] hover:bg-[#D4AF6E] hover:text-[#060B17] hover:border-[#D4AF6E] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>{inStock ? t.product.add : t.product.soldOut}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
