import crypto from 'node:crypto';
import type {NextFunction, Request, Response} from 'express';
import {readDb, writeDb} from './db';

const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPasswordHash(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = crypto.scryptSync(password, salt, 64);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

function verifyEnvPassword(candidate: string, envPassword: string): boolean {
  const candidateDigest = crypto.createHash('sha256').update(candidate).digest();
  const envDigest = crypto.createHash('sha256').update(envPassword).digest();
  return crypto.timingSafeEqual(candidateDigest, envDigest);
}

export function getAdminAuthStatus(): {configured: boolean; envManaged: boolean} {
  const envPassword = (process.env.ADMIN_PASSWORD || '').trim();
  if (envPassword.length > 0) {
    return {configured: true, envManaged: true};
  }
  const db = readDb();
  return {
    configured: Boolean(db.adminPasswordHash),
    envManaged: false,
  };
}

export function setupInitialAdminPassword(password: string): string {
  const status = getAdminAuthStatus();
  if (status.configured) {
    throw new Error('تم تعيين كلمة مرور الإدارة مسبقاً.');
  }
  if (password.trim().length < 4) {
    throw new Error('يجب أن تتكون كلمة المرور من 4 أحرف على الأقل.');
  }
  const db = readDb();
  db.adminPasswordHash = hashPassword(password.trim());
  writeDb(db);
  return issueAdminToken();
}

export function authenticateAdminPassword(password: string): string | null {
  const trimmed = password.trim();
  if (!trimmed) return null;

  const envPassword = (process.env.ADMIN_PASSWORD || '').trim();
  if (envPassword.length > 0) {
    return verifyEnvPassword(trimmed, envPassword) ? issueAdminToken() : null;
  }

  const db = readDb();
  if (!db.adminPasswordHash) return null;
  return verifyPasswordHash(trimmed, db.adminPasswordHash)
    ? issueAdminToken()
    : null;
}

export function issueAdminToken(): string {
  const payloadObj = {
    role: 'seller_admin',
    exp: Date.now() + TOKEN_TTL_MS,
    nonce: crypto.randomBytes(8).toString('hex'),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString(
    'base64url',
  );
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifyAdminToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return false;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8'),
    ) as {role?: string; exp?: number};
    return (
      parsed.role === 'seller_admin' &&
      typeof parsed.exp === 'number' &&
      parsed.exp > Date.now()
    );
  } catch {
    return false;
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({error: 'غير مصرح لك. يرجى تسجيل الدخول للإدارة.'});
    return;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!verifyAdminToken(token)) {
    res.status(401).json({error: 'انتهت صلاحية جلسة الإدارة. يرجى إعادة الدخول.'});
    return;
  }
  next();
}
