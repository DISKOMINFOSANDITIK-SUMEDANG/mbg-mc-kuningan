import db from '../../db/pool';

const STOCK_MANAGEMENT_ROLES = ['pemasok', 'administrator', 'dinas_pertanian'];

async function getSupplierId(userId: string): Promise<string | null> {
  const { rows } = await db.query(`SELECT supplier_id FROM supplier_users WHERE user_id = $1`, [userId]);
  return rows[0]?.supplier_id || null;
}

// ========== Stock Movements ==========
export async function listStockMovements(
  query: { supplier_id?: string; date_from?: string; date_to?: string },
  userId: string, userRole: string
) {
  const params: any[] = [];
  let paramIdx = 1;
  let whereClause = 'WHERE 1=1';

  if (userRole === 'pemasok') {
    const supplierId = await getSupplierId(userId);
    if (!supplierId) throw { status: 400, message: 'Supplier not found for this user' };
    whereClause += ` AND sm.supplier_id = $${paramIdx++}`;
    params.push(supplierId);
  } else if (query.supplier_id) {
    whereClause += ` AND sm.supplier_id = $${paramIdx++}`;
    params.push(query.supplier_id);
  }

  if (query.date_from) { whereClause += ` AND sm.movement_date >= $${paramIdx++}`; params.push(query.date_from); }
  if (query.date_to) { whereClause += ` AND sm.movement_date <= $${paramIdx++}`; params.push(query.date_to); }

  const { rows } = await db.query(
    `SELECT sm.*, sup.id as sup_id, sup.name as supplier_name,
            c.name as commodity_name, c.unit as commodity_unit
     FROM stock_movements sm
     LEFT JOIN suppliers sup ON sup.id = sm.supplier_id
     LEFT JOIN supplier_products sp ON sp.id = sm.supplier_product_id
     LEFT JOIN commodities c ON c.id = sp.commodity_id
     ${whereClause}
     ORDER BY sm.created_at DESC`,
    params
  );
  return rows.map(row => ({
    ...row,
    suppliers: row.sup_id ? { id: row.sup_id, name: row.supplier_name } : null,
    supplier_products: {
      commodities: {
        name: row.commodity_name,
        unit: row.commodity_unit,
      }
    },
  }));
}

export async function getStockMovementById(id: string, userId: string, userRole: string) {
  const { rows } = await db.query(
    `SELECT sm.*, sup.id as sup_id, sup.name as supplier_name, sup.address as supplier_address, sup.phone as supplier_phone,
            sp.price_per_unit as product_price, sp.stock as product_stock,
            c.name as commodity_name, c.unit as commodity_unit
     FROM stock_movements sm
     LEFT JOIN suppliers sup ON sup.id = sm.supplier_id
     LEFT JOIN supplier_products sp ON sp.id = sm.supplier_product_id
     LEFT JOIN commodities c ON c.id = sp.commodity_id
     WHERE sm.id = $1`,
    [id]
  );
  if (!rows[0]) throw { status: 404, message: 'Stock movement not found' };

  if (userRole === 'pemasok') {
    const supplierId = await getSupplierId(userId);
    if (rows[0].supplier_id !== supplierId) throw { status: 403, message: 'Forbidden' };
  }

  const row = rows[0];
  return {
    ...row,
    suppliers: row.sup_id ? { id: row.sup_id, name: row.supplier_name, address: row.supplier_address, phone: row.supplier_phone } : null,
    supplier_products: {
      commodities: {
        name: row.commodity_name,
        unit: row.commodity_unit,
      },
      price_per_unit: row.product_price,
      stock: row.product_stock,
    },
  };
}

export async function createStockMovement(data: Record<string, any>, userId: string, userRole: string) {
  const { supplier_product_id, movement_type, quantity, reason, notes, movement_date, is_expirable, expired_from, expired_until } = data;

  let supplierId: string | undefined;
  if (userRole === 'administrator' || userRole === 'dinas_pertanian') {
    supplierId = data.supplier_id;
    if (!supplierId && supplier_product_id) {
      const { rows } = await db.query(`SELECT supplier_id FROM supplier_products WHERE id = $1`, [supplier_product_id]);
      supplierId = rows[0]?.supplier_id;
    }
  } else {
    supplierId = (await getSupplierId(userId)) || undefined;
  }
  if (!supplierId) throw { status: 400, message: 'Supplier ID not found' };

  if (!supplier_product_id || !movement_type || !quantity) {
    throw { status: 400, message: 'Missing required fields: supplier_product_id, movement_type, quantity' };
  }

  if (is_expirable === true) {
    if (!expired_from || !expired_until) throw { status: 400, message: 'expired_from and expired_until required when is_expirable is true' };
    if (new Date(expired_until) <= new Date(expired_from)) throw { status: 400, message: 'expired_until must be after expired_from' };
  }

  if (!['in', 'out', 'adjustment'].includes(movement_type.toLowerCase())) {
    throw { status: 400, message: 'Invalid movement_type. Must be in, out, or adjustment' };
  }

  // Verify product
  const checkQuery = userRole === 'pemasok'
    ? `SELECT id, supplier_id FROM supplier_products WHERE id = $1 AND supplier_id = $2`
    : `SELECT id, supplier_id FROM supplier_products WHERE id = $1`;
  const checkParams = userRole === 'pemasok' ? [supplier_product_id, supplierId] : [supplier_product_id];
  const { rows: prodCheck } = await db.query(checkQuery, checkParams);
  if (prodCheck.length === 0) throw { status: 404, message: 'Product not found' };

  const { rows } = await db.query(
    `INSERT INTO stock_movements (supplier_id, supplier_product_id, movement_type, quantity, reason, notes,
       movement_date, created_by, is_expirable, expired_from, expired_until, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, NOW(), NOW()) RETURNING *`,
    [supplierId, supplier_product_id, movement_type.toLowerCase(), parseFloat(quantity),
     reason || null, notes || null, movement_date || new Date().toISOString().split('T')[0], userId,
     is_expirable === true, is_expirable === true ? expired_from : null, is_expirable === true ? expired_until : null]
  );
  return rows[0];
}

export async function updateStockMovement(id: string, data: Record<string, any>, userId: string, userRole: string) {
  const { quantity, reason, notes, movement_date, is_expirable, expired_from, expired_until } = data;

  if (is_expirable === true) {
    if (!expired_from || !expired_until) throw { status: 400, message: 'expired_from and expired_until required' };
    if (new Date(expired_until) <= new Date(expired_from)) throw { status: 400, message: 'expired_until must be after expired_from' };
  }

  // Get existing movement
  const { rows: existing } = await db.query(`SELECT * FROM stock_movements WHERE id = $1`, [id]);
  if (existing.length === 0) throw { status: 404, message: 'Stock movement not found' };

  if (userRole === 'pemasok') {
    const supplierId = await getSupplierId(userId);
    if (existing[0].supplier_id !== supplierId) throw { status: 403, message: 'Forbidden' };
  }

  // Get current product stock
  const { rows: prodRows } = await db.query(`SELECT stock FROM supplier_products WHERE id = $1`, [existing[0].supplier_product_id]);
  if (prodRows.length === 0) throw { status: 404, message: 'Product not found' };

  const currentStock = parseFloat(prodRows[0].stock);
  const oldQuantity = parseFloat(existing[0].quantity);
  const newQuantity = parseFloat(quantity);

  // Recalculate stock
  let newStock = currentStock;
  if (existing[0].movement_type === 'in') newStock -= oldQuantity;
  else if (existing[0].movement_type === 'out') newStock += oldQuantity;
  if (existing[0].movement_type === 'in') newStock += newQuantity;
  else if (existing[0].movement_type === 'out') newStock -= newQuantity;

  if (newStock < 0) {
    throw { status: 400, message: `Stok tidak mencukupi. Stok tersedia: ${currentStock + (existing[0].movement_type === 'out' ? oldQuantity : 0)}` };
  }

  const fields: string[] = [`quantity = $2`, `previous_stock = $3`, `new_stock = $4`, `updated_at = NOW()`];
  const params: any[] = [id, newQuantity, currentStock, newStock];
  let idx = 5;
  if (reason !== undefined) { fields.push(`reason = $${idx++}`); params.push(reason); }
  if (notes !== undefined) { fields.push(`notes = $${idx++}`); params.push(notes); }
  if (movement_date) { fields.push(`movement_date = $${idx++}`); params.push(movement_date); }
  if (is_expirable !== undefined) {
    fields.push(`is_expirable = $${idx++}`); params.push(is_expirable);
    fields.push(`expired_from = $${idx++}`); params.push(is_expirable ? expired_from : null);
    fields.push(`expired_until = $${idx++}`); params.push(is_expirable ? expired_until : null);
  }

  const { rows } = await db.query(`UPDATE stock_movements SET ${fields.join(', ')} WHERE id = $1 RETURNING *`, params);

  // Update product stock
  await db.query(`UPDATE supplier_products SET stock = $2, updated_at = NOW() WHERE id = $1`, [existing[0].supplier_product_id, newStock]);

  return rows[0];
}

export async function deleteStockMovement(id: string, userId: string, userRole: string) {
  const { rows: existing } = await db.query(`SELECT * FROM stock_movements WHERE id = $1`, [id]);
  if (existing.length === 0) throw { status: 404, message: 'Stock movement not found' };

  if (userRole === 'pemasok') {
    const supplierId = await getSupplierId(userId);
    if (existing[0].supplier_id !== supplierId) throw { status: 403, message: 'Forbidden' };
  }

  const { rows: prodRows } = await db.query(`SELECT stock FROM supplier_products WHERE id = $1`, [existing[0].supplier_product_id]);
  if (prodRows.length === 0) throw { status: 404, message: 'Product not found' };

  const currentStock = parseFloat(prodRows[0].stock);
  const qty = parseFloat(existing[0].quantity);
  let newStock = currentStock;
  if (existing[0].movement_type === 'in') newStock -= qty;
  else if (existing[0].movement_type === 'out') newStock += qty;

  if (newStock < 0) throw { status: 400, message: 'Tidak dapat menghapus: akan menyebabkan stok negatif' };

  await db.query(`DELETE FROM stock_movements WHERE id = $1`, [id]);
  await db.query(`UPDATE supplier_products SET stock = $2, updated_at = NOW() WHERE id = $1`, [existing[0].supplier_product_id, newStock]);

  return { success: true };
}

export async function autoExpireStocks(authHeader?: string, cronSecret?: string) {
  const validCronSecret = process.env.CRON_SECRET || 'your-secret-key-here';
  if (cronSecret !== validCronSecret) throw { status: 401, message: 'Unauthorized' };

  const { rows } = await db.query(`SELECT * FROM auto_expire_stocks()`);

  const { rows: countRows } = await db.query(
    `SELECT COUNT(*) FROM stock_movements WHERE reason = 'expired' AND created_at >= NOW() - INTERVAL '1 minute'`
  );

  return { success: true, message: 'Auto-expire process completed successfully', expired_count: parseInt(countRows[0].count) };
}

// ========== Product Requests ==========
export async function listProductRequests(userId: string, userRole: string) {
  let whereClause = '';
  const params: any[] = [];

  if (userRole === 'offtaker') {
    const { rows: ouRows } = await db.query(`SELECT offtaker_id FROM offtaker_users WHERE user_id = $1`, [userId]);
    if (ouRows.length === 0) throw { status: 403, message: 'Offtaker not found for user' };
    // Product requests are from SPPG to offtaker - filter by offtaker products
  }

  const { rows } = await db.query(
    `SELECT pr.*, s.name as sppg_name,
            op.id as offtaker_product_id, o.name as offtaker_name,
            c.name as commodity_name, c.unit as commodity_unit
     FROM sppg_product_requests pr
     LEFT JOIN sppgs s ON s.id = pr.sppg_id
     LEFT JOIN offtaker_products op ON op.id = pr.offtaker_product_id
     LEFT JOIN offtakers o ON o.id = op.offtaker_id
     LEFT JOIN supplier_products sp ON sp.id = op.supplier_product_id
     LEFT JOIN commodities c ON c.id = sp.commodity_id
     ORDER BY pr.created_at DESC`
  );
  return rows;
}

export async function getProductRequestById(id: string) {
  const { rows } = await db.query(
    `SELECT pr.*, s.name as sppg_name,
            op.id as offtaker_product_id, o.name as offtaker_name,
            c.name as commodity_name, c.unit as commodity_unit
     FROM sppg_product_requests pr
     LEFT JOIN sppgs s ON s.id = pr.sppg_id
     LEFT JOIN offtaker_products op ON op.id = pr.offtaker_product_id
     LEFT JOIN offtakers o ON o.id = op.offtaker_id
     LEFT JOIN supplier_products sp ON sp.id = op.supplier_product_id
     LEFT JOIN commodities c ON c.id = sp.commodity_id
     WHERE pr.id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function updateProductRequestStatus(id: string, data: { status: string; notes?: string }) {
  if (!['approved', 'rejected', 'completed'].includes(data.status)) {
    throw { status: 400, message: 'Invalid status' };
  }

  const { rows } = await db.query(
    `UPDATE sppg_product_requests SET status = $2, notes = COALESCE($3, notes), updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id, data.status, data.notes || null]
  );
  return rows[0] || null;
}

// ========== Served Entities ==========
export async function getServedEntities(userId: string) {
  const { rows: sppgUsers } = await db.query(`SELECT sppg_id FROM sppg_users WHERE user_id = $1`, [userId]);
  if (sppgUsers.length === 0) throw { status: 404, message: 'This user is not associated with any SPPG' };

  const sppgId = sppgUsers[0].sppg_id;

  const [sppgResult, schoolsResult, groupsResult] = await Promise.all([
    db.query(`SELECT id, name, type FROM sppgs WHERE id = $1`, [sppgId]),
    db.query(
      `SELECT id, name, address, district, village, student_count, level, status, latitude, longitude
       FROM schools WHERE sppg_id = $1`, [sppgId]
    ),
    db.query(
      `SELECT g.id, g.name, g.description
       FROM group_sppg_relations gsr
       JOIN groups g ON g.id = gsr.group_id
       WHERE gsr.sppg_id = $1`, [sppgId]
    ),
  ]);

  if (sppgResult.rows.length === 0) throw { status: 404, message: 'SPPG not found' };

  return {
    sppg: sppgResult.rows[0],
    schools: schoolsResult.rows,
    groups: groupsResult.rows,
  };
}

// ========== Available Products (SPPG view) ==========
export async function getAvailableProductsForSppg(query: { search?: string; category_id?: string; available?: string }) {
  const available = query.available !== 'false';

  const { rows } = await db.query(
    `SELECT op.id, op.offtaker_id, op.markup_price, op.stock_quantity, op.unit, op.is_available, op.notes,
            o.name as offtaker_name, o.phone as offtaker_phone, o.email as offtaker_email, o.warehouse_address,
            sp.commodity_id, c.name as commodity_name, c.description as commodity_description, c.category_id,
            cc.name as category_name
     FROM offtaker_products op
     LEFT JOIN offtakers o ON o.id = op.offtaker_id
     LEFT JOIN supplier_products sp ON sp.id = op.supplier_product_id
     LEFT JOIN commodities c ON c.id = sp.commodity_id
     LEFT JOIN commodity_categories cc ON cc.id = c.category_id
     WHERE op.is_available = $1 AND op.stock_quantity > 0`,
    [available]
  );

  let filtered = rows;
  if (query.search) {
    const searchLower = query.search.toLowerCase();
    filtered = rows.filter((p: any) =>
      (p.commodity_name || '').toLowerCase().includes(searchLower) ||
      (p.offtaker_name || '').toLowerCase().includes(searchLower) ||
      (p.category_name || '').toLowerCase().includes(searchLower)
    );
  }
  if (query.category_id) {
    filtered = filtered.filter((p: any) => p.category_id === query.category_id);
  }

  // Transform for SPPG view - only markup_price visible
  const transformed = filtered.map((p: any) => ({
    id: p.id, offtaker_product_id: p.id, offtaker_id: p.offtaker_id,
    offtaker_name: p.offtaker_name, offtaker_phone: p.offtaker_phone, offtaker_email: p.offtaker_email,
    warehouse_address: p.warehouse_address, commodity_id: p.commodity_id, commodity_name: p.commodity_name,
    commodity_description: p.commodity_description, category_id: p.category_id, category_name: p.category_name,
    price: p.markup_price, stock_quantity: p.stock_quantity, unit: p.unit, is_available: p.is_available, notes: p.notes
  }));

  return { data: transformed, message: 'Products from offtakers (not directly from suppliers)' };
}

// ========== Products (supplier products view for admin/offtaker/dinas) ==========
export async function listProducts(query: { search?: string; supplier_id?: string; limit?: string }) {
  const limitNum = parseInt(query.limit || '100');
  const params: any[] = [];
  let paramIdx = 1;
  let whereClause = 'WHERE 1=1';

  if (query.supplier_id) { whereClause += ` AND sp.supplier_id = $${paramIdx++}`; params.push(query.supplier_id); }

  const { rows } = await db.query(
    `SELECT sp.*, sup.name as supplier_name, sup.address as supplier_address, sup.phone as supplier_phone,
            c.name as commodity_name, c.unit as commodity_unit, c.description as commodity_description, c.category_id,
            cc.name as category_name
     FROM supplier_products sp
     LEFT JOIN suppliers sup ON sup.id = sp.supplier_id
     LEFT JOIN commodities c ON c.id = sp.commodity_id
     LEFT JOIN commodity_categories cc ON cc.id = c.category_id
     ${whereClause}
     ORDER BY sp.updated_at DESC
     LIMIT $${paramIdx++}`,
    [...params, limitNum]
  );

  if (query.search) {
    const searchLower = query.search.toLowerCase();
    const filtered = rows.filter((p: any) =>
      (p.commodity_name || '').toLowerCase().includes(searchLower) ||
      (p.supplier_name || '').toLowerCase().includes(searchLower) ||
      (p.category_name || '').toLowerCase().includes(searchLower)
    );
    return { data: filtered, count: filtered.length };
  }

  return { data: rows, count: rows.length };
}

// ========== User Entity Lookups ==========
export async function getOfftakerUserByUserId(userId: string) {
  const { rows } = await db.query(
    `SELECT ou.*, o.name as offtaker_name, o.phone, o.email, o.address, o.status
     FROM offtaker_users ou
     LEFT JOIN offtakers o ON o.id = ou.offtaker_id
     WHERE ou.user_id = $1`,
    [userId]
  );
  return rows[0] || null;
}

export async function getSupplierUserByUserId(userId: string) {
  const { rows } = await db.query(
    `SELECT su.*, s.name as supplier_name, s.phone, s.email, s.address, s.status
     FROM supplier_users su
     LEFT JOIN suppliers s ON s.id = su.supplier_id
     WHERE su.user_id = $1`,
    [userId]
  );
  return rows[0] || null;
}

// ========== School-SPPG Assignment ==========
export async function assignSchoolToSppg(userId: string, schoolId: string) {
  // Get user's SPPG
  const { rows: sppgUsers } = await db.query(
    `SELECT sppg_id FROM sppg_users WHERE user_id = $1 LIMIT 1`, [userId]
  );
  if (!sppgUsers.length) throw { status: 404, message: 'SPPG not found for user' };
  const sppgId = sppgUsers[0].sppg_id;

  // Check school exists
  const { rows: schools } = await db.query(
    `SELECT id, name, sppg_id FROM schools WHERE id = $1`, [schoolId]
  );
  if (!schools.length) throw { status: 404, message: 'School not found' };

  // Check if already assigned to this SPPG (no-op)
  if (schools[0].sppg_id === sppgId) {
    // Already assigned to us — just return it
    const { rows: existing } = await db.query(
      `SELECT id, name, address, district, village, student_count, level, status, latitude, longitude FROM schools WHERE id = $1`,
      [schoolId]
    );
    return { message: 'School already assigned to this SPPG', school: existing[0] };
  }

  // Assign (overwrites any previous SPPG assignment)
  const { rows: updated } = await db.query(
    `UPDATE schools SET sppg_id = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, name, address, district, village, student_count, level, status, latitude, longitude`,
    [sppgId, schoolId]
  );
  return { message: 'School successfully assigned to SPPG', school: updated[0] };
}

export async function removeSchoolFromSppg(userId: string, schoolId: string) {
  // Get user's SPPG
  const { rows: sppgUsers } = await db.query(
    `SELECT sppg_id FROM sppg_users WHERE user_id = $1 LIMIT 1`, [userId]
  );
  if (!sppgUsers.length) throw { status: 404, message: 'SPPG not found for user' };
  const sppgId = sppgUsers[0].sppg_id;

  // Verify school belongs to this SPPG
  const { rows: schools } = await db.query(
    `SELECT id, sppg_id FROM schools WHERE id = $1`, [schoolId]
  );
  if (!schools.length) throw { status: 404, message: 'School not found' };
  if (schools[0].sppg_id !== sppgId) {
    throw { status: 403, message: 'Sekolah tidak termasuk dalam SPPG ini' };
  }

  await db.query(
    `UPDATE schools SET sppg_id = NULL, updated_at = NOW() WHERE id = $1`, [schoolId]
  );
  return { message: 'School successfully removed from SPPG' };
}

export async function searchSchoolsForSppg(userId: string, query: { q?: string; limit?: string }) {
  // Get user's SPPG
  const { rows: sppgUsers } = await db.query(
    `SELECT sppg_id FROM sppg_users WHERE user_id = $1 LIMIT 1`, [userId]
  );
  if (!sppgUsers.length) throw { status: 404, message: 'SPPG not found for user' };

  const q = query.q?.trim() || '';
  const limit = parseInt(query.limit || '50');

  let sql = `SELECT s.id, s.name, s.level, s.district, s.village, s.address,
                    s.student_count, s.status, s.sppg_id,
                    sp.name as assigned_sppg_name
             FROM schools s
             LEFT JOIN sppgs sp ON sp.id = s.sppg_id`;
  const params: any[] = [];

  if (q.length >= 2) {
    // Smart search with variations for Indonesian school abbreviations
    const searchLower = q.toLowerCase();
    const variations: string[] = [searchLower];

    // Handle abbreviations like SMPN 5 → SMP NEGERI 5
    const abbrMatch = searchLower.match(/^(sd|smp|sma|smk)n\s*(\d+)(.*)$/i);
    if (abbrMatch) {
      const lvl = abbrMatch[1];
      const num = abbrMatch[2];
      const rest = abbrMatch[3] || '';
      variations.push(`${lvl} negeri ${num}${rest}`);
      variations.push(`${lvl}n ${num}${rest}`);
      variations.push(`${lvl}n${num}${rest}`);
    }

    const basicMatch = searchLower.match(/^(sd|smp|sma|smk)\s+(\d+)(.*)$/i);
    if (basicMatch && !abbrMatch) {
      const lvl = basicMatch[1];
      const num = basicMatch[2];
      const rest = basicMatch[3] || '';
      variations.push(`${lvl} negeri ${num}${rest}`);
      variations.push(`${lvl}n ${num}${rest}`);
    }

    const orClauses = variations.map((_, i) => {
      params.push(`%${variations[i]}%`);
      return `LOWER(s.name) LIKE $${params.length}`;
    });

    // Also search district/village on original query
    params.push(`%${searchLower}%`);
    orClauses.push(`LOWER(s.district) LIKE $${params.length}`);
    params.push(`%${searchLower}%`);
    orClauses.push(`LOWER(s.village) LIKE $${params.length}`);

    sql += ` WHERE (${orClauses.join(' OR ')})`;
    sql += ` ORDER BY s.name LIMIT 1000`;
  } else {
    sql += ` ORDER BY s.name LIMIT $1`;
    params.push(limit);
  }

  const { rows } = await db.query(sql, params);

  // Transform results
  const results = rows.map((s: any) => ({
    id: s.id,
    name: s.name,
    address: s.address,
    district: s.district,
    sppg_id: s.sppg_id,
    assigned_sppg_name: s.assigned_sppg_name || null,
    studentCount: s.student_count || 0,
    status: s.status || 'Active',
  }));

  return { schools: results, count: results.length };
}
