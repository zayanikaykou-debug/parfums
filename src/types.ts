export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface ProductVariant {
  id: number;
  product_id: number;
  volume: string;
  price_tnd: number;
  sale_price_tnd: number | null;
  stock: number;
  sku: string;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  brand: string;
  category_slug: string;
  category_name?: string;
  olfactory_family: string;
  description: string;
  top_notes: string;
  heart_notes: string;
  base_notes: string;
  images: string[];
  is_featured: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  is_visible: boolean;
  is_gift_set: boolean;
  created_at: string;
  variants: ProductVariant[];
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  image_url: string;
  sort_order: number;
}

export interface SiteSettings {
  logo_text: string;
  logo_image: string;
  hero_image: string;
  hero_title: string;
  hero_tagline: string;
  hero_subtitle: string;
  hero_cta_primary: string;
  hero_cta_secondary: string;
  announcement_banner: string;
  announcement_enabled: string;
  free_shipping_threshold_tnd: string;
  shipping_fee_tnd: string;
  about_title: string;
  about_text: string;
  about_image: string;
  contact_phone: string;
  contact_whatsapp: string;
  contact_email: string;
  contact_address: string;
  social_instagram: string;
  social_facebook: string;
  footer_copyright: string;
}

export interface CartItem {
  productId: number;
  variantId: number;
  slug: string;
  name: string;
  brand: string;
  volume: string;
  unitPrice: number;
  originalPrice: number;
  image: string;
  quantity: number;
  maxStock: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  volume: string;
  unit_price_tnd: number;
  quantity: number;
  image_url: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  note: string;
  payment_method: string;
  subtotal_tnd: number;
  shipping_tnd: number;
  total_tnd: number;
  status: OrderStatus;
  created_at: string;
  items: OrderItem[];
}

export interface CustomerSummary {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  created_at: string;
  order_count: number;
  total_spent_tnd: number;
}

export interface AdminStats {
  total_revenue: number;
  today_revenue: number;
  weekly_revenue: number;
  monthly_revenue: number;
  period_revenue: number;
  period_orders: number;
  total_orders: number;
  pending_orders: number;
  delivered_orders: number;
  total_products: number;
  low_stock_products: number;
  total_customers: number;
  revenue_series: Array<{
    label: string;
    date: string;
    revenue: number;
    orders: number;
  }>;
  status_breakdown: Array<{
    status: OrderStatus;
    count: number;
  }>;
}
