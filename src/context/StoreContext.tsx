import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CATEGORY_AR, UI_TEXT, type Language } from '../i18n/translations';
import type { CartItem, Category, Product, SiteSettings } from '../types';

type UiDictionary = (typeof UI_TEXT)[Language];

interface StoreContextValue {
  settings: SiteSettings;
  categories: Category[];
  products: Product[];
  loading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: UiDictionary;
  getCategoryLabel: (cat: { slug: string; name: string; description?: string }) => {
    name: string;
    description: string;
  };
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, variantId: number, quantity?: number, openDrawer?: boolean) => void;
  updateCartQuantity: (variantId: number, quantity: number) => void;
  removeFromCart: (variantId: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  shippingCost: number;
  cartTotal: number;
  currentPath: string;
  navigate: (to: string) => void;
  refreshStore: () => Promise<void>;
}

const DEFAULT_SETTINGS: SiteSettings = {
  logo_text: 'ZEPHOR PARFUMS',
  logo_image: '',
  hero_image: '/src/assets/images/hero_zephor_campaign_1795349867029.jpg',
  hero_title: 'ZEPHOR PARFUMS',
  hero_tagline: "L'art de laisser une empreinte.",
  hero_subtitle: 'Des fragrances qui racontent votre histoire.',
  hero_cta_primary: 'Découvrir la collection',
  hero_cta_secondary: 'Explorer nos parfums',
  announcement_banner: 'Livraison offerte en Tunisie dès 250 TND · Paiement à la livraison',
  announcement_enabled: 'true',
  free_shipping_threshold_tnd: '250',
  shipping_fee_tnd: '8',
  about_title: "L'Âme d'une Maison de Haute Parfumerie",
  about_text:
    "Née d'une fascination pour les matières nobles et les sillages nocturnes, Zephor Parfums compose des extraits de caractère où la profondeur du bois d'oud épouse l'éclat de l'ambre doré.",
  about_image: '/src/assets/images/atelier_savoir_faire_1795349867312.jpg',
  contact_phone: '+216 28 450 920',
  contact_whatsapp: '+21628450920',
  contact_email: 'conciergerie@zephorparfums.tn',
  contact_address: 'Les Berges du Lac II, 1053 Tunis, Tunisie',
  social_instagram: 'https://instagram.com/zephorparfums',
  social_facebook: 'https://facebook.com/zephorparfums',
  footer_copyright: '© 2026 Zephor Parfums. Tous droits réservés.',
};

const CART_STORAGE_KEY = 'zephor_parfums_cart_v1';
const LANG_STORAGE_KEY = 'zephor_parfums_lang_v1';

const StoreContext = createContext<StoreContextValue | null>(null);

export function formatTnd(amount: number): string {
  return `${Number(amount).toLocaleString('fr-TN', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} TND`;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === 'ar' || saved === 'fr') return saved;
    } catch {
      // ignore
    }
    return 'fr';
  });

  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname + window.location.search;
  });

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'fr' ? 'ar' : 'fr');
  }, [language, setLanguage]);

  const getCategoryLabel = useCallback(
    (cat: { slug: string; name: string; description?: string }) => {
      if (language === 'ar' && CATEGORY_AR[cat.slug]) {
        return CATEGORY_AR[cat.slug];
      }
      return {
        name: cat.name,
        description: cat.description || '',
      };
    },
    [language]
  );

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: string) => {
    if (to === window.location.pathname + window.location.search) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history.pushState({}, '', to);
    setCurrentPath(to);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const refreshStore = useCallback(async () => {
    try {
      const res = await fetch('/api/bootstrap');
      if (!res.ok) throw new Error('Erreur réseau');
      const data = (await res.json()) as {
        settings: SiteSettings;
        categories: Category[];
        products: Product[];
      };
      if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      if (Array.isArray(data.categories)) setCategories(data.categories);
      if (Array.isArray(data.products)) setProducts(data.products);
    } catch (err) {
      console.error('Failed to bootstrap store:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStore();
  }, [refreshStore]);

  const addToCart = useCallback(
    (product: Product, variantId: number, quantity = 1, openDrawer = true) => {
      const variant = product.variants.find((v) => v.id === variantId) || product.variants[0];
      if (!variant || variant.stock <= 0) return;

      const unitPrice =
        variant.sale_price_tnd !== null && variant.sale_price_tnd > 0
          ? variant.sale_price_tnd
          : variant.price_tnd;

      setCart((prev) => {
        const existing = prev.find((item) => item.variantId === variant.id);
        if (existing) {
          const nextQty = Math.min(variant.stock, existing.quantity + quantity);
          return prev.map((item) =>
            item.variantId === variant.id
              ? { ...item, quantity: nextQty, maxStock: variant.stock, unitPrice }
              : item
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            variantId: variant.id,
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            volume: variant.volume,
            unitPrice,
            originalPrice: variant.price_tnd,
            image: product.images[0] || '',
            quantity: Math.min(variant.stock, quantity),
            maxStock: variant.stock,
          },
        ];
      });

      if (openDrawer) {
        setCartOpen(true);
      }
    },
    []
  );

  const updateCartQuantity = useCallback((variantId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.variantId !== variantId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: Math.min(item.maxStock || 99, quantity) }
          : item
      )
    );
  }, []);

  const removeFromCart = useCallback((variantId: number) => {
    setCart((prev) => prev.filter((item) => item.variantId !== variantId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartCount = cart.reduce((acc, it) => acc + it.quantity, 0);
  const cartSubtotal = cart.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  const freeThreshold = Number(settings.free_shipping_threshold_tnd || 250);
  const baseShipping = Number(settings.shipping_fee_tnd || 8);
  const shippingCost = cartSubtotal === 0 || cartSubtotal >= freeThreshold ? 0 : baseShipping;
  const cartTotal = cartSubtotal + shippingCost;

  return (
    <StoreContext.Provider
      value={{
        settings,
        categories,
        products,
        loading,
        language,
        setLanguage,
        toggleLanguage,
        t: UI_TEXT[language],
        getCategoryLabel,
        cart,
        cartOpen,
        setCartOpen,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,
        shippingCost,
        cartTotal,
        currentPath,
        navigate,
        refreshStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
