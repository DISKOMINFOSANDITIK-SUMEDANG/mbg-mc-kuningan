import db from '../../db/pool';
import { normalizeS3UrlForStorage, presignFields, presignUrl } from '../../lib/s3';

const ALLOWED_SPPG_TYPES = ['Dapur Satelit Modular', 'Dapur Konvensional', 'Dapur Pusat'];
const EXCLUDED_SPPG_NAMES = ['Dapur Pusat Tanjungsari', 'Dapur Satelit Modular Sirah Cai', 'SPPG DEMO'];

export async function listSppgs(query: { q?: string; page?: number; limit?: number }) {
  const page = query.page || 1;
  const limit = query.limit || 50;
  const offset = (page - 1) * limit;
  const params: any[] = [];
  let paramIdx = 1;
  let whereClause = 'WHERE 1=1';

  if (query.q) {
    whereClause += ` AND (s.name ILIKE $${paramIdx} OR s.location ILIKE $${paramIdx} OR s.type ILIKE $${paramIdx})`;
    params.push(`%${query.q}%`);
    paramIdx++;
  }

  const countResult = await db.query(`SELECT COUNT(*) FROM sppgs s ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count);

  const { rows } = await db.query(
    `SELECT s.*,
            sc_stats.school_cnt as school_count,
            sc_stats.student_sum as beneficiary_count,
            f.name as foundation_name
     FROM sppgs s
     LEFT JOIN foundation f ON f.id = s.foundation_id
     LEFT JOIN LATERAL (
       SELECT COUNT(*) as school_cnt, COALESCE(SUM(student_count), 0) as student_sum
       FROM schools sc WHERE sc.sppg_id = s.id
     ) sc_stats ON true
     ${whereClause}
     ORDER BY s.created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  return { sppgs: rows, total, page, limit };
}

export async function getSppgById(id: string) {
  const { rows } = await db.query(
    `SELECT s.* FROM sppgs s WHERE s.id = $1`, [id]
  );
  if (!rows[0]) return null;

  const sppg = rows[0];

  // Get related data
  const [schoolsResult, facilitiesResult, nutritionistResult] = await Promise.all([
    db.query(`SELECT id, name, address FROM schools WHERE sppg_id = $1`, [id]),
    db.query(`SELECT id, facility_name FROM sppg_facilities WHERE sppg_id = $1`, [id]),
    db.query(`SELECT id, name, qualification, experience, photo_url FROM nutritionists WHERE sppg_id = $1`, [id]),
  ]);

  sppg.schools = schoolsResult.rows;
  sppg.sppg_facilities = facilitiesResult.rows;
  sppg.nutritionists = await presignFields(nutritionistResult.rows, ['photo_url']);

  // Presign kitchen_photo_url on sppg itself
  if (sppg.kitchen_photo_url) {
    sppg.kitchen_photo_url = await presignUrl(sppg.kitchen_photo_url);
  }

  return sppg;
}

export async function createSppg(data: Record<string, any>) {
  const { id_sppg, name, type, location, latitude, longitude, capacity, phone, email, address,
    operating_hours_start, operating_hours_end, foundation_id, is_active } = data;

  const errors: Record<string, string> = {};
  if (!id_sppg) errors.id_sppg = 'ID SPPG wajib diisi';
  if (!name) errors.name = 'Nama wajib diisi';
  if (!type) errors.type = 'Tipe wajib diisi';
  if (!location) errors.location = 'Lokasi wajib diisi';
  if (type && !ALLOWED_SPPG_TYPES.includes(type)) errors.type = `Tipe harus salah satu dari: ${ALLOWED_SPPG_TYPES.join(', ')}`;

  if (Object.keys(errors).length > 0) throw { status: 400, message: 'Validation failed', errors };

  // Check uniqueness of id_sppg
  const { rows: existCheck } = await db.query('SELECT id FROM sppgs WHERE id_sppg = $1', [String(id_sppg).trim()]);
  if (existCheck.length > 0) throw { status: 400, message: 'ID SPPG sudah digunakan', errors: { id_sppg: 'ID SPPG sudah digunakan' } };

  let parsedCapacity = null;
  if (capacity !== undefined && capacity !== null && capacity !== '') {
    parsedCapacity = Number(capacity);
    if (Number.isNaN(parsedCapacity) || parsedCapacity <= 0) throw { status: 400, message: 'Kapasitas harus berupa angka positif' };
  }

  const parsedIsActive = typeof is_active === 'boolean' ? is_active : true;

  const { rows } = await db.query(
    `INSERT INTO sppgs (id_sppg, name, type, location, latitude, longitude, capacity, phone, email, address,
       operating_hours_start, operating_hours_end, foundation_id, is_active, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, NOW(), NOW())
     RETURNING *`,
    [String(id_sppg).trim(), String(name).trim(), String(type).trim(), String(location).trim(),
     latitude ? parseFloat(latitude) : null, longitude ? parseFloat(longitude) : null,
     parsedCapacity, phone || null, email || null, address || null,
     operating_hours_start || null, operating_hours_end || null, foundation_id || null, parsedIsActive]
  );
  return rows[0];
}

export async function updateSppg(id: string, data: Record<string, any>) {
  const { id_sppg, name, type, location, latitude, longitude, capacity, phone, email, address,
    operating_hours_start, operating_hours_end, foundation_id, is_active } = data;

  if (!id_sppg || !name || !type || !location) {
    throw { status: 400, message: 'ID SPPG, name, type, and location are required' };
  }

  if (String(id_sppg).trim().length > 50) {
    throw { status: 400, message: 'ID SPPG tidak boleh lebih dari 50 karakter' };
  }

  // Check uniqueness excluding current record
  const { rows: existCheck } = await db.query(
    'SELECT id FROM sppgs WHERE id_sppg = $1 AND id != $2', [String(id_sppg).trim(), id]
  );
  if (existCheck.length > 0) {
    throw { status: 400, message: 'ID SPPG sudah digunakan oleh SPPG lain', details: { id_sppg: 'ID SPPG sudah digunakan oleh SPPG lain' } };
  }

  let parsedCapacity = null;
  if (capacity !== undefined && capacity !== null && capacity !== '') {
    parsedCapacity = Number(capacity);
    if (Number.isNaN(parsedCapacity) || parsedCapacity <= 0) {
      throw { status: 400, message: 'Kapasitas harus berupa angka positif lebih dari 0' };
    }
  }

  const parsedIsActive = typeof is_active === 'boolean' ? is_active : null;

  const { rows } = await db.query(
    `UPDATE sppgs SET id_sppg=$2, name=$3, type=$4, location=$5, latitude=$6, longitude=$7,
       capacity=$8, phone=$9, email=$10, address=$11, operating_hours_start=$12,
       operating_hours_end=$13, foundation_id=$14, is_active=COALESCE($15, is_active), updated_at=NOW()
     WHERE id = $1 RETURNING *`,
    [id, String(id_sppg).trim(), String(name).trim(), String(type).trim(), String(location).trim(),
     latitude ? parseFloat(latitude) : null, longitude ? parseFloat(longitude) : null,
     parsedCapacity, phone || null, email || null, address || null,
     operating_hours_start || null, operating_hours_end || null, foundation_id || null, parsedIsActive]
  );

  if (!rows[0]) return null;
  return getSppgById(id);
}

export async function deleteSppg(id: string) {
  await db.query('DELETE FROM sppgs WHERE id = $1', [id]);
}

// --- Search ---
export async function searchSppgs(q: string) {
  if (!q || q.trim().length < 2) {
    const { rows } = await db.query(
      `SELECT id, name, type, location FROM sppgs WHERE name != 'SPPG DEMO' ORDER BY name LIMIT 10`
    );
    return rows.map(s => ({ value: s.id, label: s.name, description: `${s.type} - ${s.location}` }));
  }

  const { rows } = await db.query(`SELECT id, name, type, location FROM sppgs WHERE name != 'SPPG DEMO'`);
  const searchTerms = q.toLowerCase().trim().split(/\s+/);

  const scored = rows.map((sppg: any) => {
    let score = 0;
    let matchedTerms = 0;
    const sName = sppg.name.toLowerCase();
    const sType = sppg.type.toLowerCase();
    const sLoc = sppg.location.toLowerCase();
    const full = `${sName} ${sType} ${sLoc}`;
    const nameWords = sName.split(/\s+/);

    if (sName === q.toLowerCase()) score += 1000;
    if (full.includes(q.toLowerCase())) score += 200;

    searchTerms.forEach((term: string) => {
      let matched = false;
      if (nameWords.some((w: string) => w === term)) { score += 150; matched = true; }
      else if (nameWords.some((w: string) => w.startsWith(term) || w.includes(term))) { score += 100; matched = true; }
      else if (sName.includes(term)) { score += 60; matched = true; }
      else if (sType.includes(term)) { score += 40; matched = true; }
      else if (sLoc.includes(term)) { score += 35; matched = true; }
      if (matched) matchedTerms++;
    });

    const pct = matchedTerms / searchTerms.length;
    if (pct === 1) score += 100;
    else if (pct >= 0.8) score += 50;

    return { ...sppg, score, matchedTerms };
  });

  const minPct = searchTerms.length <= 2 ? 0.5 : 0.6;
  return scored
    .filter((s: any) => s.score > 0 && (s.matchedTerms / searchTerms.length) >= minPct)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 10)
    .map((s: any) => ({ value: s.id, label: s.name, description: `${s.type} - ${s.location}` }));
}

// --- Options (lightweight) ---
export async function getSppgOptions() {
  const { rows } = await db.query(
    `SELECT id, name, type, location FROM sppgs WHERE name NOT IN ('SPPG DEMO') ORDER BY name`
  );
  return rows;
}

// --- Nutritionist ---
export async function getNutritionist(sppgId: string) {
  const { rows } = await db.query(`SELECT * FROM nutritionists WHERE sppg_id = $1`, [sppgId]);
  if (!rows[0]) return null;
  const [presigned] = await presignFields([rows[0]], ['photo_url']);
  return presigned;
}

export async function createNutritionist(sppgId: string, data: Record<string, any>) {
  const { name, qualification, experience, photo_url } = data;
  if (!name || !qualification) throw { status: 400, message: 'Name and qualification are required' };
  const normalizedPhotoUrl = normalizeS3UrlForStorage(photo_url || null);

  const { rows } = await db.query(
    `INSERT INTO nutritionists (name, qualification, experience, photo_url, sppg_id, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5, NOW(), NOW()) RETURNING *`,
    [name, qualification, experience || null, normalizedPhotoUrl, sppgId]
  );
  return rows[0];
}

export async function updateNutritionist(sppgId: string, data: Record<string, any>) {
  const { name, qualification, experience, photo_url } = data;
  if (!name || !qualification) throw { status: 400, message: 'Name and qualification are required' };
  const normalizedPhotoUrl = normalizeS3UrlForStorage(photo_url || null);

  const { rows } = await db.query(
    `UPDATE nutritionists SET name=$2, qualification=$3, experience=$4, photo_url=$5, updated_at=NOW()
     WHERE sppg_id = $1 RETURNING *`,
    [sppgId, name, qualification, experience || null, normalizedPhotoUrl]
  );
  return rows[0] || null;
}

export async function deleteNutritionist(sppgId: string) {
  const result = await db.query(`DELETE FROM nutritionists WHERE sppg_id = $1`, [sppgId]);
  if (result.rowCount === 0) {
    throw { status: 404, message: 'Nutritionist not found' };
  }
}

// --- Facilities ---
export async function getFacilities(sppgId: string) {
  const { rows } = await db.query(`SELECT * FROM sppg_facilities WHERE sppg_id = $1`, [sppgId]);
  return rows;
}

export async function createFacility(sppgId: string, data: { facility_name: string }) {
  if (!data.facility_name) throw { status: 400, message: 'Facility name is required' };
  const { rows } = await db.query(
    `INSERT INTO sppg_facilities (facility_name, sppg_id, created_at) VALUES ($1, $2, NOW()) RETURNING *`,
    [data.facility_name, sppgId]
  );
  return rows[0];
}

export async function updateFacility(sppgId: string, facilityId: string, data: { facility_name: string }) {
  if (!data.facility_name) throw { status: 400, message: 'Facility name is required' };
  const { rows } = await db.query(
    `UPDATE sppg_facilities SET facility_name = $3 WHERE id = $1 AND sppg_id = $2 RETURNING *`,
    [facilityId, sppgId, data.facility_name]
  );
  return rows[0] || null;
}

export async function deleteFacility(sppgId: string, facilityId: string) {
  await db.query(`DELETE FROM sppg_facilities WHERE id = $1 AND sppg_id = $2`, [facilityId, sppgId]);
}

// --- Kitchen Photos ---
export async function getKitchenPhotos(sppgId: string) {
  const { rows } = await db.query(
    `SELECT * FROM sppg_kitchen_photos WHERE sppg_id = $1 ORDER BY display_order`, [sppgId]
  );
  return presignFields(rows, ['photo_url']);
}

export async function createKitchenPhoto(sppgId: string, data: Record<string, any>) {
  const { photo_url, caption, display_order } = data;
  if (!photo_url) throw { status: 400, message: 'Photo URL is required' };
  const { rows } = await db.query(
    `INSERT INTO sppg_kitchen_photos (photo_url, caption, display_order, sppg_id, created_at, updated_at)
     VALUES ($1,$2,$3,$4, NOW(), NOW()) RETURNING *`,
    [photo_url, caption || null, display_order || 0, sppgId]
  );
  return rows[0];
}

export async function updateKitchenPhotos(sppgId: string, photos: Array<{ id: string; caption?: string; display_order?: number }>) {
  for (const photo of photos) {
    await db.query(
      `UPDATE sppg_kitchen_photos SET caption = $3, display_order = $4, updated_at = NOW()
       WHERE id = $1 AND sppg_id = $2`,
      [photo.id, sppgId, photo.caption || null, photo.display_order || 0]
    );
  }
}

export async function updateKitchenPhoto(sppgId: string, photoId: string, data: Record<string, any>) {
  const fields: string[] = ['updated_at = NOW()'];
  const params: any[] = [photoId, sppgId];
  let idx = 3;

  if (data.photo_url !== undefined) { fields.push(`photo_url = $${idx++}`); params.push(data.photo_url); }
  if (data.caption !== undefined) { fields.push(`caption = $${idx++}`); params.push(data.caption); }
  if (data.display_order !== undefined) { fields.push(`display_order = $${idx++}`); params.push(data.display_order); }

  const { rows } = await db.query(
    `UPDATE sppg_kitchen_photos SET ${fields.join(', ')} WHERE id = $1 AND sppg_id = $2 RETURNING *`,
    params
  );
  return rows[0] || null;
}

export async function deleteKitchenPhoto(sppgId: string, photoId: string) {
  await db.query(`DELETE FROM sppg_kitchen_photos WHERE id = $1 AND sppg_id = $2`, [photoId, sppgId]);
}

// --- SLHS Certificate ---
export async function getSlhsCertificate(sppgId: string) {
  const { rows } = await db.query(`SELECT * FROM slhs_certificates WHERE sppg_id = $1`, [sppgId]);
  if (!rows[0]) return null;
  const [presigned] = await presignFields([rows[0]], ['file_url']);
  return presigned;
}

export async function createSlhsCertificate(sppgId: string, data: Record<string, any>) {
  const { certificate_number, file_url, issue_date, expiry_date } = data;
  if (!certificate_number || !issue_date || !expiry_date) {
    throw { status: 400, message: 'Certificate number, issue date, and expiry date are required' };
  }
  const { rows } = await db.query(
    `INSERT INTO slhs_certificates (certificate_number, file_url, issue_date, expiry_date, sppg_id, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5, NOW(), NOW()) RETURNING *`,
    [certificate_number, file_url || null, issue_date, expiry_date, sppgId]
  );
  return rows[0];
}

export async function updateSlhsCertificate(sppgId: string, data: Record<string, any>) {
  const { certificate_number, file_url, issue_date, expiry_date } = data;
  if (!certificate_number || !issue_date || !expiry_date) {
    throw { status: 400, message: 'Certificate number, issue date, and expiry date are required' };
  }
  const { rows } = await db.query(
    `UPDATE slhs_certificates SET certificate_number=$2, file_url=$3, issue_date=$4, expiry_date=$5, updated_at=NOW()
     WHERE sppg_id = $1 RETURNING *`,
    [sppgId, certificate_number, file_url || null, issue_date, expiry_date]
  );
  return rows[0] || null;
}

// --- SPPG Schools ---
export async function getSppgSchools(sppgId: string) {
  const { rows } = await db.query(
    `SELECT id, name, address, level, village, district, student_count, status FROM schools WHERE sppg_id = $1 ORDER BY name`,
    [sppgId]
  );
  return rows;
}
