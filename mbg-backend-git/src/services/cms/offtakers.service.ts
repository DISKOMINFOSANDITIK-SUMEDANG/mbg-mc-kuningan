import db from '../../db/pool';

// Helper to get offtaker_id from user
async function getOfftakerId(userId: string): Promise<string | null> {
  const { rows } = await db.query(`SELECT offtaker_id FROM offtaker_users WHERE user_id = $1`, [userId]);
  return rows[0]?.offtaker_id || null;
}

// --- Offtakers ---
export async function listOfftakers(userId?: string, userRole?: string) {
  if (userRole === 'offtaker' && userId) {
    const offtakerId = await getOfftakerId(userId);
    if (!offtakerId) throw { status: 403, message: 'Offtaker tidak ditemukan untuk user ini' };
    const { rows } = await db.query(
      `SELECT o.*, (SELECT COUNT(*) FROM offtaker_products op WHERE op.offtaker_id = o.id) as product_count
       FROM offtakers o WHERE o.id = $1`, [offtakerId]
    );
    return rows;
  }

  const { rows } = await db.query(
    `SELECT o.*, (SELECT COUNT(*) FROM offtaker_products op WHERE op.offtaker_id = o.id) as product_count
     FROM offtakers o ORDER BY o.name`
  );
  return rows;
}

export async function getOfftakerById(id: string) {
  const { rows } = await db.query(`SELECT * FROM offtakers WHERE id = $1`, [id]);
  return rows[0] || null;
}

export async function createOfftaker(data: Record<string, any>) {
  const { name, phone, email, address, warehouse_address, status } = data;
  if (!name) throw { status: 400, message: 'Name is required' };

  const { rows } = await db.query(
    `INSERT INTO offtakers (name, phone, email, address, warehouse_address, status, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6, NOW(), NOW()) RETURNING *`,
    [name, phone || null, email || null, address || null, warehouse_address || null, status || 'active']
  );
  return rows[0];
}

export async function updateOfftaker(id: string, data: Record<string, any>) {
  const { name, phone, email, address, warehouse_address, status } = data;

  const { rows } = await db.query(
    `UPDATE offtakers SET name=COALESCE($2,name), phone=$3, email=$4, address=$5,
       warehouse_address=$6, status=COALESCE($7,status), updated_at=NOW()
     WHERE id = $1 RETURNING *`,
    [id, name, phone || null, email || null, address || null, warehouse_address || null, status]
  );
  return rows[0] || null;
}

export async function deleteOfftaker(id: string) {
  const { rows } = await db.query(`SELECT id FROM offtaker_products WHERE offtaker_id = $1 LIMIT 1`, [id]);
  if (rows.length > 0) throw { status: 400, message: 'Tidak dapat menghapus offtaker yang masih memiliki produk' };
  await db.query(`DELETE FROM offtakers WHERE id = $1`, [id]);
}

export async function searchOfftakers(q: string) {
  if (!q || q.trim().length < 2) {
    const { rows } = await db.query(
      `SELECT id, name, address, phone FROM offtakers WHERE status = 'active' ORDER BY name LIMIT 10`
    );
    return rows.map(o => ({ value: o.id, label: o.name, description: o.address || '' }));
  }

  const { rows } = await db.query(`SELECT id, name, address, phone FROM offtakers WHERE status = 'active'`);
  const searchTerms = q.toLowerCase().trim().split(/\s+/);

  const scored = rows.map((off: any) => {
    let score = 0;
    let matchedTerms = 0;
    const sName = off.name.toLowerCase();
    const sAddr = (off.address || '').toLowerCase();
    const nameWords = sName.split(/\s+/);

    if (sName === q.toLowerCase()) score += 1000;
    searchTerms.forEach((term: string) => {
      let matched = false;
      if (nameWords.some((w: string) => w === term)) { score += 150; matched = true; }
      else if (nameWords.some((w: string) => w.startsWith(term))) { score += 100; matched = true; }
      else if (sName.includes(term)) { score += 60; matched = true; }
      else if (sAddr.includes(term)) { score += 30; matched = true; }
      if (matched) matchedTerms++;
    });
    return { ...off, score, matchedTerms };
  });

  return scored
    .filter((s: any) => s.score > 0 && (s.matchedTerms / searchTerms.length) >= 0.5)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 10)
    .map((s: any) => ({ value: s.id, label: s.name, description: s.address || '' }));
}

// --- Offtaker Products ---
export async function listOfftakerProducts(
  query: { q?: string; offtaker_id?: string },
  userId?: string, userRole?: string
) {
  const params: any[] = [];
  let paramIdx = 1;
  let whereClause = 'WHERE 1=1';

  if (userRole === 'offtaker' && userId) {
    const offtakerId = await getOfftakerId(userId);
    if (!offtakerId) throw { status: 403, message: 'Offtaker tidak ditemukan untuk user ini' };
    whereClause += ` AND op.offtaker_id = $${paramIdx++}`;
    params.push(offtakerId);
  } else if (query.offtaker_id) {
    whereClause += ` AND op.offtaker_id = $${paramIdx++}`;
    params.push(query.offtaker_id);
  }

  const { rows } = await db.query(
    `SELECT op.*, o.name as offtaker_name,
            sp.price_per_unit as supplier_price_per_unit, sp.stock as supplier_stock,
            c.id as commodity_id, c.name as commodity_name, c.unit as commodity_unit,
            cc.name as category_name
     FROM offtaker_products op
     LEFT JOIN offtakers o ON o.id = op.offtaker_id
     LEFT JOIN supplier_products sp ON sp.id = op.supplier_product_id
     LEFT JOIN commodities c ON c.id = sp.commodity_id
     LEFT JOIN commodity_categories cc ON cc.id = c.category_id
     ${whereClause}
     ORDER BY c.name`,
    params
  );

  // Client-side search
  if (query.q) {
    const searchLower = query.q.toLowerCase();
    return rows.filter((p: any) =>
      (p.commodity_name || '').toLowerCase().includes(searchLower) ||
      (p.offtaker_name || '').toLowerCase().includes(searchLower) ||
      (p.category_name || '').toLowerCase().includes(searchLower)
    );
  }

  return rows;
}

export async function getOfftakerProductById(id: string) {
  const { rows } = await db.query(
    `SELECT op.*, o.name as offtaker_name,
            sp.price_per_unit as supplier_price_per_unit, sp.stock as supplier_stock,
            c.id as commodity_id, c.name as commodity_name, c.unit as commodity_unit,
            cc.name as category_name
     FROM offtaker_products op
     LEFT JOIN offtakers o ON o.id = op.offtaker_id
     LEFT JOIN supplier_products sp ON sp.id = op.supplier_product_id
     LEFT JOIN commodities c ON c.id = sp.commodity_id
     LEFT JOIN commodity_categories cc ON cc.id = c.category_id
     WHERE op.id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function createOfftakerProduct(data: Record<string, any>, userId?: string, userRole?: string) {
  let { offtaker_id, supplier_product_id, supplier_price, markup_price, markup_percentage, stock_quantity, unit, is_available, notes } = data;

  if (userRole === 'offtaker' && userId && !offtaker_id) {
    offtaker_id = await getOfftakerId(userId);
  }

  if (!offtaker_id || !supplier_product_id) {
    throw { status: 400, message: 'offtaker_id and supplier_product_id are required' };
  }

  // Duplicate check
  const { rows: existing } = await db.query(
    `SELECT id FROM offtaker_products WHERE offtaker_id = $1 AND supplier_product_id = $2`,
    [offtaker_id, supplier_product_id]
  );
  if (existing.length > 0) throw { status: 400, message: 'Produk ini sudah ada untuk offtaker ini' };

  const { rows } = await db.query(
    `INSERT INTO offtaker_products (offtaker_id, supplier_product_id, supplier_price, markup_price, markup_percentage,
       stock_quantity, unit, is_available, notes, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, NOW(), NOW()) RETURNING *`,
    [offtaker_id, supplier_product_id, parseFloat(supplier_price || '0'), parseFloat(markup_price || '0'),
     parseFloat(markup_percentage || '0'), parseFloat(stock_quantity || '0'), unit || 'Kg',
     is_available !== false, notes || null]
  );
  return rows[0];
}

export async function updateOfftakerProduct(id: string, data: Record<string, any>) {
  const { supplier_price, markup_price, markup_percentage, stock_quantity, unit, is_available, notes } = data;

  const { rows } = await db.query(
    `UPDATE offtaker_products SET supplier_price=COALESCE($2,supplier_price), markup_price=COALESCE($3,markup_price),
       markup_percentage=COALESCE($4,markup_percentage), stock_quantity=COALESCE($5,stock_quantity),
       unit=COALESCE($6,unit), is_available=COALESCE($7,is_available), notes=$8, updated_at=NOW()
     WHERE id = $1 RETURNING *`,
    [id, supplier_price ? parseFloat(supplier_price) : null, markup_price ? parseFloat(markup_price) : null,
     markup_percentage != null ? parseFloat(markup_percentage) : null, stock_quantity != null ? parseFloat(stock_quantity) : null,
     unit, is_available, notes || null]
  );
  return rows[0] || null;
}

export async function deleteOfftakerProduct(id: string) {
  // Check for sale items referencing this product
  const { rows } = await db.query(`SELECT id FROM offtaker_sale_items WHERE offtaker_product_id = $1 LIMIT 1`, [id]);
  if (rows.length > 0) throw { status: 400, message: 'Tidak dapat menghapus produk yang sudah memiliki transaksi penjualan' };
  await db.query(`DELETE FROM offtaker_products WHERE id = $1`, [id]);
}
