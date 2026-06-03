import db from '../../db/pool';

// --- Suppliers ---
export async function listSuppliers(
  query: { q?: string; page?: number; limit?: number },
  userId?: string, userRole?: string
) {
  const page = query.page || 1;
  const limit = query.limit || 50;
  const offset = (page - 1) * limit;
  const params: any[] = [];
  let paramIdx = 1;
  let whereClause = 'WHERE 1=1';

  // Pemasok only sees own supplier
  if (userRole === 'pemasok' && userId) {
    whereClause += ` AND s.id IN (SELECT supplier_id FROM supplier_users WHERE user_id = $${paramIdx++})`;
    params.push(userId);
  }

  if (query.q) {
    whereClause += ` AND (s.name ILIKE $${paramIdx} OR s.address ILIKE $${paramIdx})`;
    params.push(`%${query.q}%`);
    paramIdx++;
  }

  const countResult = await db.query(`SELECT COUNT(*) FROM suppliers s ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count);

  const { rows } = await db.query(
    `SELECT s.* FROM suppliers s ${whereClause} ORDER BY s.name LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  return { suppliers: rows, total, page, limit };
}

export async function getSupplierById(id: string) {
  const { rows } = await db.query(`SELECT * FROM suppliers WHERE id = $1`, [id]);
  return rows[0] || null;
}

export async function createSupplier(data: Record<string, any>) {
  const { name, address, phone, email, contact_person, status } = data;
  if (!name) throw { status: 400, message: 'Name is required' };

  const { rows } = await db.query(
    `INSERT INTO suppliers (name, address, phone, email, contact_person, status, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6, NOW(), NOW()) RETURNING *`,
    [name, address || null, phone || null, email || null, contact_person || null, status || 'active']
  );
  return rows[0];
}

export async function updateSupplier(id: string, data: Record<string, any>, userId?: string, userRole?: string) {
  // Ownership check for pemasok
  if (userRole === 'pemasok' && userId) {
    const { rows: check } = await db.query(
      `SELECT 1 FROM supplier_users WHERE supplier_id = $1 AND user_id = $2`, [id, userId]
    );
    if (check.length === 0) throw { status: 403, message: 'You can only edit your own supplier' };
  }

  const { name, address, phone, email, contact_person, status, warehouse_address } = data;

  const { rows } = await db.query(
    `UPDATE suppliers SET name=COALESCE($2,name), address=$3, phone=$4, email=$5,
       contact_person=$6, status=COALESCE($7,status), warehouse_address=$8, updated_at=NOW()
     WHERE id = $1 RETURNING *`,
    [id, name, address || null, phone || null, email || null, contact_person || null, status, warehouse_address || null]
  );
  return rows[0] || null;
}

export async function deleteSupplier(id: string) {
  // CASCADE: products, stock_movements etc. will be deleted
  await db.query(`DELETE FROM suppliers WHERE id = $1`, [id]);
}

export async function searchSuppliers(q: string) {
  if (!q || q.trim().length < 2) {
    const { rows } = await db.query(
      `SELECT id, name, address, phone FROM suppliers WHERE status = 'active' ORDER BY name LIMIT 10`
    );
    return rows.map(s => ({ value: s.id, label: s.name, description: s.address || '' }));
  }

  const { rows } = await db.query(`SELECT id, name, address, phone FROM suppliers WHERE status = 'active'`);
  const searchTerms = q.toLowerCase().trim().split(/\s+/);

  const scored = rows.map((sup: any) => {
    let score = 0;
    let matchedTerms = 0;
    const sName = sup.name.toLowerCase();
    const sAddr = (sup.address || '').toLowerCase();
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
    return { ...sup, score, matchedTerms };
  });

  return scored
    .filter((s: any) => s.score > 0 && (s.matchedTerms / searchTerms.length) >= 0.5)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 10)
    .map((s: any) => ({ value: s.id, label: s.name, description: s.address || '' }));
}

// --- Supplier Products ---
export async function listSupplierProducts(
  query: { q?: string; supplier_id?: string; page?: number; limit?: number },
  userId?: string, userRole?: string
) {
  const page = query.page || 1;
  const limit = query.limit || 50;
  const offset = (page - 1) * limit;
  const params: any[] = [];
  let paramIdx = 1;
  let whereClause = 'WHERE 1=1';

  // Pemasok sees only own products
  if (userRole === 'pemasok' && userId) {
    whereClause += ` AND sp.supplier_id IN (SELECT supplier_id FROM supplier_users WHERE user_id = $${paramIdx++})`;
    params.push(userId);
  } else if (query.supplier_id) {
    whereClause += ` AND sp.supplier_id = $${paramIdx++}`;
    params.push(query.supplier_id);
  }

  if (query.q) {
    whereClause += ` AND (c.name ILIKE $${paramIdx})`;
    params.push(`%${query.q}%`);
    paramIdx++;
  }

  const countResult = await db.query(
    `SELECT COUNT(*) FROM supplier_products sp LEFT JOIN commodities c ON c.id = sp.commodity_id ${whereClause}`, params
  );
  const total = parseInt(countResult.rows[0].count);

  const { rows } = await db.query(
    `SELECT sp.*,
            c.id as c_id, c.name as commodity_name, c.unit as commodity_unit, c.description as commodity_description, c.photo_url as commodity_photo_url,
            cc.id as cc_id, cc.name as category_name,
            s.id as s_id, s.name as supplier_name, s.logo_url as supplier_logo_url
     FROM supplier_products sp
     LEFT JOIN commodities c ON c.id = sp.commodity_id
     LEFT JOIN commodity_categories cc ON cc.id = c.category_id
     LEFT JOIN suppliers s ON s.id = sp.supplier_id
     ${whereClause}
     ORDER BY sp.updated_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  const products = rows.map(row => ({
    id: row.id,
    supplier_id: row.supplier_id,
    commodity_id: row.commodity_id,
    price_per_unit: row.price_per_unit,
    stock: row.stock,
    availability_status: row.availability_status,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    commodities: row.c_id ? {
      id: row.c_id,
      name: row.commodity_name,
      unit: row.commodity_unit,
      description: row.commodity_description,
      photo_url: row.commodity_photo_url,
      commodity_categories: row.cc_id ? {
        id: row.cc_id,
        name: row.category_name,
      } : null,
    } : null,
    suppliers: row.s_id ? {
      id: row.s_id,
      name: row.supplier_name,
      logo_url: row.supplier_logo_url,
    } : null,
  }));

  return { products, total, page, limit };
}

export async function getSupplierProductById(id: string) {
  const { rows } = await db.query(
    `SELECT sp.*,
            c.id as c_id, c.name as commodity_name, c.unit as commodity_unit, c.photo_url as commodity_photo_url,
            cc.id as cc_id, cc.name as category_name,
            s.id as s_id, s.name as supplier_name, s.logo_url as supplier_logo_url
     FROM supplier_products sp
     LEFT JOIN commodities c ON c.id = sp.commodity_id
     LEFT JOIN commodity_categories cc ON cc.id = c.category_id
     LEFT JOIN suppliers s ON s.id = sp.supplier_id
     WHERE sp.id = $1`, [id]
  );
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    id: row.id,
    supplier_id: row.supplier_id,
    commodity_id: row.commodity_id,
    price_per_unit: row.price_per_unit,
    stock: row.stock,
    availability_status: row.availability_status,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    commodities: row.c_id ? {
      id: row.c_id,
      name: row.commodity_name,
      unit: row.commodity_unit,
      photo_url: row.commodity_photo_url,
      commodity_categories: row.cc_id ? {
        id: row.cc_id,
        name: row.category_name,
      } : null,
    } : null,
    suppliers: row.s_id ? {
      id: row.s_id,
      name: row.supplier_name,
      logo_url: row.supplier_logo_url,
    } : null,
  };
}

export async function createSupplierProduct(data: Record<string, any>, userId?: string, userRole?: string) {
  let { supplier_id, commodity_id, price_per_unit, stock, availability_status, notes, is_expirable, expired_from, expired_until } = data;

  // For pemasok, get supplier_id from user
  if (userRole === 'pemasok' && userId && !supplier_id) {
    const { rows } = await db.query(`SELECT supplier_id FROM supplier_users WHERE user_id = $1`, [userId]);
    supplier_id = rows[0]?.supplier_id;
  }

  if (!supplier_id || !commodity_id || !price_per_unit) {
    throw { status: 400, message: 'supplier_id, commodity_id, and price_per_unit are required' };
  }

  if (is_expirable && (!expired_from || !expired_until)) {
    throw { status: 400, message: 'expired_from and expired_until required when is_expirable is true' };
  }

  const { rows } = await db.query(
    `INSERT INTO supplier_products (supplier_id, commodity_id, price_per_unit, stock, availability_status, notes,
       is_expirable, expired_from, expired_until, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, NOW(), NOW()) RETURNING *`,
    [supplier_id, commodity_id, parseFloat(price_per_unit), parseFloat(stock || '0'),
     availability_status || 'available', notes || null,
     is_expirable || false, is_expirable ? expired_from : null, is_expirable ? expired_until : null]
  );
  return rows[0];
}

export async function updateSupplierProduct(id: string, data: Record<string, any>, userId?: string, userRole?: string) {
  // Ownership check for pemasok
  if (userRole === 'pemasok' && userId) {
    const { rows: check } = await db.query(
      `SELECT sp.id FROM supplier_products sp
       JOIN supplier_users su ON su.supplier_id = sp.supplier_id
       WHERE sp.id = $1 AND su.user_id = $2`, [id, userId]
    );
    if (check.length === 0) throw { status: 403, message: 'You can only edit your own products' };
  }

  const { price_per_unit, stock, availability_status, notes, is_expirable, expired_from, expired_until } = data;

  if (is_expirable && (!expired_from || !expired_until)) {
    throw { status: 400, message: 'expired_from and expired_until required when is_expirable is true' };
  }

  const { rows } = await db.query(
    `UPDATE supplier_products SET price_per_unit=COALESCE($2,price_per_unit), stock=COALESCE($3,stock),
       availability_status=COALESCE($4,availability_status), notes=$5,
       is_expirable=$6, expired_from=$7, expired_until=$8, updated_at=NOW()
     WHERE id = $1 RETURNING *`,
    [id, price_per_unit ? parseFloat(price_per_unit) : null, stock != null ? parseFloat(stock) : null,
     availability_status, notes || null,
     is_expirable || false, is_expirable ? expired_from : null, is_expirable ? expired_until : null]
  );
  return rows[0] || null;
}

export async function deleteSupplierProduct(id: string) {
  await db.query(`DELETE FROM supplier_products WHERE id = $1`, [id]);
}

export async function autoExpireSupplierProducts() {
  const { rows } = await db.query(`SELECT * FROM auto_expire_supplier_products()`);
  return rows;
}
