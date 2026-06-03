import db from '../db/pool';
import crypto from 'crypto';

// Security helpers
function sanitizeInput(input: string, maxLength = 1000): string {
  if (typeof input !== 'string') return '';
  let s = input;
  s = s.replace(/\0/g, '');
  s = s.replace(/<[^>]*>/g, '');
  s = s.replace(/javascript\s*:/gi, '');
  s = s.replace(/data\s*:/gi, '');
  s = s.replace(/vbscript\s*:/gi, '');
  s = s.replace(/on\w+\s*=/gi, '');
  s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
  return s.trim().slice(0, maxLength);
}

function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,10}$/.test(email) && email.length <= 100 && !email.includes('..');
}

function isValidPhone(phone: string): boolean {
  if (!phone) return true;
  if (typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(\+62|62|0)[0-9]{9,13}$/.test(cleaned) && cleaned.length <= 15;
}

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

function detectMaliciousPayload(input: string): { detected: boolean; type: string } {
  if (typeof input !== 'string') return { detected: false, type: '' };
  const patterns: { name: string; regex: RegExp }[] = [
    { name: 'sql-union', regex: /\bUNION\s+(ALL\s+)?SELECT\b/gi },
    { name: 'sql-drop', regex: /\bDROP\s+(TABLE|DATABASE|INDEX)\b/gi },
    { name: 'sql-insert', regex: /\bINSERT\s+INTO\b/gi },
    { name: 'sql-exec', regex: /\b(EXEC|EXECUTE)\s*\(/gi },
    { name: 'sql-sleep', regex: /\b(SLEEP|WAITFOR|BENCHMARK|PG_SLEEP)\b/gi },
    { name: 'xss-script', regex: /<script[\s>]/gi },
    { name: 'xss-iframe', regex: /<iframe[\s>]/gi },
    { name: 'xss-event', regex: /\bon\w{2,20}\s*=/gi },
    { name: 'xss-protocol', regex: /(javascript|vbscript|data)\s*:/gi },
    { name: 'path-traversal', regex: /\.\.[\/\\]/g },
    { name: 'gambling-deface', regex: /(slot\s*(gacor|online|terpercaya)|togel|judi\s*online|casino\s*online|sbobet)/gi },
  ];
  for (const p of patterns) {
    if (p.regex.test(input)) return { detected: true, type: p.name };
  }
  return { detected: false, type: '' };
}

const ALLOWED_JENIS_PELAPOR = ['individu', 'sekolah', 'sppg'] as const;
const ALLOWED_SUBJECTS = ['informasi-program', 'pendaftaran-sekolah', 'keluhan-saran', 'kerjasama', 'lainnya'] as const;

export async function submitContact(body: Record<string, any>, ip: string, userAgent: string): Promise<{ success: boolean; message?: string; error?: string; status: number }> {
  const { name, email, phone, subject, message, _honeypot, jenis_pelapor, sppg_id, tujuan, target_id } = body;

  // Whitelist fields
  const allowedKeys = ['name', 'email', 'phone', 'subject', 'message', '_honeypot', 'jenis_pelapor', 'sppg_id', 'tujuan', 'target_id'];
  if (Object.keys(body).some(k => !allowedKeys.includes(k))) {
    return { success: false, error: 'Permintaan tidak valid', status: 400 };
  }

  // Type check
  for (const [key, val] of Object.entries(body)) {
    if (val !== undefined && val !== null && typeof val !== 'string') {
      return { success: false, error: 'Permintaan tidak valid', status: 400 };
    }
  }

  // Honeypot
  if (_honeypot && _honeypot !== '') return { success: false, error: 'Permintaan tidak valid', status: 403 };

  // Validate jenis_pelapor
  if (!jenis_pelapor || !ALLOWED_JENIS_PELAPOR.includes(jenis_pelapor)) {
    return { success: false, error: 'Jenis pelapor tidak valid', status: 400 };
  }

  // Scan for malicious payload
  const fieldsToScan = { name, email, phone, subject, message, sppg_id, tujuan };
  for (const [fieldName, fieldValue] of Object.entries(fieldsToScan)) {
    if (fieldValue && typeof fieldValue === 'string') {
      const scan = detectMaliciousPayload(fieldValue);
      if (scan.detected) {
        console.warn(`🔴 ATTACK [${scan.type}] in ${fieldName}: "${String(fieldValue).slice(0, 100)}" | IP: ${ip}`);
        return { success: false, error: 'Input mengandung konten yang tidak diizinkan', status: 400 };
      }
    }
  }

  // Field validation
  if (jenis_pelapor === 'individu' || jenis_pelapor === 'sekolah') {
    if (!name || typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 100) {
      return { success: false, error: `${jenis_pelapor === 'individu' ? 'Nama Lengkap' : 'Nama Sekolah'} harus antara 3-100 karakter`, status: 400 };
    }
    if (!/^[a-zA-Z\s\u00C0-\u024F\u1E00-\u1EFF.,'\-]+$/u.test(name.trim())) {
      return { success: false, error: 'Nama mengandung karakter yang tidak diizinkan', status: 400 };
    }
  }
  if (jenis_pelapor === 'sppg') {
    if (!sppg_id || typeof sppg_id !== 'string' || !isValidUUID(sppg_id)) {
      return { success: false, error: 'SPPG harus dipilih', status: 400 };
    }
  }
  if (!email || !isValidEmail(email)) return { success: false, error: 'Format email tidak valid', status: 400 };
  if (phone && !isValidPhone(phone)) return { success: false, error: 'Format nomor telepon tidak valid', status: 400 };
  if (!subject || !ALLOWED_SUBJECTS.includes(subject)) return { success: false, error: 'Subjek tidak valid', status: 400 };
  if (!message || typeof message !== 'string' || message.trim().length < 10 || message.length > 2000) {
    return { success: false, error: 'Pesan harus antara 10-2000 karakter', status: 400 };
  }

  // Validate optional tujuan/target_id (only allowed for individu)
  const ALLOWED_TUJUAN = ['sekolah', 'sppg'];
  const resolvedTujuan = jenis_pelapor === 'individu' && tujuan && ALLOWED_TUJUAN.includes(tujuan) ? tujuan : null;
  const resolvedTargetId = resolvedTujuan && target_id && isValidUUID(target_id) ? target_id : null;

  // Verify SPPG exists (reporter)
  if (jenis_pelapor === 'sppg' && sppg_id) {
    const { rows } = await db.query('SELECT id FROM sppgs WHERE id = $1', [sppg_id]);
    if (rows.length === 0) return { success: false, error: 'SPPG yang dipilih tidak ditemukan', status: 400 };
  }

  // Verify target entity exists
  if (resolvedTujuan === 'sekolah' && resolvedTargetId) {
    const { rows } = await db.query('SELECT id FROM schools WHERE id = $1', [resolvedTargetId]);
    if (rows.length === 0) return { success: false, error: 'Sekolah tujuan tidak ditemukan', status: 400 };
  }
  if (resolvedTujuan === 'sppg' && resolvedTargetId) {
    const { rows } = await db.query('SELECT id FROM sppgs WHERE id = $1', [resolvedTargetId]);
    if (rows.length === 0) return { success: false, error: 'SPPG tujuan tidak ditemukan', status: 400 };
  }

  // Insert
  await db.query(
    `INSERT INTO laporan_pesan (jenis_pelapor, nama, sppg_id, email, phone, subject, pesan, ip_address, user_agent, tujuan, target_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      jenis_pelapor,
      (jenis_pelapor === 'individu' || jenis_pelapor === 'sekolah') ? sanitizeInput(name, 100) : null,
      jenis_pelapor === 'sppg' ? sppg_id : null,
      sanitizeInput(email, 100),
      phone ? sanitizeInput(phone, 15) : null,
      subject,
      sanitizeInput(message, 2000),
      ip.slice(0, 45),
      userAgent.slice(0, 255),
      resolvedTujuan,
      resolvedTargetId,
    ]
  );

  return { success: true, message: 'Pesan Anda telah diterima. Kami akan merespons dalam 24 jam.', status: 200 };
}

export async function getSppgOptions() {
  const EXCLUDED = ['Dapur Pusat Tanjungsari', 'Dapur Satelit Modular Sirah Cai', 'SPPG DEMO'];
  const { rows } = await db.query(
    `SELECT id, name FROM sppgs WHERE name NOT IN ($1, $2, $3) ORDER BY name`,
    EXCLUDED
  );
  return rows;
}

export async function getSchoolOptions(q?: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const params: any[] = [];
  let whereClause = '';

  if (q && q.trim()) {
    whereClause = 'WHERE name ILIKE $1';
    params.push(`%${q.trim()}%`);
  }

  const countResult = await db.query(
    `SELECT COUNT(*) FROM schools ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  const { rows } = await db.query(
    `SELECT id, name FROM schools ${whereClause} ORDER BY name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return { rows, total, hasMore: offset + rows.length < total };
}
