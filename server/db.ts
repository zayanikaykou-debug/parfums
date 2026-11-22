import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { hashPassword } from './auth.ts';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(path.join(dataDir, 'zephor.db'));
try {
  db.pragma('wal_checkpoint(TRUNCATE)');
} catch {
  // ignore if not in WAL mode
}
db.pragma('journal_mode = DELETE');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      brand TEXT NOT NULL DEFAULT 'Zephor Parfums',
      category_slug TEXT NOT NULL,
      olfactory_family TEXT NOT NULL DEFAULT 'Oriental',
      description TEXT NOT NULL DEFAULT '',
      top_notes TEXT NOT NULL DEFAULT '',
      heart_notes TEXT NOT NULL DEFAULT '',
      base_notes TEXT NOT NULL DEFAULT '',
      images_json TEXT NOT NULL DEFAULT '[]',
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_bestseller INTEGER NOT NULL DEFAULT 0,
      is_new INTEGER NOT NULL DEFAULT 0,
      is_visible INTEGER NOT NULL DEFAULT 1,
      is_gift_set INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      volume TEXT NOT NULL,
      price_tnd REAL NOT NULL,
      sale_price_tnd REAL,
      stock INTEGER NOT NULL DEFAULT 0,
      sku TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      payment_method TEXT NOT NULL DEFAULT 'Paiement à la livraison',
      subtotal_tnd REAL NOT NULL,
      shipping_tnd REAL NOT NULL DEFAULT 0,
      total_tnd REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      variant_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      volume TEXT NOT NULL,
      unit_price_tnd REAL NOT NULL,
      quantity INTEGER NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_login_attempts (
      ip TEXT PRIMARY KEY,
      failed_count INTEGER NOT NULL DEFAULT 0,
      banned_until INTEGER,
      last_attempt INTEGER NOT NULL
    );
  `);

  seedInitialData();
}

function seedInitialData(): void {
  // 1. Admin User
  const adminCount = (db.prepare('SELECT COUNT(*) as c FROM admin_users').get() as { c: number }).c;
  if (adminCount === 0) {
    db.prepare(
      'INSERT INTO admin_users (email, password_hash, name) VALUES (?, ?, ?)'
    ).run('admin', hashPassword('test123'), 'Direction Zephor');
  } else {
    db.prepare(
      'UPDATE admin_users SET email = ?, password_hash = ? WHERE email = ?'
    ).run('admin', hashPassword('test123'), 'admin@zephorparfums.tn');
  }

  // 2. Site Settings
  const defaultSettings: Record<string, string> = {
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
      "Née d'une fascination pour les matières nobles et les sillages nocturnes, Zephor Parfums compose des extraits de caractère où la profondeur du bois d'oud épouse l'éclat de l'ambre doré. Chaque création macère longuement afin de révéler une signature singulière sur la peau.",
    about_image: '/src/assets/images/atelier_savoir_faire_1795349867312.jpg',
    contact_phone: '+216 28 450 920',
    contact_whatsapp: '+21628450920',
    contact_email: 'conciergerie@zephorparfums.tn',
    contact_address: 'Les Berges du Lac II, 1053 Tunis, Tunisie',
    social_instagram: 'https://instagram.com/zephorparfums',
    social_facebook: 'https://facebook.com/zephorparfums',
    footer_copyright: '© 2026 Zephor Parfums. Tous droits réservés.',
  };

  const insertSetting = db.prepare(
    'INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)'
  );
  for (const [k, v] of Object.entries(defaultSettings)) {
    insertSetting.run(k, v);
  }

  // 3. Categories
  const catCount = (db.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number }).c;
  if (catCount === 0) {
    const insertCat = db.prepare(
      'INSERT INTO categories (slug, name, description, image_url, sort_order) VALUES (?, ?, ?, ?, ?)'
    );
    insertCat.run(
      'parfums-homme',
      'Parfums Homme',
      'Boisés sculpturaux, cuirs fumés et accords minéraux de caractère.',
      '/src/assets/images/cat_parfums_homme_1795349867456.jpg',
      1
    );
    insertCat.run(
      'parfums-femme',
      'Parfums Femme',
      'Fleurs nocturnes, ambre soyeux et élixirs d’une sensualité radieuse.',
      '/src/assets/images/cat_parfums_femme_1795349868031.jpg',
      2
    );
    insertCat.run(
      'parfums-unisexe',
      'Parfums Unisexes',
      'Créations de niche affranchies des codes, centrées sur la matière brute.',
      '/src/assets/images/cat_parfums_unisexe_1795349866882.jpg',
      3
    );
    insertCat.run(
      'collections-exclusives',
      'Collections Exclusives',
      'Extraits de parfum numérotés à haute concentration d’essences rares.',
      '/src/assets/images/cat_collections_exclusives_1795349868031.jpg',
      4
    );
    insertCat.run(
      'coffrets-cadeaux',
      'Coffrets & Cadeaux',
      'Écrins bleu nuit et dorures champagnes pensés pour l’art d’offrir.',
      '/src/assets/images/cat_coffrets_cadeaux_1795349866518.jpg',
      5
    );
  }

  // 4. Products & Variants
  const prodCount = (db.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number }).c;
  if (prodCount === 0) {
    const insertProd = db.prepare(`
      INSERT INTO products (
        slug, name, brand, category_slug, olfactory_family, description,
        top_notes, heart_notes, base_notes, images_json,
        is_featured, is_bestseller, is_new, is_visible, is_gift_set
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    const insertVariant = db.prepare(`
      INSERT INTO product_variants (product_id, volume, price_tnd, sale_price_tnd, stock, sku)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const seedProducts = [
      {
        slug: 'nocturne-absolu',
        name: 'Nocturne Absolu',
        brand: 'Zephor Parfums',
        category_slug: 'collections-exclusives',
        olfactory_family: 'Ambré Boisé',
        description:
          "Signature emblématique de la maison. Un contraste saisissant entre la fraîcheur épicée de la cardamome noire et la chaleur enveloppante de l'ambre gris et du bois d'oud vieilli.",
        top_notes: 'Cardamome Noire, Bergamote de Calabre, Poivre Rose',
        heart_notes: 'Oud du Laos, Encens Sacré, Iris Pallida',
        base_notes: 'Ambre Gris, Fève Tonka, Santal de Mysore',
        images: [
          '/src/assets/images/hero_zephor_campaign_1795349867029.jpg',
          '/src/assets/images/cat_collections_exclusives_1795349868031.jpg',
        ],
        is_featured: 1,
        is_bestseller: 1,
        is_new: 0,
        is_gift_set: 0,
        variants: [
          { volume: '50 ml', price: 320, sale: null, stock: 14, sku: 'ZPH-NOC-50' },
          { volume: '100 ml', price: 460, sale: null, stock: 9, sku: 'ZPH-NOC-100' },
        ],
      },
      {
        slug: 'cedre-souverain',
        name: 'Cèdre Souverain',
        brand: 'Zephor Parfums',
        category_slug: 'parfums-homme',
        olfactory_family: 'Boisé Aromatique',
        description:
          "Une architecture virile et raffinée. Le cèdre de l'Atlas s'y révèle ciselé par le vétiver fumé et une touche de genièvre glacé.",
        top_notes: 'Baies de Genièvre, Pamplemousse Noir, Sauge',
        heart_notes: "Cèdre de l'Atlas, Vétiver d'Haïti, Cyprès",
        base_notes: 'Cuir Souple, Mousse de Chêne, Musc Minéral',
        images: [
          '/src/assets/images/cat_parfums_homme_1795349867456.jpg',
          '/src/assets/images/prod_oud_royal_1795349866304.jpg',
        ],
        is_featured: 1,
        is_bestseller: 1,
        is_new: 0,
        is_gift_set: 0,
        variants: [
          { volume: '50 ml', price: 215, sale: null, stock: 18, sku: 'ZPH-CED-50' },
          { volume: '100 ml', price: 310, sale: 279, stock: 11, sku: 'ZPH-CED-100' },
        ],
      },
      {
        slug: 'aura-eclatante',
        name: 'Aura Éclatante',
        brand: 'Zephor Parfums',
        category_slug: 'parfums-femme',
        olfactory_family: 'Floral Ambré',
        description:
          "Un rayonnement doré sur peau nue. La fleur d'oranger de Nabeul s'unit au jasmin nocturne sur un lit de vanille bourbon et de cachemire.",
        top_notes: "Mandarine Sanguine, Néroli, Fleur d'Oranger",
        heart_notes: 'Jasmin Sambac, Tubéreuse Blanche, Miel Doré',
        base_notes: 'Vanille de Madagascar, Benjoin, Bois de Cachemire',
        images: [
          '/src/assets/images/cat_parfums_femme_1795349868031.jpg',
          '/src/assets/images/prod_iris_velours_1795349865012.jpg',
        ],
        is_featured: 1,
        is_bestseller: 1,
        is_new: 1,
        is_gift_set: 0,
        variants: [
          { volume: '30 ml', price: 175, sale: null, stock: 22, sku: 'ZPH-AUR-30' },
          { volume: '50 ml', price: 245, sale: null, stock: 16, sku: 'ZPH-AUR-50' },
          { volume: '100 ml', price: 350, sale: null, stock: 7, sku: 'ZPH-AUR-100' },
        ],
      },
      {
        slug: 'saffran-obscur',
        name: 'Safran Obscur',
        brand: 'Zephor Parfums',
        category_slug: 'parfums-unisexe',
        olfactory_family: 'Oriental Épicé',
        description:
          "Un élixir mystique à la croisée des rives méditerranéennes. Le safran rouge embrase des volutes d'oliban et de daim velouté.",
        top_notes: 'Safran Rouge, Poivre Noir, Coriandre',
        heart_notes: 'Rose de Damas, Encens Oliban, Ciste Labdanum',
        base_notes: 'Daim Velouté, Patchouli Noir, Ambre Sec',
        images: [
          '/src/assets/images/cat_parfums_unisexe_1795349866882.jpg',
          '/src/assets/images/prod_ambre_nocturne_1795349866233.jpg',
        ],
        is_featured: 1,
        is_bestseller: 0,
        is_new: 1,
        is_gift_set: 0,
        variants: [
          { volume: '50 ml', price: 265, sale: null, stock: 12, sku: 'ZPH-SAF-50' },
          { volume: '100 ml', price: 380, sale: null, stock: 4, sku: 'ZPH-SAF-100' },
        ],
      },
      {
        slug: 'ambre-orion',
        name: 'Ambre Orion',
        brand: 'Zephor Parfums',
        category_slug: 'parfums-unisexe',
        olfactory_family: 'Ambré Gourmand',
        description:
          "L'éclat d'une nuit étoilée sur le désert. Un ambre lumineux réchauffé par la praline torréfiée, la fève tonka et une pointe de rhum ambré.",
        top_notes: 'Rhum Ambré, Cannelle de Ceylan, Écorce d’Orange',
        heart_notes: 'Ambre Doré, Praline Noire, Myrrhe',
        base_notes: 'Fève Tonka, Cèdre Blanc, Vanille Fumée',
        images: [
          '/src/assets/images/prod_ambre_nocturne_1795349866233.jpg',
          '/src/assets/images/hero_zephor_campaign_1795349867029.jpg',
        ],
        is_featured: 0,
        is_bestseller: 1,
        is_new: 0,
        is_gift_set: 0,
        variants: [
          { volume: '75 ml', price: 295, sale: 255, stock: 10, sku: 'ZPH-ORI-75' },
          { volume: '100 ml', price: 370, sale: null, stock: 6, sku: 'ZPH-ORI-100' },
        ],
      },
      {
        slug: 'oud-imperial',
        name: 'Oud Impérial',
        brand: 'Zephor Parfums',
        category_slug: 'parfums-homme',
        olfactory_family: 'Boisé Cuiré',
        description:
          "Puissance et retenue. Un bois d'oud maîtrisé, poli par la bergamote fumée et adouci par des résines balsamiques d'une tenue exceptionnelle.",
        top_notes: 'Bergamote Fumée, Noix de Muscade, Élémis',
        heart_notes: 'Bois d’Oud, Cuir de Russie, Bois de Gaïac',
        base_notes: 'Vétiver Fumé, Labdanum, Ambre Gris',
        images: [
          '/src/assets/images/prod_oud_royal_1795349866304.jpg',
          '/src/assets/images/cat_parfums_homme_1795349867456.jpg',
        ],
        is_featured: 0,
        is_bestseller: 0,
        is_new: 1,
        is_gift_set: 0,
        variants: [
          { volume: '50 ml', price: 270, sale: null, stock: 8, sku: 'ZPH-OUD-50' },
          { volume: '100 ml', price: 395, sale: null, stock: 3, sku: 'ZPH-OUD-100' },
        ],
      },
      {
        slug: 'iris-de-minuit',
        name: 'Iris de Minuit',
        brand: 'Zephor Parfums',
        category_slug: 'parfums-femme',
        olfactory_family: 'Floral Poudré',
        description:
          "Une élégance parisienne chuchotée. Beurre d'iris florentin, pétales de rose centifolia et muscs blancs nacrés.",
        top_notes: 'Poire Blanche, Graine d’Ambrette, Bergamote',
        heart_notes: 'Beurre d’Iris, Rose Centifolia, Violette',
        base_notes: 'Muscs Nacrés, Bois de Santal, Ambre Blanc',
        images: [
          '/src/assets/images/prod_iris_velours_1795349865012.jpg',
          '/src/assets/images/cat_parfums_femme_1795349868031.jpg',
        ],
        is_featured: 0,
        is_bestseller: 0,
        is_new: 1,
        is_gift_set: 0,
        variants: [
          { volume: '50 ml', price: 230, sale: null, stock: 15, sku: 'ZPH-IRI-50' },
          { volume: '100 ml', price: 335, sale: 299, stock: 8, sku: 'ZPH-IRI-100' },
        ],
      },
      {
        slug: 'extrait-maison-noir',
        name: 'Extrait Maison Noir',
        brand: 'Zephor Haute Collection',
        category_slug: 'collections-exclusives',
        olfactory_family: 'Oriental Extrait',
        description:
          "Concentré à 35% d'huiles pures. Une pièce de collection en édition limitée mariant l'oud cambodgien, la truffe noire et l'ambre liquide.",
        top_notes: 'Cassis Noir, Safran Impérial, Bergamote',
        heart_notes: 'Oud Cambodgien, Rose Noire, Truffe',
        base_notes: 'Ambre Liquide, Patchouli Vieilli, Vanille Noire',
        images: [
          '/src/assets/images/cat_collections_exclusives_1795349868031.jpg',
          '/src/assets/images/hero_zephor_campaign_1795349867029.jpg',
        ],
        is_featured: 1,
        is_bestseller: 0,
        is_new: 1,
        is_gift_set: 0,
        variants: [
          { volume: '100 ml', price: 540, sale: null, stock: 5, sku: 'ZPH-EXT-100' },
        ],
      },
      {
        slug: 'coffret-prestige-nocturne',
        name: 'Coffret Prestige Nocturne',
        brand: 'Zephor Parfums',
        category_slug: 'coffrets-cadeaux',
        olfactory_family: 'Coffret Découverte & Signature',
        description:
          "L'écrin d'exception gainé de lin bleu nuit et finitions champagne. Réunit le flacon 100 ml de votre choix, un vaporisateur de voyage doré 15 ml et une miniature collection 10 ml.",
        top_notes: 'Assortiment Signature Zephor',
        heart_notes: 'Flacon 100 ml + Vaporisateur Voyage 15 ml',
        base_notes: 'Miniature Collection 10 ml incluse',
        images: [
          '/src/assets/images/cat_coffrets_cadeaux_1795349866518.jpg',
          '/src/assets/images/hero_zephor_campaign_1795349867029.jpg',
        ],
        is_featured: 1,
        is_bestseller: 1,
        is_new: 0,
        is_gift_set: 1,
        variants: [
          { volume: 'Coffret 3 Pièces', price: 490, sale: 440, stock: 7, sku: 'ZPH-COF-01' },
        ],
      },
    ];

    for (const p of seedProducts) {
      const info = insertProd.run(
        p.slug,
        p.name,
        p.brand,
        p.category_slug,
        p.olfactory_family,
        p.description,
        p.top_notes,
        p.heart_notes,
        p.base_notes,
        JSON.stringify(p.images),
        p.is_featured,
        p.is_bestseller,
        p.is_new,
        p.is_gift_set
      );
      const productId = Number(info.lastInsertRowid);
      for (const v of p.variants) {
        insertVariant.run(productId, v.volume, v.price, v.sale, v.stock, v.sku);
      }
    }
  }

  // 5. Ensure Realistic Arabic/Tunisian Example Orders exist (fresh DB, hosted DB, or legacy migration)
  const legacySample = db
    .prepare("SELECT id FROM orders WHERE order_number = 'ZPH-2026-1001' AND customer_name = 'Yasmine Ben Salem'")
    .get() as { id: number } | undefined;

  if (legacySample) {
    const arabicUpdates = [
      {
        num: 'ZPH-2026-1001',
        oldPhone: '+216 54 210 881',
        name: 'نور الهدى بن سالم',
        city: 'المرسى، تونس',
        address: '14 نهج الياسمين، حي الرياض، المرسى',
        note: 'تغليف هدية فاخر من فضلكم',
      },
      {
        num: 'ZPH-2026-1002',
        oldPhone: '+216 22 781 304',
        name: 'أحمد الطرابلسي',
        city: 'حمام سوسة، سوسة',
        address: 'شارع الهادي شاكر، إقامة النخيل، حمام سوسة',
        note: '',
      },
      {
        num: 'ZPH-2026-1003',
        oldPhone: '+216 98 441 092',
        name: 'مريم الغربي',
        city: 'بنزرت الشمالية، بنزرت',
        address: '7 شارع الحبيب بورقيبة، الكورنيش، بنزرت',
        note: 'الاتصال قبل التوصيل بنصف ساعة',
      },
      {
        num: 'ZPH-2026-1004',
        oldPhone: '+216 55 119 640',
        name: 'ياسين المنصوري',
        city: 'صفاقس المدينة، صفاقس',
        address: 'طريق تونس كلم 3، حي الحبيب، صفاقس',
        note: '',
      },
      {
        num: 'ZPH-2026-1005',
        oldPhone: '+216 29 880 112',
        name: 'آمنة الخليفي',
        city: 'باجة الشمالية، باجة',
        address: '22 نهج الاستقلال، وسط المدينة، باجة',
        note: 'توصيل في الفترة الصباحية',
      },
      {
        num: 'ZPH-2026-1006',
        oldPhone: '+216 50 314 770',
        name: 'سيف الدين البوعزيزي',
        city: 'الحمامات، نابل',
        address: 'إقامة الزيتونة، الحمامات الشمالية، نابل',
        note: 'التوصيل بعد الساعة 17:00',
      },
    ];
    for (const u of arabicUpdates) {
      db.prepare(
        'UPDATE orders SET customer_name = ?, city = ?, address = ?, note = ?, email = ? WHERE order_number = ?'
      ).run(u.name, u.city, u.address, u.note, '', u.num);
      db.prepare(
        'UPDATE customers SET full_name = ?, city = ?, address = ?, email = ? WHERE phone = ?'
      ).run(u.name, u.city, u.address, '', u.oldPhone);
    }
  }

  const hasSampleOrders = (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM orders WHERE order_number IN (
          'ZPH-2026-1001', 'ZPH-2026-1002', 'ZPH-2026-1003',
          'ZPH-2026-1004', 'ZPH-2026-1005', 'ZPH-2026-1006', 'ZPH-2026-1007'
        )`
      )
      .get() as { c: number }
  ).c;

  if (hasSampleOrders === 0) {
    const insertCust = db.prepare(
      'INSERT INTO customers (full_name, phone, email, city, address, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const insertOrd = db.prepare(`
      INSERT INTO orders (
        order_number, customer_id, customer_name, phone, email, city, address,
        note, payment_method, subtotal_tnd, shipping_tnd, total_tnd, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Paiement à la livraison', ?, ?, ?, ?, ?)
    `);
    const insertItem = db.prepare(`
      INSERT INTO order_items (
        order_id, product_id, variant_id, product_name, volume, unit_price_tnd, quantity, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const resolveProductRef = (slug: string, volume: string) => {
      const prod = db
        .prepare('SELECT id, name, images_json FROM products WHERE slug = ? LIMIT 1')
        .get(slug) as { id: number; name: string; images_json: string } | undefined;
      const fallbackProd =
        prod ||
        (db
          .prepare('SELECT id, name, images_json FROM products ORDER BY id ASC LIMIT 1')
          .get() as { id: number; name: string; images_json: string } | undefined);
      if (!fallbackProd) {
        return { prodId: 1, varId: 1 };
      }
      const variant = db
        .prepare('SELECT id FROM product_variants WHERE product_id = ? AND volume = ? LIMIT 1')
        .get(fallbackProd.id, volume) as { id: number } | undefined;
      const fallbackVariant =
        variant ||
        (db
          .prepare('SELECT id FROM product_variants WHERE product_id = ? ORDER BY id ASC LIMIT 1')
          .get(fallbackProd.id) as { id: number } | undefined);
      return {
        prodId: fallbackProd.id,
        varId: fallbackVariant ? fallbackVariant.id : 1,
      };
    };

    const daysAgoIso = (days: number, hour = 14) => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      d.setHours(hour, 25, 0, 0);
      return d.toISOString().slice(0, 19).replace('T', ' ');
    };

    const sampleOrders = [
      {
        num: 'ZPH-2026-1001',
        name: 'نور الهدى بن سالم',
        phone: '+216 54 210 881',
        email: '',
        city: 'المرسى، تونس',
        address: '14 نهج الياسمين، حي الرياض، المرسى',
        note: 'تغليف هدية فاخر من فضلكم',
        status: 'Delivered',
        created_at: daysAgoIso(12, 11),
        items: [{ slug: 'aura-eclatante', name: 'Aura Éclatante', vol: '50 ml', price: 245, qty: 1, img: '/src/assets/images/cat_parfums_femme_1795349868031.jpg' }],
      },
      {
        num: 'ZPH-2026-1002',
        name: 'أحمد الطرابلسي',
        phone: '+216 22 781 304',
        email: '',
        city: 'حمام سوسة، سوسة',
        address: 'شارع الهادي شاكر، إقامة النخيل، حمام سوسة',
        note: '',
        status: 'Delivered',
        created_at: daysAgoIso(8, 16),
        items: [{ slug: 'nocturne-absolu', name: 'Nocturne Absolu', vol: '100 ml', price: 460, qty: 1, img: '/src/assets/images/hero_zephor_campaign_1795349867029.jpg' }],
      },
      {
        num: 'ZPH-2026-1003',
        name: 'مريم الغربي',
        phone: '+216 98 441 092',
        email: '',
        city: 'بنزرت الشمالية، بنزرت',
        address: '7 شارع الحبيب بورقيبة، الكورنيش، بنزرت',
        note: 'الاتصال قبل التوصيل بنصف ساعة',
        status: 'Delivered',
        created_at: daysAgoIso(4, 15),
        items: [{ slug: 'coffret-prestige-nocturne', name: 'Coffret Prestige Nocturne', vol: 'Coffret 3 Pièces', price: 440, qty: 1, img: '/src/assets/images/cat_coffrets_cadeaux_1795349866518.jpg' }],
      },
      {
        num: 'ZPH-2026-1004',
        name: 'ياسين المنصوري',
        phone: '+216 55 119 640',
        email: '',
        city: 'صفاقس المدينة، صفاقس',
        address: 'طريق تونس كلم 3، حي الحبيب، صفاقس',
        note: '',
        status: 'Shipped',
        created_at: daysAgoIso(2, 10),
        items: [{ slug: 'cedre-souverain', name: 'Cèdre Souverain', vol: '100 ml', price: 279, qty: 1, img: '/src/assets/images/cat_parfums_homme_1795349867456.jpg' }],
      },
      {
        num: 'ZPH-2026-1005',
        name: 'آمنة الخليفي',
        phone: '+216 29 880 112',
        email: '',
        city: 'باجة الشمالية، باجة',
        address: '22 نهج الاستقلال، وسط المدينة، باجة',
        note: 'توصيل في الفترة الصباحية',
        status: 'Preparing',
        created_at: daysAgoIso(1, 17),
        items: [{ slug: 'saffran-obscur', name: 'Safran Obscur', vol: '50 ml', price: 265, qty: 2, img: '/src/assets/images/cat_parfums_unisexe_1795349866882.jpg' }],
      },
      {
        num: 'ZPH-2026-1006',
        name: 'سيف الدين البوعزيزي',
        phone: '+216 50 314 770',
        email: '',
        city: 'الحمامات، نابل',
        address: 'إقامة الزيتونة، الحمامات الشمالية، نابل',
        note: 'التوصيل بعد الساعة 17:00',
        status: 'Confirmed',
        created_at: daysAgoIso(0, 9),
        items: [{ slug: 'ambre-orion', name: 'Ambre Orion', vol: '75 ml', price: 255, qty: 1, img: '/src/assets/images/prod_ambre_nocturne_1795349866233.jpg' }],
      },
      {
        num: 'ZPH-2026-1007',
        name: 'فاطمة الزهراء العياري',
        phone: '+216 24 609 518',
        email: '',
        city: 'النصر، أريانة',
        address: 'شارع الهادي نويرة، النصر 2، أريانة',
        note: 'كتابة بطاقة إهداء باسم سلمى',
        status: 'Pending',
        created_at: daysAgoIso(0, 13),
        items: [{ slug: 'extrait-maison-noir', name: 'Extrait Maison Noir', vol: '100 ml', price: 540, qty: 1, img: '/src/assets/images/cat_collections_exclusives_1795349868031.jpg' }],
      },
    ];

    for (const o of sampleOrders) {
      const custRes = insertCust.run(o.name, o.phone, o.email, o.city, o.address, o.created_at);
      const custId = Number(custRes.lastInsertRowid);
      const subtotal = o.items.reduce((s, it) => s + it.price * it.qty, 0);
      const shipping = subtotal >= 250 ? 0 : 8;
      const total = subtotal + shipping;
      const ordRes = insertOrd.run(
        o.num,
        custId,
        o.name,
        o.phone,
        o.email,
        o.city,
        o.address,
        o.note,
        subtotal,
        shipping,
        total,
        o.status,
        o.created_at
      );
      const orderId = Number(ordRes.lastInsertRowid);
      for (const it of o.items) {
        const ref = resolveProductRef(it.slug, it.vol);
        insertItem.run(orderId, ref.prodId, ref.varId, it.name, it.vol, it.price, it.qty, it.img);
      }
    }
  }
}
