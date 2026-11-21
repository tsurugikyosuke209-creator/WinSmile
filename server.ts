import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import {createServer as createViteServer} from 'vite';
import {
  AGE_GROUP_OPTIONS,
  SKILL_CATEGORY_OPTIONS,
} from './src/config/storeDefaults';
import {ALGERIAN_WILAYAS, isSafeHttpOrAssetUrl} from './src/data/wilayas';
import type {
  AgeGroup,
  AvailabilityStatus,
  DeliveryMethod,
  ItemType,
  Order,
  OrderItemSummary,
  OrderStatus,
  PaymentMethod,
  Product,
  SkillCategory,
  StoreSettings,
} from './src/types/store';
import {
  authenticateAdminPassword,
  getAdminAuthStatus,
  requireAdmin,
  setupInitialAdminPassword,
} from './server/auth';
import {readDb, saveUploadedBase64Image, UPLOADS_DIR, writeDb} from './server/db';

const PORT = 3000;

const VALID_AGE_GROUPS: AgeGroup[] = AGE_GROUP_OPTIONS;
const VALID_SKILLS: SkillCategory[] = SKILL_CATEGORY_OPTIONS;
const VALID_AVAILABILITY: AvailabilityStatus[] = ['in_stock', 'out_of_stock'];
const VALID_ITEM_TYPES: ItemType[] = ['single', 'bundle'];
const VALID_ORDER_STATUSES: OrderStatus[] = [
  'new',
  'preparing',
  'shipped',
  'completed',
];

function validateProductPayload(body: Record<string, unknown>): Omit<Product, 'id' | 'createdAt'> {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 2 || name.length > 140) {
    throw new Error('اسم اللعبة يجب أن يكون بين حرفين و140 حرفاً.');
  }

  const priceDzd = Number(body.priceDzd);
  if (!Number.isFinite(priceDzd) || priceDzd <= 0 || priceDzd > 1000000) {
    throw new Error('يرجى إدخال سعر صحيح بالدينار الجزائري.');
  }

  let originalPriceDzd: number | undefined;
  if (body.originalPriceDzd !== undefined && body.originalPriceDzd !== '' && body.originalPriceDzd !== null) {
    const parsedOrig = Number(body.originalPriceDzd);
    if (!Number.isFinite(parsedOrig) || parsedOrig <= 0) {
      throw new Error('السعر قبل الخصم غير صالح.');
    }
    originalPriceDzd = Math.round(parsedOrig);
  }

  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
  if (!isSafeHttpOrAssetUrl(imageUrl)) {
    throw new Error('يرجى إدخال رابط صورة صالح أو رفع صورة من الجهاز.');
  }

  const ageGroup = body.ageGroup as AgeGroup;
  if (!VALID_AGE_GROUPS.includes(ageGroup)) {
    throw new Error('الفئة العمرية غير صالحة.');
  }

  const skillCategory = body.skillCategory as SkillCategory;
  if (!VALID_SKILLS.includes(skillCategory)) {
    throw new Error('تصنيف المهارة غير صالح.');
  }

  const educationalBenefit =
    typeof body.educationalBenefit === 'string' ? body.educationalBenefit.trim() : '';
  if (educationalBenefit.length < 5 || educationalBenefit.length > 1200) {
    throw new Error('يرجى كتابة الفائدة التربوية للعبة (ماذا يكتسب الطفل).');
  }

  const availability = body.availability as AvailabilityStatus;
  if (!VALID_AVAILABILITY.includes(availability)) {
    throw new Error('حالة التوفر غير صالحة.');
  }

  const itemType = body.itemType as ItemType;
  if (!VALID_ITEM_TYPES.includes(itemType)) {
    throw new Error('نوع المنتج غير صالح.');
  }

  let bundleItems: string[] | undefined;
  if (itemType === 'bundle' && Array.isArray(body.bundleItems)) {
    bundleItems = body.bundleItems
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
      .slice(0, 12);
  }

  return {
    name,
    priceDzd: Math.round(priceDzd),
    originalPriceDzd,
    imageUrl,
    ageGroup,
    skillCategory,
    educationalBenefit,
    availability,
    itemType,
    bundleItems,
  };
}

function validateSettingsPayload(body: Record<string, unknown>, current: StoreSettings): StoreSettings {
  const storeName = typeof body.storeName === 'string' ? body.storeName.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const whatsapp = typeof body.whatsapp === 'string' ? body.whatsapp.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const baridiMobRip =
    typeof body.baridiMobRip === 'string' ? body.baridiMobRip.replace(/\s+/g, '') : '';
  const instagramUrl = typeof body.instagramUrl === 'string' ? body.instagramUrl.trim() : '';
  const facebookUrl = typeof body.facebookUrl === 'string' ? body.facebookUrl.trim() : '';
  const tiktokUrl = typeof body.tiktokUrl === 'string' ? body.tiktokUrl.trim() : '';
  const locationCoverage =
    typeof body.locationCoverage === 'string' ? body.locationCoverage.trim() : '';
  const freeShippingThresholdDzd = Number(
    body.freeShippingThresholdDzd ?? current.freeShippingThresholdDzd,
  );

  if (!storeName || storeName.length > 100) {
    throw new Error('يرجى إدخال اسم المتجر.');
  }
  if (!phone || !whatsapp) {
    throw new Error('يرجى إدخال رقم الهاتف والواتساب.');
  }
  if (!/^\d{20}$/.test(baridiMobRip)) {
    throw new Error('رقم حساب بريدي موب (RIP) يجب أن يتكون من 20 رقماً بالضبط.');
  }
  for (const social of [instagramUrl, facebookUrl, tiktokUrl]) {
    if (social && !isSafeHttpOrAssetUrl(social)) {
      throw new Error('أحد روابط التواصل الاجتماعي غير صالح.');
    }
  }

  return {
    storeName,
    phone,
    whatsapp,
    email,
    baridiMobRip,
    instagramUrl,
    facebookUrl,
    tiktokUrl,
    locationCoverage: locationCoverage || current.locationCoverage,
    freeShippingThresholdDzd:
      Number.isFinite(freeShippingThresholdDzd) && freeShippingThresholdDzd >= 0
        ? Math.round(freeShippingThresholdDzd)
        : current.freeShippingThresholdDzd,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({limit: '6mb'}));

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Safe confined serving of uploaded product/receipt images
  app.get('/uploads/:filename', (req, res) => {
    const filename = path.basename(req.params.filename || '');
    if (!filename || !/^[A-Za-z0-9._-]+$/.test(filename)) {
      res.status(400).end();
      return;
    }
    const targetPath = path.resolve(UPLOADS_DIR, filename);
    if (!targetPath.startsWith(UPLOADS_DIR + path.sep) || !fs.existsSync(targetPath)) {
      res.status(404).end();
      return;
    }
    res.sendFile(targetPath);
  });

  // Public storefront data
  app.get('/api/store', (_req, res) => {
    const db = readDb();
    res.json({
      products: db.products,
      settings: db.settings,
    });
  });

  // Public BaridiMob receipt upload
  app.post('/api/uploads/receipt', (req, res) => {
    try {
      const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '';
      const url = saveUploadedBase64Image(dataUrl);
      res.status(201).json({url});
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'تعذر رفع صورة الوصل.',
      });
    }
  });

  // Public order creation (authoritative pricing & safe card masking)
  app.post('/api/orders', (req, res) => {
    try {
      const body = (req.body || {}) as Record<string, unknown>;
      const customerName =
        typeof body.customerName === 'string' ? body.customerName.trim() : '';
      const customerPhone =
        typeof body.customerPhone === 'string' ? body.customerPhone.trim() : '';
      const wilayaCode =
        typeof body.wilayaCode === 'string' ? body.wilayaCode.trim() : '';
      const commune = typeof body.commune === 'string' ? body.commune.trim() : '';
      const address = typeof body.address === 'string' ? body.address.trim() : '';
      const deliveryMethod = body.deliveryMethod as DeliveryMethod;
      const shippingHubCarrier =
        body.shippingHubCarrier === 'Yalidine' || body.shippingHubCarrier === 'ZR Express'
          ? body.shippingHubCarrier
          : undefined;
      const paymentMethod = body.paymentMethod as PaymentMethod;

      if (customerName.length < 2 || customerName.length > 100) {
        res.status(400).json({error: 'يرجى إدخال الاسم الكامل.'});
        return;
      }
      const cleanDigits = customerPhone.replace(/\D/g, '');
      if (cleanDigits.length < 9 || cleanDigits.length > 15) {
        res.status(400).json({error: 'يرجى إدخال رقم هاتف جزائري صحيح.'});
        return;
      }
      const wilaya = ALGERIAN_WILAYAS.find((w) => w.code === wilayaCode);
      if (!wilaya) {
        res.status(400).json({error: 'يرجى اختيار الولاية من القائمة.'});
        return;
      }
      if (deliveryMethod !== 'home' && deliveryMethod !== 'hub') {
        res.status(400).json({error: 'يرجى اختيار طريقة التوصيل.'});
        return;
      }
      if (deliveryMethod === 'home' && address.length < 3) {
        res.status(400).json({error: 'يرجى إدخال عنوان التوصيل.'});
        return;
      }
      if (!['cod', 'card', 'baridimob'].includes(paymentMethod)) {
        res.status(400).json({error: 'طريقة الدفع غير صالحة.'});
        return;
      }

      const rawItems = Array.isArray(body.items) ? body.items : [];
      if (rawItems.length === 0) {
        res.status(400).json({error: 'سلة المشتريات فارغة.'});
        return;
      }

      const db = readDb();
      const orderItems: OrderItemSummary[] = [];
      let subtotalDzd = 0;

      for (const raw of rawItems) {
        const entry = raw as {productId?: unknown; quantity?: unknown};
        const productId = typeof entry.productId === 'string' ? entry.productId : '';
        const qty = Number(entry.quantity);
        if (!productId || !Number.isInteger(qty) || qty < 1 || qty > 50) {
          res.status(400).json({error: 'بيانات المنتجات في الطلب غير صالحة.'});
          return;
        }
        const product = db.products.find((p) => p.id === productId);
        if (!product) {
          res.status(400).json({error: 'أحد المنتجات المختارة غير موجود.'});
          return;
        }
        if (product.availability !== 'in_stock') {
          res.status(400).json({error: `المنتج "${product.name}" غير متوفر حالياً.`});
          return;
        }
        orderItems.push({
          productId: product.id,
          name: product.name,
          priceDzd: product.priceDzd,
          quantity: qty,
        });
        subtotalDzd += product.priceDzd * qty;
      }

      const threshold = db.settings.freeShippingThresholdDzd || 12000;
      const baseShipping =
        deliveryMethod === 'home' ? wilaya.homeFeeDzd : wilaya.hubFeeDzd;
      const shippingDzd = subtotalDzd >= threshold ? 0 : baseShipping;
      const totalDzd = subtotalDzd + shippingDzd;

      let cardType: 'Edahabia' | 'CIB' | undefined;
      let cardLast4: string | undefined;
      let baridiMobReference: string | undefined;
      let baridiMobReceiptUrl: string | undefined;

      if (paymentMethod === 'card') {
        const cardDigits =
          typeof body.cardNumber === 'string'
            ? body.cardNumber.replace(/\D/g, '')
            : '';
        const cardHolder =
          typeof body.cardHolder === 'string' ? body.cardHolder.trim() : '';
        const cardExpiry =
          typeof body.cardExpiry === 'string' ? body.cardExpiry.trim() : '';
        const cardCvv =
          typeof body.cardCvv === 'string' ? body.cardCvv.replace(/\D/g, '') : '';

        if (cardDigits.length !== 16) {
          res.status(400).json({error: 'رقم البطاقة البريدية / البنكية يجب أن يكون 16 رقماً.'});
          return;
        }
        if (cardHolder.length < 3) {
          res.status(400).json({error: 'يرجى إدخال اسم حامل البطاقة.'});
          return;
        }
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) {
          res.status(400).json({error: 'صيغة تاريخ الانتهاء غير صحيحة (MM/YY).'});
          return;
        }
        if (cardCvv.length < 3 || cardCvv.length > 4) {
          res.status(400).json({error: 'رمز الأمان (CVV) غير صحيح.'});
          return;
        }
        cardType = body.cardType === 'CIB' ? 'CIB' : 'Edahabia';
        cardLast4 = cardDigits.slice(-4);
      }

      if (paymentMethod === 'baridimob') {
        const ref =
          typeof body.baridiMobReference === 'string'
            ? body.baridiMobReference.trim()
            : '';
        const receipt =
          typeof body.baridiMobReceiptUrl === 'string'
            ? body.baridiMobReceiptUrl.trim()
            : '';
        if (!ref && !receipt) {
          res.status(400).json({
            error: 'يرجى إدخال مرجع التحويل أو إرفاق صورة وصل بريدي موب.',
          });
          return;
        }
        if (receipt && !isSafeHttpOrAssetUrl(receipt)) {
          res.status(400).json({error: 'رابط وصل الدفع غير صالح.'});
          return;
        }
        baridiMobReference = ref || undefined;
        baridiMobReceiptUrl = receipt || undefined;
      }

      const orderNumber = `MNT-${Math.floor(1000 + Math.random() * 9000)}`;
      const newOrder: Order = {
        id: crypto.randomUUID(),
        orderNumber,
        customerName,
        customerPhone,
        wilayaCode: wilaya.code,
        wilayaName: wilaya.nameAr,
        commune: commune || wilaya.nameAr,
        address:
          deliveryMethod === 'hub'
            ? `استلام من مكتب ${shippingHubCarrier || 'Yalidine'} - ${commune || wilaya.nameAr}`
            : address,
        deliveryMethod,
        shippingHubCarrier: deliveryMethod === 'hub' ? (shippingHubCarrier || 'Yalidine') : undefined,
        paymentMethod,
        cardType,
        cardLast4,
        baridiMobReference,
        baridiMobReceiptUrl,
        items: orderItems,
        subtotalDzd,
        shippingDzd,
        totalDzd,
        status: 'new',
        createdAt: new Date().toISOString(),
      };

      db.orders.unshift(newOrder);
      writeDb(db);
      res.status(201).json({order: newOrder});
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الطلب.',
      });
    }
  });

  // Admin auth status & login/bootstrap
  app.get('/api/admin/status', (_req, res) => {
    res.json(getAdminAuthStatus());
  });

  app.post('/api/admin/setup', (req, res) => {
    try {
      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      const token = setupInitialAdminPassword(password);
      res.status(201).json({token});
    } catch (err) {
      res.status(409).json({
        error: err instanceof Error ? err.message : 'تعذر إعداد كلمة المرور.',
      });
    }
  });

  app.post('/api/admin/login', (req, res) => {
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const token = authenticateAdminPassword(password);
    if (!token) {
      res.status(401).json({error: 'كلمة المرور غير صحيحة.'});
      return;
    }
    res.json({token});
  });

  app.get('/api/admin/verify', requireAdmin, (_req, res) => {
    res.json({valid: true});
  });

  // Protected Admin CRUD: Products
  app.post('/api/admin/upload', requireAdmin, (req, res) => {
    try {
      const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '';
      const url = saveUploadedBase64Image(dataUrl);
      res.status(201).json({url});
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'تعذر رفع صورة المنتج.',
      });
    }
  });

  app.post('/api/products', requireAdmin, (req, res) => {
    try {
      const validated = validateProductPayload((req.body || {}) as Record<string, unknown>);
      const db = readDb();
      const newProduct: Product = {
        id: `mnt-${crypto.randomUUID().slice(0, 8)}`,
        ...validated,
        createdAt: new Date().toISOString(),
      };
      db.products.unshift(newProduct);
      writeDb(db);
      res.status(201).json({product: newProduct});
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'بيانات المنتج غير مكتملة.',
      });
    }
  });

  app.put('/api/products/:id', requireAdmin, (req, res) => {
    try {
      const db = readDb();
      const index = db.products.findIndex((p) => p.id === req.params.id);
      if (index === -1) {
        res.status(404).json({error: 'المنتج غير موجود.'});
        return;
      }
      const validated = validateProductPayload((req.body || {}) as Record<string, unknown>);
      const updated: Product = {
        ...db.products[index],
        ...validated,
      };
      db.products[index] = updated;
      writeDb(db);
      res.json({product: updated});
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'تعذر تحديث بيانات المنتج.',
      });
    }
  });

  app.patch('/api/products/:id/toggle', requireAdmin, (req, res) => {
    const db = readDb();
    const product = db.products.find((p) => p.id === req.params.id);
    if (!product) {
      res.status(404).json({error: 'المنتج غير موجود.'});
      return;
    }
    product.availability =
      product.availability === 'in_stock' ? 'out_of_stock' : 'in_stock';
    writeDb(db);
    res.json({product});
  });

  app.delete('/api/products/:id', requireAdmin, (req, res) => {
    const db = readDb();
    const nextProducts = db.products.filter((p) => p.id !== req.params.id);
    if (nextProducts.length === db.products.length) {
      res.status(404).json({error: 'المنتج غير موجود.'});
      return;
    }
    db.products = nextProducts;
    writeDb(db);
    res.json({deleted: true});
  });

  // Protected Admin: Settings
  app.put('/api/settings', requireAdmin, (req, res) => {
    try {
      const db = readDb();
      const updated = validateSettingsPayload(
        (req.body || {}) as Record<string, unknown>,
        db.settings,
      );
      db.settings = updated;
      writeDb(db);
      res.json({settings: updated});
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'تعذر حفظ إعدادات المتجر.',
      });
    }
  });

  // Protected Admin: Orders
  app.get('/api/orders', requireAdmin, (_req, res) => {
    const db = readDb();
    res.json({orders: db.orders});
  });

  app.patch('/api/orders/:id/status', requireAdmin, (req, res) => {
    const status = req.body?.status as OrderStatus;
    if (!VALID_ORDER_STATUSES.includes(status)) {
      res.status(400).json({error: 'حالة الطلب غير صالحة.'});
      return;
    }
    const db = readDb();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({error: 'الطلب غير موجود.'});
      return;
    }
    order.status = status;
    writeDb(db);
    res.json({order});
  });

  // Vite dev middleware vs static production build
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Montessori DZ server listening on http://localhost:${PORT}`);
  });
}

startServer();
