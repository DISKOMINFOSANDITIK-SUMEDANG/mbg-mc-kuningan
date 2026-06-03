import db from '../../db/pool';

const EXCLUDED_SPPG_NAMES = ['Dapur Pusat Tanjungsari', 'Dapur Satelit Modular Sirah Cai', 'SPPG DEMO'];

export async function listSchools(query: { q?: string; page?: number; limit?: number; sppg_id?: string }) {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const offset = (page - 1) * limit;
  const params: any[] = [];
  let paramIdx = 1;
  let whereClause = 'WHERE 1=1';

  if (query.sppg_id) {
    whereClause += ` AND sc.sppg_id = $${paramIdx++}`;
    params.push(query.sppg_id);
  }

  if (query.q) {
    whereClause += ` AND (sc.name ILIKE $${paramIdx} OR sc.address ILIKE $${paramIdx} OR sc.village ILIKE $${paramIdx})`;
    params.push(`%${query.q}%`);
    paramIdx++;
  }

  const countResult = await db.query(`SELECT COUNT(*) FROM schools sc ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count);

  const { rows } = await db.query(
    `SELECT sc.*, sp.name as sppg_name, sp.type as sppg_type
     FROM schools sc
     LEFT JOIN sppgs sp ON sp.id = sc.sppg_id
     ${whereClause}
     ORDER BY sc.name
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  return { schools: rows, total, page, limit };
}

export async function searchSchools(q: string) {
  if (!q || q.trim().length < 2) {
    const { rows } = await db.query(
      `SELECT id, name, address, level, village, district
       FROM schools ORDER BY name LIMIT 10`
    );
    return rows.map(s => ({ value: s.id, label: s.name, description: `${s.level || ''} - ${s.village || ''}, ${s.district || ''}` }));
  }

  const { rows } = await db.query(
    `SELECT id, name, address, level, village, district FROM schools`
  );

  const searchLower = q.toLowerCase().trim();
  const searchWords = searchLower.split(/\s+/);

  const scored = rows.map((school: any) => {
    const nameLower = (school.name || '').toLowerCase();
    const addressLower = (school.address || '').toLowerCase();
    const villageLower = (school.village || '').toLowerCase();
    let score = 0;

    if (nameLower === searchLower) score += 1000;
    if (nameLower.includes(searchLower)) score += 500;
    if (addressLower.includes(searchLower) || villageLower.includes(searchLower)) score += 300;

    searchWords.forEach((word: string) => {
      if (nameLower.includes(word)) score += 100;
      if (addressLower.includes(word)) score += 50;
      if (villageLower.includes(word)) score += 30;
    });

    return { ...school, score };
  });

  return scored
    .filter((s: any) => s.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 10)
    .map((s: any) => ({ value: s.id, label: s.name, description: `${s.level || ''} - ${s.village || ''}, ${s.district || ''}` }));
}

export async function getSchoolById(id: string) {
  const { rows } = await db.query(
    `SELECT sc.*, sp.name as sppg_name, sp.type as sppg_type
     FROM schools sc
     LEFT JOIN sppgs sp ON sp.id = sc.sppg_id
     WHERE sc.id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function createSchool(data: Record<string, any>) {
  const { name, level, address, village, district,
    latitude, longitude, student_count, program_start_date, status, sppg_id } = data;

  if (!name) throw { status: 400, message: 'School name is required' };

  const { rows } = await db.query(
    `INSERT INTO schools (name, level, address, village, district,
       latitude, longitude, student_count, program_start_date, status, sppg_id, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, NOW(), NOW())
     RETURNING *`,
    [
      name,
      level || 'SD',
      address || null,
      village || null,
      district || null,
      latitude != null && latitude !== '' ? parseFloat(latitude) : null,
      longitude != null && longitude !== '' ? parseFloat(longitude) : null,
      student_count != null && student_count !== '' ? parseInt(student_count) : 0,
      program_start_date || new Date().toISOString().split('T')[0],
      status || 'Active',
      sppg_id || null
    ]
  );
  return rows[0];
}

export async function updateSchool(id: string, data: Record<string, any>) {
  const { name, level, address, village, district,
    latitude, longitude, student_count, program_start_date, status, sppg_id } = data;

  const { rows } = await db.query(
    `UPDATE schools SET
       name = COALESCE($2, name),
       level = COALESCE($3, level),
       address = COALESCE($4, address),
       village = COALESCE($5, village),
       district = COALESCE($6, district),
       latitude = $7,
       longitude = $8,
       student_count = COALESCE($9, student_count),
       program_start_date = COALESCE($10, program_start_date),
       status = COALESCE($11, status),
       sppg_id = $12,
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      name || null,
      level || null,
      address || null,
      village || null,
      district || null,
      latitude != null && latitude !== '' ? parseFloat(latitude) : null,
      longitude != null && longitude !== '' ? parseFloat(longitude) : null,
      student_count != null && student_count !== '' ? parseInt(student_count) : null,
      program_start_date || null,
      status || null,
      sppg_id || null
    ]
  );
  return rows[0] || null;
}

export async function deleteSchool(id: string) {
  await db.query('DELETE FROM schools WHERE id = $1', [id]);
}
