import db from '../../db/pool';

// --- Commodities ---
export async function listCommodities(query: { q?: string; category_id?: string; status?: string; page?: number; limit?: number }) {
  const page = query.page || 1;
  const limit = query.limit || 50;
  const offset = (page - 1) * limit;
  const params: any[] = [];
  let paramIdx = 1;
  let whereClause = 'WHERE 1=1';

  if (query.q) {
    whereClause += ` AND (c.name ILIKE $${paramIdx} OR c.description ILIKE $${paramIdx})`;
    params.push(`%${query.q}%`);
    paramIdx++;
  }
  if (query.category_id) {
    whereClause += ` AND c.category_id = $${paramIdx++}`;
    params.push(query.category_id);
  }
  if (query.status) {
    whereClause += ` AND c.status = $${paramIdx++}`;
    params.push(query.status);
  }

  const countResult = await db.query(`SELECT COUNT(*) FROM commodities c ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count);

  const { rows } = await db.query(
    `SELECT c.*, cc.name as category_name
     FROM commodities c
     LEFT JOIN commodity_categories cc ON cc.id = c.category_id
     ${whereClause}
     ORDER BY c.name
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  return { commodities: rows, total, page, limit };
}

export async function getCommodityById(id: string) {
  const { rows } = await db.query(
    `SELECT c.*, cc.name as category_name
     FROM commodities c
     LEFT JOIN commodity_categories cc ON cc.id = c.category_id
     WHERE c.id = $1`, [id]
  );
  return rows[0] || null;
}

export async function createCommodity(data: Record<string, any>) {
  const { name, description, unit, category_id, status, image_url } = data;
  if (!name || !unit) throw { status: 400, message: 'Name and unit are required' };

  const { rows } = await db.query(
    `INSERT INTO commodities (name, description, unit, category_id, status, image_url, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6, NOW(), NOW()) RETURNING *`,
    [name, description || null, unit, category_id || null, status || 'active', image_url || null]
  );
  return rows[0];
}

export async function updateCommodity(id: string, data: Record<string, any>) {
  const { name, description, unit, category_id, status, image_url } = data;

  const { rows } = await db.query(
    `UPDATE commodities SET name=COALESCE($2,name), description=$3, unit=COALESCE($4,unit),
       category_id=$5, status=COALESCE($6,status), image_url=$7, updated_at=NOW()
     WHERE id = $1 RETURNING *`,
    [id, name, description || null, unit, category_id || null, status, image_url || null]
  );
  return rows[0] || null;
}

export async function deleteCommodity(id: string) {
  await db.query(`DELETE FROM commodities WHERE id = $1`, [id]);
}

// --- Commodity Categories ---
export async function listCommodityCategories() {
  const { rows } = await db.query(`SELECT * FROM commodity_categories ORDER BY name`);
  return rows;
}

export async function getCommodityCategoryById(id: string) {
  const { rows } = await db.query(`SELECT * FROM commodity_categories WHERE id = $1`, [id]);
  return rows[0] || null;
}

export async function createCommodityCategory(data: Record<string, any>) {
  const { name, description } = data;
  if (!name) throw { status: 400, message: 'Name is required' };

  const { rows } = await db.query(
    `INSERT INTO commodity_categories (name, description, created_at, updated_at) VALUES ($1,$2, NOW(), NOW()) RETURNING *`,
    [name, description || null]
  );
  return rows[0];
}

export async function updateCommodityCategory(id: string, data: Record<string, any>) {
  const { name, description } = data;
  if (!name) throw { status: 400, message: 'Name is required' };

  const { rows } = await db.query(
    `UPDATE commodity_categories SET name=$2, description=$3, updated_at=NOW() WHERE id = $1 RETURNING *`,
    [id, name, description || null]
  );
  return rows[0] || null;
}

export async function deleteCommodityCategory(id: string) {
  const { rows: commodities } = await db.query(`SELECT id FROM commodities WHERE category_id = $1 LIMIT 1`, [id]);
  if (commodities.length > 0) throw { status: 400, message: 'Tidak dapat menghapus kategori yang masih memiliki komoditas' };
  await db.query(`DELETE FROM commodity_categories WHERE id = $1`, [id]);
}
