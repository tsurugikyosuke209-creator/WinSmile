import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {DEFAULT_STORE_SETTINGS, INITIAL_PRODUCTS} from '../src/config/storeDefaults';
import {Order, Product, StoreSettings} from '../src/types/store';

export interface StoreDatabase {
  products: Product[];
  settings: StoreSettings;
  orders: Order[];
  adminPasswordHash: string | null;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
export const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const DB_PATH = path.resolve(DATA_DIR, 'store-db.json');

function ensureDirectories(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {recursive: true});
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, {recursive: true});
  }
}

function createInitialDb(): StoreDatabase {
  return {
    products: INITIAL_PRODUCTS,
    settings: DEFAULT_STORE_SETTINGS,
    orders: [],
    adminPasswordHash: null,
  };
}

export function readDb(): StoreDatabase {
  ensureDirectories();
  if (!fs.existsSync(DB_PATH)) {
    const initial = createInitialDb();
    writeDb(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreDatabase>;
    return {
      products: Array.isArray(parsed.products) ? parsed.products : INITIAL_PRODUCTS,
      settings: parsed.settings
        ? {...DEFAULT_STORE_SETTINGS, ...parsed.settings}
        : DEFAULT_STORE_SETTINGS,
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      adminPasswordHash:
        typeof parsed.adminPasswordHash === 'string' ? parsed.adminPasswordHash : null,
    };
  } catch {
    const fallback = createInitialDb();
    writeDb(fallback);
    return fallback;
  }
}

export function writeDb(db: StoreDatabase): void {
  ensureDirectories();
  const tmpPath = path.resolve(
    DATA_DIR,
    `store-db.${crypto.randomUUID()}.tmp`,
  );
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpPath, DB_PATH);
}

const ALLOWED_IMAGE_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024; // 3MB

export function saveUploadedBase64Image(dataUrl: string): string {
  ensureDirectories();
  const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/i.exec(
    dataUrl.trim(),
  );
  if (!match) {
    throw new Error('صيغة الصورة غير صالحة. يُسمح فقط بملفات PNG أو JPG أو WebP.');
  }
  const mime = match[1].toLowerCase();
  const ext = ALLOWED_IMAGE_MIME[mime];
  if (!ext) {
    throw new Error('نوع الملف غير مدعوم.');
  }
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0 || buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error('حجم الصورة يجب أن يكون أقل من 3 ميغابايت.');
  }
  const filename = `${crypto.randomUUID()}${ext}`;
  const targetPath = path.resolve(UPLOADS_DIR, filename);
  if (!targetPath.startsWith(UPLOADS_DIR + path.sep)) {
    throw new Error('مسار حفظ غير صالح.');
  }
  fs.writeFileSync(targetPath, buffer);
  return `/uploads/${filename}`;
}
