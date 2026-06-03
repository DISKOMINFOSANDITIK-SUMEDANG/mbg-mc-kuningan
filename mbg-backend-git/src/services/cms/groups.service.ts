import db from '../../db/pool';

// --- Groups ---
export async function listGroups(query: { q?: string; page?: number; limit?: number }) {
  const page = query.page || 1;
  const limit = query.limit || 50;
  const offset = (page - 1) * limit;
  const params: any[] = [];
  let paramIdx = 1;
  let whereClause = 'WHERE 1=1';

  if (query.q) {
    whereClause += ` AND (g.name ILIKE $${paramIdx} OR g.description ILIKE $${paramIdx})`;
    params.push(`%${query.q}%`);
    paramIdx++;
  }

  const countResult = await db.query(`SELECT COUNT(*) FROM groups g ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count);

  const { rows } = await db.query(
    `SELECT g.* FROM groups g ${whereClause} ORDER BY g.name LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  return { groups: rows, total, page, limit };
}

export async function getGroupById(id: string) {
  const { rows } = await db.query(`SELECT * FROM groups WHERE id = $1`, [id]);
  if (!rows[0]) return null;
  const group = rows[0];

  // Get distributions for this group
  const { rows: distributions } = await db.query(
    `SELECT d.*, m.name as menu_name FROM daily_distributions d LEFT JOIN menus m ON m.id = d.menu_id
     WHERE d.recipient_type = 'group' AND d.recipient_id = $1 ORDER BY d.distribution_date DESC`, [id]
  );
  group.distributions = distributions;
  return group;
}

export async function createGroup(data: Record<string, any>) {
  const { name, description } = data;
  if (!name) throw { status: 400, message: 'Name is required' };

  const { rows } = await db.query(
    `INSERT INTO groups (name, description, created_at, updated_at) VALUES ($1,$2, NOW(), NOW()) RETURNING *`,
    [name, description || null]
  );
  return rows[0];
}

export async function updateGroup(id: string, data: Record<string, any>) {
  const { name, description } = data;
  if (!name) throw { status: 400, message: 'Name is required' };

  const { rows } = await db.query(
    `UPDATE groups SET name=$2, description=$3, updated_at=NOW() WHERE id = $1 RETURNING *`,
    [id, name, description || null]
  );
  return rows[0] || null;
}

export async function deleteGroup(id: string) {
  await db.query(`DELETE FROM groups WHERE id = $1`, [id]);
}

// --- Foundations ---
export async function listFoundations(query: { q?: string; page?: number; limit?: number; all?: boolean }) {
  const params: any[] = [];
  let paramIdx = 1;
  let whereClause = 'WHERE 1=1';

  if (query.q) {
    whereClause += ` AND (f.name ILIKE $${paramIdx} OR f.address ILIKE $${paramIdx})`;
    params.push(`%${query.q}%`);
    paramIdx++;
  }

  // 'all' param skips pagination
  if (query.all) {
    const { rows } = await db.query(
      `SELECT f.* FROM foundation f ${whereClause} ORDER BY f.name`, params
    );
    return { foundations: rows };
  }

  const page = query.page || 1;
  const limit = query.limit || 50;
  const offset = (page - 1) * limit;

  const countResult = await db.query(`SELECT COUNT(*) FROM foundation f ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count);

  const { rows } = await db.query(
    `SELECT f.* FROM foundation f ${whereClause} ORDER BY f.name LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  return { foundations: rows, total, page, limit };
}

export async function getFoundationById(id: string) {
  const { rows } = await db.query(`SELECT * FROM foundation WHERE id = $1`, [id]);
  return rows[0] ? { foundation: rows[0] } : null;
}

export async function createFoundation(data: Record<string, any>) {
  const { name, address, phone, email, description } = data;
  if (!name) throw { status: 400, message: 'Name is required' };

  const { rows } = await db.query(
    `INSERT INTO foundation (name, address, phone, email, description, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5, NOW(), NOW()) RETURNING *`,
    [name, address || null, phone || null, email || null, description || null]
  );
  return rows[0];
}

export async function updateFoundation(id: string, data: Record<string, any>) {
  const { name, address, phone, email, description } = data;
  if (!name) throw { status: 400, message: 'Name is required' };

  const { rows } = await db.query(
    `UPDATE foundation SET name=$2, address=$3, phone=$4, email=$5, description=$6, updated_at=NOW()
     WHERE id = $1 RETURNING *`,
    [id, name, address || null, phone || null, email || null, description || null]
  );
  return rows[0] || null;
}

export async function deleteFoundation(id: string) {
  // Check if any SPPG is using this foundation
  const { rows: sppgs } = await db.query(`SELECT id FROM sppgs WHERE foundation_id = $1 LIMIT 1`, [id]);
  if (sppgs.length > 0) {
    throw { status: 400, message: 'Tidak dapat menghapus yayasan yang masih digunakan oleh SPPG' };
  }
  await db.query(`DELETE FROM foundation WHERE id = $1`, [id]);
}
