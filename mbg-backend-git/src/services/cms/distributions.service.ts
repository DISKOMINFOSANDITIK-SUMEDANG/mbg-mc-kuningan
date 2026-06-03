import db from '../../db/pool';
import { presignFields } from '../../lib/s3';

// --- Distributions ---
export async function listDistributions(
  query: { q?: string; date?: string; recipient_type?: string; sppg_id?: string; page?: number; limit?: number },
  userSppgId?: string
) {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const offset = (page - 1) * limit;
  const params: any[] = [];
  let paramIdx = 1;
  let whereClause = 'WHERE 1=1';

  const sppgFilter = query.sppg_id || userSppgId;
  if (sppgFilter) {
    whereClause += ` AND d.sppg_id = $${paramIdx++}`;
    params.push(sppgFilter);
  }
  if (query.q) {
    whereClause += ` AND (d.notes ILIKE $${paramIdx} OR s_filter.name ILIKE $${paramIdx})`;
    params.push(`%${query.q}%`);
    paramIdx++;
  }
  if (query.date) {
    whereClause += ` AND d.distribution_date = $${paramIdx++}`;
    params.push(query.date);
  }
  if (query.recipient_type) {
    whereClause += ` AND d.recipient_type = $${paramIdx++}`;
    params.push(query.recipient_type);
  }

  // For search filter, we need to join sppgs in the WHERE clause
  const filterJoin = query.q
    ? 'LEFT JOIN sppgs s_filter ON s_filter.id = d.sppg_id'
    : '';

  // Count unique distribution groups (sppg_id + distribution_date)
  const countResult = await db.query(
    `SELECT COUNT(*) FROM (
      SELECT DISTINCT d.sppg_id, d.distribution_date
      FROM daily_distributions d ${filterJoin} ${whereClause}
    ) sub`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // Get paginated group keys
  const groupKeysResult = await db.query(
    `SELECT DISTINCT d.sppg_id, d.distribution_date
     FROM daily_distributions d ${filterJoin} ${whereClause}
     ORDER BY d.distribution_date DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  if (groupKeysResult.rows.length === 0) {
    return { distributions: [], total, page, limit };
  }

  // Fetch all rows for these groups with JOINs (no N+1 queries)
  const groupConditions = groupKeysResult.rows.map((_: any, i: number) => {
    const base = 1 + i * 2;
    return `(d.sppg_id = $${base}::uuid AND d.distribution_date = $${base + 1}::date)`;
  });
  const groupParams = groupKeysResult.rows.flatMap((r: any) => [r.sppg_id, r.distribution_date]);

  const { rows } = await db.query(
    `SELECT d.id, d.sppg_id, d.distribution_date, d.recipient_type, d.recipient_id,
            d.menu_id, d.portions, d.notes, d.created_at, d.updated_at,
            s.name as sppg_name, s.type as sppg_type, s.location as sppg_location,
            m.name as menu_name, m.total_calories as menu_calories, m.image_url as menu_image,
            CASE
              WHEN d.recipient_type = 'school' THEN sch.name
              WHEN d.recipient_type = 'group' THEN g.name
              ELSE 'Unknown'
            END as recipient_name,
            CASE
              WHEN d.recipient_type = 'school' THEN jsonb_build_object('level', sch.level, 'district', sch.district, 'village', sch.village)
              ELSE jsonb_build_object('description', g.description)
            END as recipient_info
     FROM daily_distributions d
     LEFT JOIN sppgs s ON s.id = d.sppg_id
     LEFT JOIN menus m ON m.id = d.menu_id
     LEFT JOIN schools sch ON d.recipient_type = 'school' AND sch.id = d.recipient_id
     LEFT JOIN groups g ON d.recipient_type = 'group' AND g.id = d.recipient_id
     WHERE (${groupConditions.join(' OR ')})
     ORDER BY d.distribution_date DESC, d.created_at DESC`,
    groupParams
  );

  // Presign menu image URLs
  const presignedRows = await presignFields(rows, ['menu_image']);
  return { distributions: presignedRows, total, page, limit };
}

export async function getDistributionById(id: string) {
  const { rows } = await db.query(
    `SELECT d.*, s.name as sppg_name, m.name as menu_name
     FROM daily_distributions d
     LEFT JOIN sppgs s ON s.id = d.sppg_id
     LEFT JOIN menus m ON m.id = d.menu_id
     WHERE d.id = $1`,
    [id]
  );
  if (!rows[0]) return null;
  const dist = rows[0];

  if (dist.recipient_type === 'school' && dist.recipient_id) {
    const { rows: schoolRows } = await db.query(`SELECT id, name, address FROM schools WHERE id = $1`, [dist.recipient_id]);
    dist.school = schoolRows[0] || null;
  } else if (dist.recipient_type === 'group' && dist.recipient_id) {
    const { rows: groupRows } = await db.query(`SELECT id, name, description FROM groups WHERE id = $1`, [dist.recipient_id]);
    dist.group = groupRows[0] || null;
  }

  return dist;
}

export async function createDistribution(data: Record<string, any>, userSppgId?: string) {
  const { distribution_date, recipient_type, recipient_id, menu_id, portions, notes } = data;
  const sppgId = data.sppg_id || userSppgId;

  if (!distribution_date || !recipient_type || !sppgId || !recipient_id || !menu_id || !portions) {
    throw { status: 400, message: 'distribution_date, recipient_type, recipient_id, menu_id, portions, and sppg_id are required' };
  }

  const { rows } = await db.query(
    `INSERT INTO daily_distributions (distribution_date, recipient_type, recipient_id, sppg_id, menu_id, portions, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [distribution_date, recipient_type, recipient_id, sppgId, menu_id, portions, notes || null]
  );
  return rows[0];
}

export async function updateDistribution(id: string, data: Record<string, any>) {
  const { distribution_date, recipient_type, recipient_id, sppg_id, menu_id, portions, notes } = data;

  const { rows } = await db.query(
    `UPDATE daily_distributions SET distribution_date=COALESCE($2,distribution_date), recipient_type=COALESCE($3,recipient_type),
       recipient_id=COALESCE($4,recipient_id), sppg_id=COALESCE($5,sppg_id), menu_id=COALESCE($6,menu_id), portions=COALESCE($7,portions), notes=$8, updated_at=NOW()
     WHERE id = $1 RETURNING *`,
    [id, distribution_date, recipient_type, recipient_id, sppg_id, menu_id, portions, notes || null]
  );
  return rows[0] || null;
}

export async function deleteDistribution(id: string) {
  await db.query(`DELETE FROM daily_distributions WHERE id = $1`, [id]);
}

// --- Grouped distributions ---
export async function getGroupedDistributions(sppgId: string) {
  const { rows } = await db.query(
    `SELECT d.sppg_id, d.distribution_date, d.menu_id, m.name as menu_name,
            COUNT(*) as count, array_agg(d.id) as distribution_ids
     FROM daily_distributions d
     LEFT JOIN menus m ON m.id = d.menu_id
     WHERE d.sppg_id = $1
     GROUP BY d.sppg_id, d.distribution_date, d.menu_id, m.name
     ORDER BY d.distribution_date DESC`,
    [sppgId]
  );
  return rows;
}

export async function deleteGroupedDistributions(sppgId: string, date: string, menuId?: string) {
  if (menuId) {
    await db.query(
      `DELETE FROM daily_distributions WHERE sppg_id = $1 AND distribution_date = $2 AND menu_id = $3`,
      [sppgId, date, menuId]
    );
  } else {
    await db.query(
      `DELETE FROM daily_distributions WHERE sppg_id = $1 AND distribution_date = $2 AND menu_id IS NULL`,
      [sppgId, date]
    );
  }
}

// --- Last portions per recipient for an SPPG ---
export async function getLastPortionsBySppg(sppgId: string) {
  // For each unique (recipient_type, recipient_id), get the most recent portions
  const { rows } = await db.query(
    `SELECT DISTINCT ON (d.recipient_type, d.recipient_id)
            d.recipient_type, d.recipient_id, d.portions, d.distribution_date
     FROM daily_distributions d
     WHERE d.sppg_id = $1
     ORDER BY d.recipient_type, d.recipient_id, d.distribution_date DESC`,
    [sppgId]
  );
  // Return as a map: { "school:uuid": portions, ... }
  const portionsMap: Record<string, number> = {};
  for (const row of rows) {
    portionsMap[`${row.recipient_type}:${row.recipient_id}`] = row.portions;
  }
  return portionsMap;
}

// --- Bulk create ---
export async function createBulkDistributions(data: { distributions: any[] }, userSppgId?: string) {
  const { distributions } = data;
  if (!distributions || !Array.isArray(distributions) || distributions.length === 0) {
    throw { status: 400, message: 'distributions array is required and must not be empty' };
  }

  const results = [];
  for (const dist of distributions) {
    const sppgId = dist.sppg_id || userSppgId;
    const { rows } = await db.query(
      `INSERT INTO daily_distributions (distribution_date, recipient_type, recipient_id, sppg_id, menu_id, portions, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [dist.distribution_date, dist.recipient_type, dist.recipient_id,
       sppgId, dist.menu_id, dist.portions, dist.notes || null]
    );
    results.push(rows[0]);
  }

  return results;
}
