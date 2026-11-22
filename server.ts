import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { db, initDatabase } from './server/db.ts';
import {
  clearSessionCookie,
  getAdminFromRequest,
  hashPassword,
  requireAdmin,
  setSessionCookie,
  signSession,
  verifyPassword,
} from './server/auth.ts';

initDatabase();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

const PORT = Number(process.env.PORT || 3000);

// Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

function getClientIp(req: express.Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) {
    return fwd.split(',')[0].trim();
  }
  if (Array.isArray(fwd) && fwd[0]) {
    return fwd[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

const MAX_ADMIN_ATTEMPTS = 3;
const BAN_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Order rate limiter (anti-spam: max 12 orders per 15 min per IP)
const orderRateMap = new Map<string, number[]>();

const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_IMAGE_EXTS.has(ext) ? ext : '.jpg';
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    cb(null, `${safeBase}_${Date.now()}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (
      file.mimetype.startsWith('image/') &&
      ALLOWED_IMAGE_EXTS.has(ext)
    ) {
      cb(null, true);
    } else {
      cb(new Error('Format image non supporté.'));
    }
  },
});

app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(uploadsDir, { dotfiles: 'deny' }));

// Helpers to assemble products with variants and category names
interface RawProductRow {
  id: number;
  slug: string;
  name: string;
  brand: string;
  category_slug: string;
  category_name: string | null;
  olfactory_family: string;
  description: string;
  top_notes: string;
  heart_notes: string;
  base_notes: string;
  images_json: string;
  is_featured: number;
  is_bestseller: number;
  is_new: number;
  is_visible: number;
  is_gift_set: number;
  created_at: string;
}

function hydrateProducts(rows: RawProductRow[]) {
  const variantsStmt = db.prepare(
    'SELECT id, product_id, volume, price_tnd, sale_price_tnd, stock, sku FROM product_variants WHERE product_id = ? ORDER BY price_tnd ASC'
  );
  return rows.map((r) => {
    let images: string[] = [];
    try {
      images = JSON.parse(r.images_json || '[]');
    } catch {
      images = [];
    }
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      brand: r.brand,
      category_slug: r.category_slug,
      category_name: r.category_name || r.category_slug,
      olfactory_family: r.olfactory_family,
      description: r.description,
      top_notes: r.top_notes,
      heart_notes: r.heart_notes,
      base_notes: r.base_notes,
      images,
      is_featured: Boolean(r.is_featured),
      is_bestseller: Boolean(r.is_bestseller),
      is_new: Boolean(r.is_new),
      is_visible: Boolean(r.is_visible),
      is_gift_set: Boolean(r.is_gift_set),
      created_at: r.created_at,
      variants: variantsStmt.all(r.id),
    };
  });
}

function getSettingsMap(): Record<string, string> {
  const rows = db.prepare('SELECT key, value FROM site_settings').all() as Array<{
    key: string;
    value: string;
  }>;
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

// =======================
// PUBLIC API ROUTES
// =======================

app.get('/api/bootstrap', (_req, res) => {
  const settings = getSettingsMap();
  const categories = db
    .prepare('SELECT * FROM categories ORDER BY sort_order ASC, id ASC')
    .all();
  const rawProducts = db
    .prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON c.slug = p.category_slug
      WHERE p.is_visible = 1
      ORDER BY p.is_featured DESC, p.created_at DESC
    `)
    .all() as RawProductRow[];

  res.json({
    settings,
    categories,
    products: hydrateProducts(rawProducts),
  });
});

app.get('/api/products', (_req, res) => {
  const rawProducts = db
    .prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON c.slug = p.category_slug
      WHERE p.is_visible = 1
      ORDER BY p.created_at DESC
    `)
    .all() as RawProductRow[];
  res.json(hydrateProducts(rawProducts));
});

app.get('/api/products/:slug', (req, res) => {
  const raw = db
    .prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON c.slug = p.category_slug
      WHERE p.slug = ? AND p.is_visible = 1
    `)
    .get(req.params.slug) as RawProductRow | undefined;

  if (!raw) {
    res.status(404).json({ error: 'Parfum introuvable.' });
    return;
  }
  const [product] = hydrateProducts([raw]);
  const relatedRaw = db
    .prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON c.slug = p.category_slug
      WHERE p.is_visible = 1 AND p.id != ? AND (p.category_slug = ? OR p.is_featured = 1)
      ORDER BY CASE WHEN p.category_slug = ? THEN 0 ELSE 1 END, p.is_bestseller DESC
      LIMIT 4
    `)
    .all(raw.id, raw.category_slug, raw.category_slug) as RawProductRow[];

  res.json({
    product,
    related: hydrateProducts(relatedRaw),
  });
});

app.post('/api/orders', (req, res) => {
  const ip = getClientIp(req);
  const now = Date.now();
  const recent = (orderRateMap.get(ip) || []).filter((ts) => now - ts < BAN_DURATION_MS);
  if (recent.length >= 12) {
    res.status(429).json({
      error: 'Trop de commandes envoyées depuis cette adresse. Veuillez patienter.',
    });
    return;
  }
  orderRateMap.set(ip, [...recent, now]);

  const {
    full_name,
    phone,
    city,
    address,
    email = '',
    note = '',
    items,
  } = req.body as {
    full_name?: string;
    phone?: string;
    city?: string;
    address?: string;
    email?: string;
    note?: string;
    items?: Array<{ variantId: number; quantity: number }>;
  };

  if (
    !full_name?.trim() ||
    !phone?.trim() ||
    !city?.trim() ||
    !address?.trim() ||
    full_name.length > 120 ||
    phone.length > 40 ||
    address.length > 300 ||
    note.length > 600
  ) {
    res.status(400).json({ error: 'Veuillez renseigner des coordonnées valides.' });
    return;
  }
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Votre panier est vide.' });
    return;
  }

  try {
    const createOrderTx = db.transaction(() => {
      const settings = getSettingsMap();
      const threshold = Number(settings.free_shipping_threshold_tnd || 250);
      const shippingFee = Number(settings.shipping_fee_tnd || 8);

      const getVariant = db.prepare(`
        SELECT v.*, p.name as product_name, p.images_json
        FROM product_variants v
        JOIN products p ON p.id = v.product_id
        WHERE v.id = ? AND p.is_visible = 1
      `);

      const resolvedItems: Array<{
        productId: number;
        variantId: number;
        productName: string;
        volume: string;
        unitPrice: number;
        quantity: number;
        imageUrl: string;
      }> = [];

      let subtotal = 0;

      for (const reqItem of items) {
        const qty = Math.max(1, Math.floor(Number(reqItem.quantity || 1)));
        const row = getVariant.get(reqItem.variantId) as
          | {
              id: number;
              product_id: number;
              volume: string;
              price_tnd: number;
              sale_price_tnd: number | null;
              stock: number;
              product_name: string;
              images_json: string;
            }
          | undefined;

        if (!row) {
          throw new Error('Un des produits sélectionnés est indisponible.');
        }
        if (row.stock < qty) {
          throw new Error(
            `Stock insuffisant pour ${row.product_name} (${row.volume}). Disponible : ${row.stock}.`
          );
        }

        const unitPrice =
          row.sale_price_tnd !== null && row.sale_price_tnd > 0
            ? row.sale_price_tnd
            : row.price_tnd;
        let imgs: string[] = [];
        try {
          imgs = JSON.parse(row.images_json || '[]');
        } catch {
          imgs = [];
        }

        subtotal += unitPrice * qty;
        resolvedItems.push({
          productId: row.product_id,
          variantId: row.id,
          productName: row.product_name,
          volume: row.volume,
          unitPrice,
          quantity: qty,
          imageUrl: imgs[0] || '',
        });

        db.prepare('UPDATE product_variants SET stock = stock - ? WHERE id = ?').run(
          qty,
          row.id
        );
      }

      const shipping = subtotal >= threshold ? 0 : shippingFee;
      const total = subtotal + shipping;

      // Find or create customer by phone
      let customer = db
        .prepare('SELECT id FROM customers WHERE phone = ?')
        .get(phone.trim()) as { id: number } | undefined;

      let customerId: number;
      if (customer) {
        customerId = customer.id;
        db.prepare(
          'UPDATE customers SET full_name = ?, email = ?, city = ?, address = ? WHERE id = ?'
        ).run(full_name.trim(), email.trim(), city.trim(), address.trim(), customerId);
      } else {
        const custRes = db
          .prepare(
            'INSERT INTO customers (full_name, phone, email, city, address) VALUES (?, ?, ?, ?, ?)'
          )
          .run(full_name.trim(), phone.trim(), email.trim(), city.trim(), address.trim());
        customerId = Number(custRes.lastInsertRowid);
      }

      // Generate unique order number
      const lastOrder = db
        .prepare('SELECT id FROM orders ORDER BY id DESC LIMIT 1')
        .get() as { id: number } | undefined;
      const nextSeq = 1001 + (lastOrder?.id || 0);
      const randSuffix = Math.floor(10 + Math.random() * 89);
      const orderNumber = `ZPH-${new Date().getFullYear()}-${nextSeq}${randSuffix}`;

      const ordRes = db
        .prepare(`
          INSERT INTO orders (
            order_number, customer_id, customer_name, phone, email, city, address,
            note, payment_method, subtotal_tnd, shipping_tnd, total_tnd, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Paiement à la livraison', ?, ?, ?, 'Pending')
        `)
        .run(
          orderNumber,
          customerId,
          full_name.trim(),
          phone.trim(),
          email.trim(),
          city.trim(),
          address.trim(),
          note.trim(),
          subtotal,
          shipping,
          total
        );
      const orderId = Number(ordRes.lastInsertRowid);

      const insertItemStmt = db.prepare(`
        INSERT INTO order_items (
          order_id, product_id, variant_id, product_name, volume, unit_price_tnd, quantity, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const it of resolvedItems) {
        insertItemStmt.run(
          orderId,
          it.productId,
          it.variantId,
          it.productName,
          it.volume,
          it.unitPrice,
          it.quantity,
          it.imageUrl
        );
      }

      const createdOrder = db
        .prepare('SELECT * FROM orders WHERE id = ?')
        .get(orderId) as Record<string, unknown>;
      const createdItems = db
        .prepare('SELECT * FROM order_items WHERE order_id = ?')
        .all(orderId);

      return { ...createdOrder, items: createdItems };
    });

    const order = createOrderTx();
    res.status(201).json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la commande.';
    res.status(400).json({ error: message });
  }
});

app.get('/api/orders/:orderNumber', (req, res) => {
  const order = db
    .prepare('SELECT * FROM orders WHERE order_number = ?')
    .get(req.params.orderNumber) as Record<string, unknown> | undefined;

  if (!order) {
    res.status(404).json({ error: 'Commande introuvable.' });
    return;
  }
  const items = db
    .prepare('SELECT * FROM order_items WHERE order_id = ?')
    .all(order.id);
  res.json({ ...order, items });
});

// =======================
// ADMIN AUTH ROUTES
// =======================

app.get('/api/admin/login-status', (req, res) => {
  const ip = getClientIp(req);
  const now = Date.now();
  const row = db
    .prepare('SELECT failed_count, banned_until FROM admin_login_attempts WHERE ip = ?')
    .get(ip) as { failed_count: number; banned_until: number | null } | undefined;

  if (row?.banned_until && row.banned_until > now) {
    const retryAfterSeconds = Math.ceil((row.banned_until - now) / 1000);
    res.json({
      banned: true,
      retryAfterSeconds,
      bannedUntil: row.banned_until,
      remainingAttempts: 0,
    });
    return;
  }

  if (row?.banned_until && row.banned_until <= now) {
    db.prepare('DELETE FROM admin_login_attempts WHERE ip = ?').run(ip);
    res.json({ banned: false, retryAfterSeconds: 0, remainingAttempts: MAX_ADMIN_ATTEMPTS });
    return;
  }

  const failed = row?.failed_count || 0;
  res.json({
    banned: false,
    retryAfterSeconds: 0,
    remainingAttempts: Math.max(0, MAX_ADMIN_ATTEMPTS - failed),
  });
});

app.post('/api/admin/login', (req, res) => {
  const ip = getClientIp(req);
  const now = Date.now();

  const attemptRow = db
    .prepare('SELECT failed_count, banned_until FROM admin_login_attempts WHERE ip = ?')
    .get(ip) as { failed_count: number; banned_until: number | null } | undefined;

  if (attemptRow?.banned_until && attemptRow.banned_until > now) {
    const retryAfterSeconds = Math.ceil((attemptRow.banned_until - now) / 1000);
    res.status(429).json({
      error: `Accès temporairement bloqué suite à 3 tentatives erronées. Réessayez dans ${Math.ceil(
        retryAfterSeconds / 60
      )} minute(s).`,
      banned: true,
      retryAfterSeconds,
      bannedUntil: attemptRow.banned_until,
    });
    return;
  }

  // Clear expired ban window before evaluating
  let currentFailures = attemptRow?.failed_count || 0;
  if (attemptRow?.banned_until && attemptRow.banned_until <= now) {
    db.prepare('DELETE FROM admin_login_attempts WHERE ip = ?').run(ip);
    currentFailures = 0;
  }

  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: 'Email et mot de passe requis.' });
    return;
  }

  const user = db
    .prepare('SELECT * FROM admin_users WHERE lower(email) = lower(?)')
    .get(email.trim()) as
    | { id: number; email: string; password_hash: string; name: string }
    | undefined;

  if (!user || !verifyPassword(password, user.password_hash)) {
    const nextFailures = currentFailures + 1;
    if (nextFailures >= MAX_ADMIN_ATTEMPTS) {
      const bannedUntil = now + BAN_DURATION_MS;
      db.prepare(`
        INSERT INTO admin_login_attempts (ip, failed_count, banned_until, last_attempt)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(ip) DO UPDATE SET
          failed_count = excluded.failed_count,
          banned_until = excluded.banned_until,
          last_attempt = excluded.last_attempt
      `).run(ip, nextFailures, bannedUntil, now);

      res.status(429).json({
        error:
          '3 tentatives incorrectes détectées. Votre adresse IP est bloquée pendant 15 minutes.',
        banned: true,
        retryAfterSeconds: Math.ceil(BAN_DURATION_MS / 1000),
        bannedUntil,
      });
      return;
    }

    db.prepare(`
      INSERT INTO admin_login_attempts (ip, failed_count, banned_until, last_attempt)
      VALUES (?, ?, NULL, ?)
      ON CONFLICT(ip) DO UPDATE SET
        failed_count = excluded.failed_count,
        banned_until = NULL,
        last_attempt = excluded.last_attempt
    `).run(ip, nextFailures, now);

    const remaining = MAX_ADMIN_ATTEMPTS - nextFailures;
    res.status(401).json({
      error: `Identifiants invalides. Il vous reste ${remaining} tentative(s) avant un blocage de 15 minutes.`,
      remainingAttempts: remaining,
    });
    return;
  }

  // Success: reset failed attempts for this IP
  db.prepare('DELETE FROM admin_login_attempts WHERE ip = ?').run(ip);

  const token = signSession({ userId: user.id, email: user.email, name: user.name });
  setSessionCookie(res, req, token);
  res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
});

app.post('/api/admin/logout', (req, res) => {
  clearSessionCookie(res, req);
  res.json({ ok: true });
});

app.get('/api/admin/me', (req, res) => {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    res.status(401).json({ authenticated: false });
    return;
  }
  res.json({
    authenticated: true,
    user: { id: admin.userId, email: admin.email, name: admin.name },
  });
});

app.post('/api/admin/password', requireAdmin, (req, res) => {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    res.status(401).json({ error: 'Non autorisé.' });
    return;
  }
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Nouveau mot de passe requis (6 caractères minimum).' });
    return;
  }
  const user = db
    .prepare('SELECT * FROM admin_users WHERE id = ?')
    .get(admin.userId) as { id: number; password_hash: string } | undefined;

  if (!user || !verifyPassword(currentPassword, user.password_hash)) {
    res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
    return;
  }
  db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(
    hashPassword(newPassword),
    admin.userId
  );
  res.json({ ok: true });
});

// =======================
// SECURED ADMIN ROUTES
// =======================

app.post('/api/admin/upload', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Aucun fichier reçu.' });
    return;
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const period = (req.query.period as string) || 'month';

  const validNonCancelled = "status != 'Cancelled'";
  const todayExpr = "date(created_at) = date('now', 'localtime')";
  const weekExpr = "date(created_at) >= date('now', 'localtime', '-6 days')";
  const monthExpr = "date(created_at) >= date('now', 'localtime', '-29 days')";

  const totalRevenue = (
    db
      .prepare(`SELECT COALESCE(SUM(total_tnd), 0) as v FROM orders WHERE ${validNonCancelled}`)
      .get() as { v: number }
  ).v;
  const todayRevenue = (
    db
      .prepare(
        `SELECT COALESCE(SUM(total_tnd), 0) as v FROM orders WHERE ${validNonCancelled} AND ${todayExpr}`
      )
      .get() as { v: number }
  ).v;
  const weeklyRevenue = (
    db
      .prepare(
        `SELECT COALESCE(SUM(total_tnd), 0) as v FROM orders WHERE ${validNonCancelled} AND ${weekExpr}`
      )
      .get() as { v: number }
  ).v;
  const monthlyRevenue = (
    db
      .prepare(
        `SELECT COALESCE(SUM(total_tnd), 0) as v FROM orders WHERE ${validNonCancelled} AND ${monthExpr}`
      )
      .get() as { v: number }
  ).v;

  let periodFilter = '1=1';
  let chartDays = 30;
  if (period === 'today') {
    periodFilter = todayExpr;
    chartDays = 7;
  } else if (period === 'week') {
    periodFilter = weekExpr;
    chartDays = 7;
  } else if (period === 'month') {
    periodFilter = monthExpr;
    chartDays = 14;
  } else {
    chartDays = 30;
  }

  const periodRevenue = (
    db
      .prepare(
        `SELECT COALESCE(SUM(total_tnd), 0) as v FROM orders WHERE ${validNonCancelled} AND ${periodFilter}`
      )
      .get() as { v: number }
  ).v;
  const periodOrders = (
    db
      .prepare(`SELECT COUNT(*) as c FROM orders WHERE ${periodFilter}`)
      .get() as { c: number }
  ).c;

  const totalOrders = (db.prepare('SELECT COUNT(*) as c FROM orders').get() as { c: number }).c;
  const pendingOrders = (
    db
      .prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'Pending'")
      .get() as { c: number }
  ).c;
  const deliveredOrders = (
    db
      .prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'Delivered'")
      .get() as { c: number }
  ).c;
  const totalProducts = (
    db.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number }
  ).c;
  const lowStockProducts = (
    db
      .prepare(
        'SELECT COUNT(DISTINCT product_id) as c FROM product_variants WHERE stock <= 5'
      )
      .get() as { c: number }
  ).c;
  const totalCustomers = (
    db.prepare('SELECT COUNT(*) as c FROM customers').get() as { c: number }
  ).c;

  // Build daily revenue series for the last `chartDays` days
  const dailyRows = db
    .prepare(`
      SELECT date(created_at) as d, COALESCE(SUM(total_tnd), 0) as revenue, COUNT(*) as orders
      FROM orders
      WHERE ${validNonCancelled} AND date(created_at) >= date('now', 'localtime', ?)
      GROUP BY date(created_at)
    `)
    .all(`-${chartDays - 1} days`) as Array<{
    d: string;
    revenue: number;
    orders: number;
  }>;

  const dayMap = new Map(dailyRows.map((r) => [r.d, r]));
  const revenueSeries: Array<{
    label: string;
    date: string;
    revenue: number;
    orders: number;
  }> = [];

  for (let i = chartDays - 1; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const iso = dt.toISOString().slice(0, 10);
    const label = dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    const found = dayMap.get(iso);
    revenueSeries.push({
      label,
      date: iso,
      revenue: found ? found.revenue : 0,
      orders: found ? found.orders : 0,
    });
  }

  const statuses = ['Pending', 'Confirmed', 'Preparing', 'Shipped', 'Delivered', 'Cancelled'];
  const statusRows = db
    .prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status')
    .all() as Array<{ status: string; count: number }>;
  const statusMap = new Map(statusRows.map((s) => [s.status, s.count]));
  const statusBreakdown = statuses.map((status) => ({
    status,
    count: statusMap.get(status) || 0,
  }));

  res.json({
    total_revenue: totalRevenue,
    today_revenue: todayRevenue,
    weekly_revenue: weeklyRevenue,
    monthly_revenue: monthlyRevenue,
    period_revenue: periodRevenue,
    period_orders: periodOrders,
    total_orders: totalOrders,
    pending_orders: pendingOrders,
    delivered_orders: deliveredOrders,
    total_products: totalProducts,
    low_stock_products: lowStockProducts,
    total_customers: totalCustomers,
    revenue_series: revenueSeries,
    status_breakdown: statusBreakdown,
  });
});

app.get('/api/admin/products', requireAdmin, (_req, res) => {
  const rawProducts = db
    .prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON c.slug = p.category_slug
      ORDER BY p.created_at DESC, p.id DESC
    `)
    .all() as RawProductRow[];
  res.json(hydrateProducts(rawProducts));
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const body = req.body as {
    name?: string;
    slug?: string;
    brand?: string;
    category_slug?: string;
    olfactory_family?: string;
    description?: string;
    top_notes?: string;
    heart_notes?: string;
    base_notes?: string;
    images?: string[];
    is_featured?: boolean;
    is_bestseller?: boolean;
    is_new?: boolean;
    is_visible?: boolean;
    is_gift_set?: boolean;
    variants?: Array<{
      volume: string;
      price_tnd: number;
      sale_price_tnd: number | null;
      stock: number;
      sku?: string;
    }>;
  };

  if (!body.name?.trim() || !body.category_slug) {
    res.status(400).json({ error: 'Nom et catégorie requis.' });
    return;
  }

  const baseSlug = (body.slug?.trim() || body.name.trim())
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  let finalSlug = baseSlug || `parfum-${Date.now()}`;
  const existing = db.prepare('SELECT id FROM products WHERE slug = ?').get(finalSlug);
  if (existing) {
    finalSlug = `${finalSlug}-${Math.floor(100 + Math.random() * 899)}`;
  }

  const tx = db.transaction(() => {
    const info = db
      .prepare(`
        INSERT INTO products (
          slug, name, brand, category_slug, olfactory_family, description,
          top_notes, heart_notes, base_notes, images_json,
          is_featured, is_bestseller, is_new, is_visible, is_gift_set
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        finalSlug,
        body.name!.trim(),
        body.brand?.trim() || 'Zephor Parfums',
        body.category_slug!,
        body.olfactory_family?.trim() || 'Oriental',
        body.description?.trim() || '',
        body.top_notes?.trim() || '',
        body.heart_notes?.trim() || '',
        body.base_notes?.trim() || '',
        JSON.stringify(Array.isArray(body.images) ? body.images : []),
        body.is_featured ? 1 : 0,
        body.is_bestseller ? 1 : 0,
        body.is_new ? 1 : 0,
        body.is_visible !== false ? 1 : 0,
        body.is_gift_set ? 1 : 0
      );

    const productId = Number(info.lastInsertRowid);
    const variants =
      Array.isArray(body.variants) && body.variants.length > 0
        ? body.variants
        : [{ volume: '50 ml', price_tnd: 220, sale_price_tnd: null, stock: 10, sku: '' }];

    const insVar = db.prepare(
      'INSERT INTO product_variants (product_id, volume, price_tnd, sale_price_tnd, stock, sku) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const v of variants) {
      insVar.run(
        productId,
        v.volume.trim() || '50 ml',
        Number(v.price_tnd || 0),
        v.sale_price_tnd !== null && v.sale_price_tnd !== undefined && Number(v.sale_price_tnd) > 0
          ? Number(v.sale_price_tnd)
          : null,
        Math.max(0, Math.floor(Number(v.stock || 0))),
        v.sku?.trim() || `ZPH-${productId}`
      );
    }

    const row = db
      .prepare(`
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON c.slug = p.category_slug
        WHERE p.id = ?
      `)
      .get(productId) as RawProductRow;

    return hydrateProducts([row])[0];
  });

  res.status(201).json(tx());
});

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const productId = Number(req.params.id);
  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
  if (!existing) {
    res.status(404).json({ error: 'Produit introuvable.' });
    return;
  }

  const body = req.body as {
    name?: string;
    brand?: string;
    category_slug?: string;
    olfactory_family?: string;
    description?: string;
    top_notes?: string;
    heart_notes?: string;
    base_notes?: string;
    images?: string[];
    is_featured?: boolean;
    is_bestseller?: boolean;
    is_new?: boolean;
    is_visible?: boolean;
    is_gift_set?: boolean;
    variants?: Array<{
      id?: number;
      volume: string;
      price_tnd: number;
      sale_price_tnd: number | null;
      stock: number;
      sku?: string;
    }>;
  };

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE products SET
        name = ?,
        brand = ?,
        category_slug = ?,
        olfactory_family = ?,
        description = ?,
        top_notes = ?,
        heart_notes = ?,
        base_notes = ?,
        images_json = ?,
        is_featured = ?,
        is_bestseller = ?,
        is_new = ?,
        is_visible = ?,
        is_gift_set = ?
      WHERE id = ?
    `).run(
      body.name?.trim() || 'Parfum Zephor',
      body.brand?.trim() || 'Zephor Parfums',
      body.category_slug || 'parfums-unisexe',
      body.olfactory_family?.trim() || 'Oriental',
      body.description?.trim() || '',
      body.top_notes?.trim() || '',
      body.heart_notes?.trim() || '',
      body.base_notes?.trim() || '',
      JSON.stringify(Array.isArray(body.images) ? body.images : []),
      body.is_featured ? 1 : 0,
      body.is_bestseller ? 1 : 0,
      body.is_new ? 1 : 0,
      body.is_visible !== false ? 1 : 0,
      body.is_gift_set ? 1 : 0,
      productId
    );

    if (Array.isArray(body.variants) && body.variants.length > 0) {
      db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(productId);
      const insVar = db.prepare(
        'INSERT INTO product_variants (product_id, volume, price_tnd, sale_price_tnd, stock, sku) VALUES (?, ?, ?, ?, ?, ?)'
      );
      for (const v of body.variants) {
        insVar.run(
          productId,
          v.volume.trim() || '50 ml',
          Number(v.price_tnd || 0),
          v.sale_price_tnd !== null && v.sale_price_tnd !== undefined && Number(v.sale_price_tnd) > 0
            ? Number(v.sale_price_tnd)
            : null,
          Math.max(0, Math.floor(Number(v.stock || 0))),
          v.sku?.trim() || `ZPH-${productId}`
        );
      }
    }

    const row = db
      .prepare(`
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON c.slug = p.category_slug
        WHERE p.id = ?
      `)
      .get(productId) as RawProductRow;

    return hydrateProducts([row])[0];
  });

  res.json(tx());
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const productId = Number(req.params.id);
  db.prepare('DELETE FROM products WHERE id = ?').run(productId);
  res.json({ ok: true });
});

app.get('/api/admin/orders', requireAdmin, (_req, res) => {
  const orders = db
    .prepare('SELECT * FROM orders ORDER BY created_at DESC, id DESC')
    .all() as Array<Record<string, unknown>>;
  const itemsStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  res.json(
    orders.map((o) => ({
      ...o,
      items: itemsStmt.all(o.id),
    }))
  );
});

app.patch('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body as { status?: string };
  const allowed = ['Pending', 'Confirmed', 'Preparing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!status || !allowed.includes(status)) {
    res.status(400).json({ error: 'Statut invalide.' });
    return;
  }
  const orderId = Number(req.params.id);
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Record<
    string,
    unknown
  >;
  if (!updated) {
    res.status(404).json({ error: 'Commande introuvable.' });
    return;
  }
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  res.json({ ...updated, items });
});

app.get('/api/admin/customers', requireAdmin, (_req, res) => {
  const customers = db
    .prepare(`
      SELECT
        c.*,
        COUNT(o.id) as order_count,
        COALESCE(SUM(CASE WHEN o.status != 'Cancelled' THEN o.total_tnd ELSE 0 END), 0) as total_spent_tnd
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      GROUP BY c.id
      ORDER BY total_spent_tnd DESC, c.created_at DESC
    `)
    .all();
  res.json(customers);
});

app.get('/api/admin/categories', requireAdmin, (_req, res) => {
  const categories = db
    .prepare('SELECT * FROM categories ORDER BY sort_order ASC, id ASC')
    .all();
  res.json(categories);
});

app.post('/api/admin/categories', requireAdmin, (req, res) => {
  const { name, description = '', image_url = '' } = req.body as {
    name?: string;
    description?: string;
    image_url?: string;
  };
  if (!name?.trim()) {
    res.status(400).json({ error: 'Nom de catégorie requis.' });
    return;
  }
  const slug = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const maxSort = (
    db.prepare('SELECT COALESCE(MAX(sort_order), 0) as m FROM categories').get() as { m: number }
  ).m;

  const info = db
    .prepare(
      'INSERT INTO categories (slug, name, description, image_url, sort_order) VALUES (?, ?, ?, ?, ?)'
    )
    .run(slug, name.trim(), description.trim(), image_url.trim(), maxSort + 1);

  const created = db
    .prepare('SELECT * FROM categories WHERE id = ?')
    .get(Number(info.lastInsertRowid));
  res.status(201).json(created);
});

app.put('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { name, description, image_url } = req.body as {
    name?: string;
    description?: string;
    image_url?: string;
  };
  db.prepare(
    'UPDATE categories SET name = COALESCE(?, name), description = COALESCE(?, description), image_url = COALESCE(?, image_url) WHERE id = ?'
  ).run(name ?? null, description ?? null, image_url ?? null, id);
  const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.json(updated);
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const updates = req.body as Record<string, string>;
  const upsert = db.prepare(
    'INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  const tx = db.transaction(() => {
    for (const [key, val] of Object.entries(updates)) {
      if (typeof val === 'string') {
        upsert.run(key, val);
      }
    }
  });
  tx();
  res.json(getSettingsMap());
});

// =======================
// VITE / STATIC SERVING
// =======================

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zephor Parfums server listening on http://localhost:${PORT}`);
  });
}

startServer();
