import db from '../../db/pool';

// Helper to get entity ID from user
async function getOfftakerId(userId: string): Promise<string | null> {
  const { rows } = await db.query(`SELECT offtaker_id FROM offtaker_users WHERE user_id = $1`, [userId]);
  return rows[0]?.offtaker_id || null;
}

async function getSupplierId(userId: string): Promise<string | null> {
  const { rows } = await db.query(`SELECT supplier_id FROM supplier_users WHERE user_id = $1`, [userId]);
  return rows[0]?.supplier_id || null;
}

function generateSaleNumber(): string {
  const now = new Date();
  const y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, '0'), d = String(now.getDate()).padStart(2, '0');
  return `SO-${y}${m}${d}-${String(now.getTime()).slice(-6)}`;
}

function generatePurchaseNumber(): string {
  const now = new Date();
  const y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, '0'), d = String(now.getDate()).padStart(2, '0');
  return `PO-${y}${m}${d}-${String(now.getTime()).slice(-6)}`;
}

// ========== Offtaker Sales ==========
export async function listOfftakerSales(
  query: { sppg_id?: string; start_date?: string; end_date?: string; payment_status?: string; page?: number; limit?: number },
  userId?: string, userRole?: string
) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const offset = (page - 1) * limit;
  const params: any[] = [];
  let paramIdx = 1;
  let whereClause = 'WHERE 1=1';

  if (userRole === 'offtaker' && userId) {
    const offtakerId = await getOfftakerId(userId);
    if (!offtakerId) throw { status: 403, message: 'Offtaker tidak ditemukan untuk user ini' };
    whereClause += ` AND os.offtaker_id = $${paramIdx++}`;
    params.push(offtakerId);
  }
  if (query.sppg_id) { whereClause += ` AND os.sppg_id = $${paramIdx++}`; params.push(query.sppg_id); }
  if (query.start_date) { whereClause += ` AND os.sale_date >= $${paramIdx++}`; params.push(query.start_date); }
  if (query.end_date) { whereClause += ` AND os.sale_date <= $${paramIdx++}`; params.push(query.end_date); }
  if (query.payment_status) { whereClause += ` AND os.payment_status = $${paramIdx++}`; params.push(query.payment_status); }

  const countResult = await db.query(`SELECT COUNT(*) FROM offtaker_sales os ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count);

  const { rows } = await db.query(
    `SELECT os.*, o.name as offtaker_name, s.name as sppg_name, s.location as sppg_location, s.phone as sppg_phone,
            sc.name as school_name, sc.address as school_address
     FROM offtaker_sales os
     LEFT JOIN offtakers o ON o.id = os.offtaker_id
     LEFT JOIN sppgs s ON s.id = os.sppg_id
     LEFT JOIN schools sc ON sc.id = os.school_id
     ${whereClause}
     ORDER BY os.sale_date DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  // Enrich with items
  if (rows.length > 0) {
    const saleIds = rows.map((s: any) => s.id);
    const { rows: items } = await db.query(
      `SELECT osi.*, op.supplier_price, op.markup_price,
              c.name as commodity_name, c.unit as commodity_unit
       FROM offtaker_sale_items osi
       LEFT JOIN offtaker_products op ON op.id = osi.offtaker_product_id
       LEFT JOIN supplier_products sp ON sp.id = op.supplier_product_id
       LEFT JOIN commodities c ON c.id = sp.commodity_id
       WHERE osi.sale_id = ANY($1)`,
      [saleIds]
    );
    const itemsBySale: Record<string, any[]> = {};
    for (const item of items) {
      if (!itemsBySale[item.sale_id]) itemsBySale[item.sale_id] = [];
      itemsBySale[item.sale_id].push(item);
    }
    for (const sale of rows) { sale.items = itemsBySale[sale.id] || []; }
  }

  return { data: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getOfftakerSaleById(id: string, userId?: string, userRole?: string) {
  const { rows } = await db.query(
    `SELECT os.*, o.name as offtaker_name, s.name as sppg_name, s.location as sppg_location,
            s.address as sppg_address, s.phone as sppg_phone,
            sc.name as school_name, sc.address as school_address
     FROM offtaker_sales os
     LEFT JOIN offtakers o ON o.id = os.offtaker_id
     LEFT JOIN sppgs s ON s.id = os.sppg_id
     LEFT JOIN schools sc ON sc.id = os.school_id
     WHERE os.id = $1`,
    [id]
  );
  if (!rows[0]) return null;

  if (userRole === 'offtaker' && userId) {
    const offtakerId = await getOfftakerId(userId);
    if (rows[0].offtaker_id !== offtakerId) throw { status: 403, message: 'Anda tidak memiliki akses ke transaksi ini' };
  }

  const { rows: items } = await db.query(
    `SELECT osi.*, op.supplier_price, op.markup_price,
            c.name as commodity_name, c.unit as commodity_unit
     FROM offtaker_sale_items osi
     LEFT JOIN offtaker_products op ON op.id = osi.offtaker_product_id
     LEFT JOIN supplier_products sp ON sp.id = op.supplier_product_id
     LEFT JOIN commodities c ON c.id = sp.commodity_id
     WHERE osi.sale_id = $1`,
    [id]
  );
  rows[0].items = items;
  return { data: rows[0] };
}

export async function createOfftakerSale(data: Record<string, any>, userId?: string, userRole?: string) {
  const { sppg_id, school_id, sale_date, payment_status, payment_method, bank_name, account_number, notes,
    items = [], additional_costs = [], product_request_id } = data;

  let offtakerId: string | null = null;
  if (userRole === 'offtaker' && userId) {
    offtakerId = await getOfftakerId(userId);
    if (!offtakerId) throw { status: 403, message: 'Offtaker tidak ditemukan untuk user ini' };
  } else if (data.offtaker_id) {
    offtakerId = data.offtaker_id;
  } else {
    throw { status: 400, message: 'Offtaker ID wajib diisi' };
  }

  if (!sppg_id || items.length === 0) throw { status: 400, message: 'SPPG dan minimal 1 item wajib diisi' };

  // Verify SPPG
  const { rows: sppgCheck } = await db.query(`SELECT id FROM sppgs WHERE id = $1`, [sppg_id]);
  if (sppgCheck.length === 0) throw { status: 404, message: 'SPPG tidak ditemukan' };

  // Process items
  let totalAmount = 0;
  const processedItems: any[] = [];

  for (const item of items) {
    const { rows: products } = await db.query(
      `SELECT op.*, sp.stock as supplier_stock, sp.id as sp_id, c.name as commodity_name, c.unit as commodity_unit
       FROM offtaker_products op
       LEFT JOIN supplier_products sp ON sp.id = op.supplier_product_id
       LEFT JOIN commodities c ON c.id = sp.commodity_id
       WHERE op.id = $1 AND op.offtaker_id = $2`,
      [item.offtaker_product_id, offtakerId]
    );
    if (products.length === 0) throw { status: 404, message: `Produk tidak ditemukan: ${item.offtaker_product_id}` };

    const product = products[0];
    if ((product.supplier_stock || 0) < item.quantity) {
      throw { status: 400, message: `Stok supplier tidak cukup untuk ${product.commodity_name}. Stok: ${product.supplier_stock}, Diminta: ${item.quantity}` };
    }

    const pricePerUnit = item.price_per_unit || product.markup_price;
    const subtotal = parseFloat(item.quantity) * parseFloat(pricePerUnit);
    totalAmount += subtotal;

    processedItems.push({
      offtaker_product_id: item.offtaker_product_id,
      quantity: parseFloat(item.quantity),
      unit: product.commodity_unit || 'Kg',
      price_per_unit: pricePerUnit,
      subtotal,
      sp_id: product.sp_id,
      supplier_stock: product.supplier_stock
    });
  }

  // Process additional costs
  let additionalCostsTotal = 0;
  const processedCosts = additional_costs.map((cost: any) => {
    const costAmount = parseFloat(cost.total_amount) || 0;
    additionalCostsTotal += costAmount;
    return { additional_cost_id: cost.additional_cost_id || null, cost_name: cost.cost_name, description: cost.description || null,
      unit_type: cost.unit_type, quantity: cost.quantity ? parseFloat(cost.quantity) : null,
      unit_amount: parseFloat(cost.unit_amount), total_amount: costAmount };
  });

  const grandTotal = totalAmount + additionalCostsTotal;
  const saleNumber = generateSaleNumber();

  // Create sale
  const { rows: saleRows } = await db.query(
    `INSERT INTO offtaker_sales (sale_number, offtaker_id, sppg_id, school_id, sale_date, total_amount,
       additional_costs_total, grand_total, payment_status, payment_method, bank_name, account_number,
       delivery_status, notes, created_by, product_request_id, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending',$13,$14,$15, NOW(), NOW()) RETURNING *`,
    [saleNumber, offtakerId, sppg_id, school_id || null,
     sale_date || new Date().toISOString().split('T')[0], totalAmount, additionalCostsTotal, grandTotal,
     payment_status || 'pending', payment_method || null,
     payment_method === 'transfer' ? bank_name : null, payment_method === 'transfer' ? account_number : null,
     notes || null, userId, product_request_id || null]
  );
  const sale = saleRows[0];

  // Create sale items
  for (const item of processedItems) {
    await db.query(
      `INSERT INTO offtaker_sale_items (sale_id, offtaker_product_id, quantity, unit, price_per_unit, subtotal)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [sale.id, item.offtaker_product_id, item.quantity, item.unit, item.price_per_unit, item.subtotal]
    );
  }

  // Create additional costs
  for (const cost of processedCosts) {
    await db.query(
      `INSERT INTO offtaker_sale_additional_costs (sale_id, additional_cost_id, cost_name, description, unit_type, quantity, unit_amount, total_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [sale.id, cost.additional_cost_id, cost.cost_name, cost.description, cost.unit_type, cost.quantity, cost.unit_amount, cost.total_amount]
    );
  }

  // Update supplier stock
  for (const item of processedItems) {
    if (item.sp_id) {
      await db.query(
        `UPDATE supplier_products SET stock = stock - $2, updated_at = NOW() WHERE id = $1`,
        [item.sp_id, item.quantity]
      );
    }
  }

  // Update product request if linked
  if (product_request_id) {
    await db.query(
      `UPDATE sppg_product_requests SET status = 'completed', updated_at = NOW() WHERE id = $1`,
      [product_request_id]
    );
  }

  return { message: 'Penjualan berhasil dicatat', data: sale };
}

// ========== Sales Transactions (Supplier) ==========
export async function listSalesTransactions(userId: string, userRole: string) {
  const allTransactions: any[] = [];

  if (userRole === 'pemasok' || userRole === 'administrator') {
    let supplierFilter = '';
    const params: any[] = [];
    if (userRole === 'pemasok') {
      const supplierId = await getSupplierId(userId);
      if (supplierId) {
        supplierFilter = 'WHERE st.supplier_id = $1';
        params.push(supplierId);
      }
    }
    const { rows } = await db.query(
      `SELECT st.*, s.name as sppg_name, s.address as sppg_address,
              sup.name as supplier_name
       FROM sales_transactions st
       LEFT JOIN sppgs s ON s.id = st.sppg_id
       LEFT JOIN suppliers sup ON sup.id = st.supplier_id
       ${supplierFilter}
       ORDER BY st.created_at DESC`,
      params
    );
    allTransactions.push(...rows.map((t: any) => ({ ...t, transaction_type: 'supplier' })));
  }

  if (userRole === 'offtaker' || userRole === 'administrator') {
    let offtakerFilter = '';
    const params: any[] = [];
    if (userRole === 'offtaker') {
      const offtakerId = await getOfftakerId(userId);
      if (offtakerId) {
        offtakerFilter = 'WHERE os.offtaker_id = $1';
        params.push(offtakerId);
      }
    }
    const { rows } = await db.query(
      `SELECT os.*, s.name as sppg_name, s.address as sppg_address,
              o.name as offtaker_name
       FROM offtaker_sales os
       LEFT JOIN sppgs s ON s.id = os.sppg_id
       LEFT JOIN offtakers o ON o.id = os.offtaker_id
       ${offtakerFilter}
       ORDER BY os.created_at DESC`,
      params
    );
    allTransactions.push(...rows.map((t: any) => ({
      ...t, transaction_type: 'offtaker', transaction_number: t.sale_number, transaction_date: t.sale_date
    })));
  }

  allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return allTransactions;
}

export async function createSalesTransaction(data: Record<string, any>, userId: string, userRole: string) {
  const { sppg_id, items, payment_status, payment_method, bank_name, account_number, transaction_date, notes } = data;

  let supplierId: string | undefined;
  if (userRole === 'administrator') {
    supplierId = data.supplier_id;
    if (!supplierId) throw { status: 400, message: 'supplier_id is required for administrator' };
  } else {
    supplierId = await getSupplierId(userId) || undefined;
    if (!supplierId) throw { status: 400, message: 'Supplier not found for this user' };
  }

  if (!sppg_id || !items || !Array.isArray(items) || items.length === 0) {
    throw { status: 400, message: 'SPPG and at least one item are required' };
  }

  // Validate items
  for (const item of items) {
    if (!item.supplier_product_id || !item.quantity || !item.unit_price) {
      throw { status: 400, message: 'Each item must have supplier_product_id, quantity, and unit_price' };
    }
    const checkQuery = userRole === 'pemasok'
      ? `SELECT id FROM supplier_products WHERE id = $1 AND supplier_id = $2`
      : `SELECT id FROM supplier_products WHERE id = $1`;
    const checkParams = userRole === 'pemasok' ? [item.supplier_product_id, supplierId] : [item.supplier_product_id];
    const { rows: check } = await db.query(checkQuery, checkParams);
    if (check.length === 0) throw { status: 404, message: `Product ${item.supplier_product_id} not found` };
  }

  // Create transaction
  const { rows: txRows } = await db.query(
    `INSERT INTO sales_transactions (supplier_id, sppg_id, transaction_date, payment_status, payment_method,
       bank_name, account_number, notes, created_by, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, NOW(), NOW()) RETURNING *`,
    [supplierId, sppg_id, transaction_date || new Date().toISOString().split('T')[0],
     payment_status || 'pending', payment_method || null,
     payment_method === 'transfer' ? bank_name : null,
     payment_method === 'transfer' ? account_number : null,
     notes || null, userId]
  );
  const transaction = txRows[0];

  // Create items
  for (const item of items) {
    await db.query(
      `INSERT INTO sales_transaction_items (sales_transaction_id, supplier_product_id, quantity, unit_price)
       VALUES ($1,$2,$3,$4)`,
      [transaction.id, item.supplier_product_id, parseFloat(item.quantity), parseFloat(item.unit_price)]
    );
  }

  return transaction;
}

export async function getSalesTransactionById(id: string) {
  const { rows } = await db.query(
    `SELECT st.*, s.name as sppg_name, s.address as sppg_address, s.phone as sppg_phone,
            sup.name as supplier_name, sup.address as supplier_address, sup.phone as supplier_phone
     FROM sales_transactions st
     LEFT JOIN sppgs s ON s.id = st.sppg_id
     LEFT JOIN suppliers sup ON sup.id = st.supplier_id
     WHERE st.id = $1`,
    [id]
  );
  if (!rows[0]) return null;

  const { rows: items } = await db.query(
    `SELECT sti.*, sp.price_per_unit as product_price, c.name as commodity_name, c.unit as commodity_unit
     FROM sales_transaction_items sti
     LEFT JOIN supplier_products sp ON sp.id = sti.supplier_product_id
     LEFT JOIN commodities c ON c.id = sp.commodity_id
     WHERE sti.sales_transaction_id = $1`,
    [id]
  );
  rows[0].items = items;
  return rows[0];
}

export async function updateSalesTransaction(id: string, data: Record<string, any>, userId: string, userRole: string) {
  // Ownership check for pemasok
  const { rows: existing } = await db.query(`SELECT supplier_id FROM sales_transactions WHERE id = $1`, [id]);
  if (existing.length === 0) throw { status: 404, message: 'Transaction not found' };

  if (userRole === 'pemasok') {
    const supplierId = await getSupplierId(userId);
    if (existing[0].supplier_id !== supplierId) {
      throw { status: 403, message: 'You can only edit your own transactions' };
    }
  }

  const fields: string[] = ['updated_at = NOW()'];
  const params: any[] = [id];
  let idx = 2;

  if (data.sppg_id) { fields.push(`sppg_id = $${idx++}`); params.push(data.sppg_id); }
  if (data.supplier_id && userRole === 'administrator') { fields.push(`supplier_id = $${idx++}`); params.push(data.supplier_id); }
  if (data.transaction_date) { fields.push(`transaction_date = $${idx++}`); params.push(data.transaction_date); }
  if (data.payment_status) { fields.push(`payment_status = $${idx++}`); params.push(data.payment_status); }
  if (data.payment_method) { fields.push(`payment_method = $${idx++}`); params.push(data.payment_method); }
  if (data.notes !== undefined) { fields.push(`notes = $${idx++}`); params.push(data.notes); }

  // Handle items replacement
  if (data.items && Array.isArray(data.items)) {
    const total = data.items.reduce((sum: number, item: any) => sum + parseFloat(item.quantity) * parseFloat(item.unit_price), 0);
    fields.push(`total_amount = $${idx++}`);
    params.push(Math.round(total));

    await db.query(`DELETE FROM sales_transaction_items WHERE sales_transaction_id = $1`, [id]);
    for (const item of data.items) {
      const subtotal = Math.round(parseFloat(item.quantity) * parseFloat(item.unit_price));
      await db.query(
        `INSERT INTO sales_transaction_items (sales_transaction_id, supplier_product_id, quantity, unit_price, subtotal)
         VALUES ($1,$2,$3,$4,$5)`,
        [id, item.supplier_product_id, parseFloat(item.quantity), parseFloat(item.unit_price), subtotal]
      );
    }
  }

  const { rows } = await db.query(`UPDATE sales_transactions SET ${fields.join(', ')} WHERE id = $1 RETURNING *`, params);
  return rows[0];
}

export async function deleteSalesTransaction(id: string, userId: string, userRole: string) {
  // Try sales_transactions first
  const { rows: stCheck } = await db.query(`SELECT supplier_id FROM sales_transactions WHERE id = $1`, [id]);
  if (stCheck.length > 0) {
    if (userRole === 'pemasok') {
      const supplierId = await getSupplierId(userId);
      if (stCheck[0].supplier_id !== supplierId) throw { status: 403, message: 'Forbidden' };
    }
    await db.query(`DELETE FROM sales_transaction_items WHERE sales_transaction_id = $1`, [id]);
    await db.query(`DELETE FROM sales_transactions WHERE id = $1`, [id]);
    return { message: 'Supplier transaction deleted successfully', transaction_type: 'supplier' };
  }

  // Try offtaker_sales
  const { rows: osCheck } = await db.query(`SELECT offtaker_id FROM offtaker_sales WHERE id = $1`, [id]);
  if (osCheck.length > 0) {
    if (userRole === 'offtaker') {
      const offtakerId = await getOfftakerId(userId);
      if (osCheck[0].offtaker_id !== offtakerId) throw { status: 403, message: 'Forbidden' };
    }
    await db.query(`DELETE FROM offtaker_sale_items WHERE sale_id = $1`, [id]);
    await db.query(`DELETE FROM offtaker_sales WHERE id = $1`, [id]);
    return { message: 'Offtaker sale deleted successfully', transaction_type: 'offtaker' };
  }

  throw { status: 404, message: 'Transaction not found' };
}

// ========== Offtaker Purchases ==========
export async function listOfftakerPurchases(
  query: { supplier_id?: string; start_date?: string; end_date?: string; page?: number; limit?: number },
  userId?: string, userRole?: string
) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const offset = (page - 1) * limit;
  const params: any[] = [];
  let paramIdx = 1;
  let whereClause = 'WHERE 1=1';

  if (userRole === 'offtaker' && userId) {
    const offtakerId = await getOfftakerId(userId);
    if (!offtakerId) throw { status: 403, message: 'Offtaker tidak ditemukan untuk user ini' };
    whereClause += ` AND op.offtaker_id = $${paramIdx++}`;
    params.push(offtakerId);
  }
  if (query.supplier_id) { whereClause += ` AND op.supplier_id = $${paramIdx++}`; params.push(query.supplier_id); }
  if (query.start_date) { whereClause += ` AND op.purchase_date >= $${paramIdx++}`; params.push(query.start_date); }
  if (query.end_date) { whereClause += ` AND op.purchase_date <= $${paramIdx++}`; params.push(query.end_date); }

  const countResult = await db.query(`SELECT COUNT(*) FROM offtaker_purchases op ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count);

  const { rows } = await db.query(
    `SELECT op.*, sup.name as supplier_name, sup.phone as supplier_phone, sup.address as supplier_address,
            o.name as offtaker_name,
            c.name as commodity_name, c.unit as commodity_unit, cc.name as category_name
     FROM offtaker_purchases op
     LEFT JOIN suppliers sup ON sup.id = op.supplier_id
     LEFT JOIN offtakers o ON o.id = op.offtaker_id
     LEFT JOIN supplier_products sp ON sp.id = op.supplier_product_id
     LEFT JOIN commodities c ON c.id = sp.commodity_id
     LEFT JOIN commodity_categories cc ON cc.id = c.category_id
     ${whereClause}
     ORDER BY op.purchase_date DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  // Enrich with additional costs
  if (rows.length > 0) {
    const purchaseIds = rows.map((p: any) => p.id);
    const { rows: costs } = await db.query(
      `SELECT opac.*, act.name as cost_type_name, act.calculation_type
       FROM offtaker_purchase_additional_costs opac
       LEFT JOIN additional_cost_types act ON act.id = opac.cost_type_id
       WHERE opac.purchase_id = ANY($1)`,
      [purchaseIds]
    );
    const costsByPurchase: Record<string, any[]> = {};
    for (const c of costs) {
      if (!costsByPurchase[c.purchase_id]) costsByPurchase[c.purchase_id] = [];
      costsByPurchase[c.purchase_id].push(c);
    }
    for (const p of rows) { p.additional_costs = costsByPurchase[p.id] || []; }
  }

  return { data: rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function createOfftakerPurchase(data: Record<string, any>, userId?: string, userRole?: string) {
  const { supplier_id, supplier_product_id, quantity, price_per_unit, purchase_date, notes, additional_costs = [] } = data;

  let offtakerId: string | null = null;
  if (userRole === 'offtaker' && userId) {
    offtakerId = await getOfftakerId(userId);
    if (!offtakerId) throw { status: 403, message: 'Offtaker tidak ditemukan untuk user ini' };
  } else if (data.offtaker_id) {
    offtakerId = data.offtaker_id;
  } else {
    throw { status: 400, message: 'Offtaker ID wajib diisi' };
  }

  if (!supplier_id || !supplier_product_id || !quantity || !price_per_unit) {
    throw { status: 400, message: 'Supplier, produk, jumlah, dan harga wajib diisi' };
  }

  // Get product details
  const { rows: prodRows } = await db.query(
    `SELECT sp.*, c.unit as commodity_unit FROM supplier_products sp LEFT JOIN commodities c ON c.id = sp.commodity_id WHERE sp.id = $1`,
    [supplier_product_id]
  );
  if (prodRows.length === 0) throw { status: 404, message: 'Produk supplier tidak ditemukan' };
  const product = prodRows[0];

  const subtotal = parseFloat(quantity) * parseFloat(price_per_unit);
  let totalAdditionalCosts = 0;
  const processedCosts = additional_costs.map((cost: any) => {
    const costAmount = parseFloat(cost.amount) || 0;
    const costQty = parseFloat(cost.quantity) || 1;
    const costTotal = costAmount * costQty;
    totalAdditionalCosts += costTotal;
    return { cost_type_id: cost.cost_type_id, description: cost.description, amount: costAmount, quantity: costQty, total: costTotal };
  });
  const grandTotal = subtotal + totalAdditionalCosts;
  const purchaseNumber = generatePurchaseNumber();

  const { rows: purchaseRows } = await db.query(
    `INSERT INTO offtaker_purchases (purchase_number, offtaker_id, supplier_id, supplier_product_id, quantity, unit,
       price_per_unit, subtotal, total_additional_costs, grand_total, purchase_date, status, notes, created_by, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'completed',$12,$13, NOW(), NOW()) RETURNING *`,
    [purchaseNumber, offtakerId, supplier_id, supplier_product_id, parseFloat(quantity),
     product.commodity_unit || 'Kg', parseFloat(price_per_unit), subtotal, totalAdditionalCosts, grandTotal,
     purchase_date || new Date().toISOString().split('T')[0], notes || null, userId]
  );
  const purchase = purchaseRows[0];

  // Create additional costs
  for (const cost of processedCosts) {
    await db.query(
      `INSERT INTO offtaker_purchase_additional_costs (purchase_id, cost_type_id, description, amount, quantity, total)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [purchase.id, cost.cost_type_id, cost.description, cost.amount, cost.quantity, cost.total]
    );
  }

  // Upsert offtaker product stock
  const { rows: existingProd } = await db.query(
    `SELECT id, stock_quantity FROM offtaker_products WHERE offtaker_id = $1 AND supplier_product_id = $2`,
    [offtakerId, supplier_product_id]
  );

  if (existingProd.length > 0) {
    await db.query(
      `UPDATE offtaker_products SET stock_quantity = stock_quantity + $2, supplier_price = $3, updated_at = NOW() WHERE id = $1`,
      [existingProd[0].id, parseFloat(quantity), parseFloat(price_per_unit)]
    );
  } else {
    await db.query(
      `INSERT INTO offtaker_products (offtaker_id, supplier_product_id, supplier_price, markup_price, markup_percentage,
         stock_quantity, unit, is_available) VALUES ($1,$2,$3,$3,0,$4,$5,true)`,
      [offtakerId, supplier_product_id, parseFloat(price_per_unit), parseFloat(quantity), product.commodity_unit || 'Kg']
    );
  }

  return { message: 'Pembelian berhasil dicatat', data: purchase };
}

// ========== Additional Costs ==========
export async function listAdditionalCosts(query: { active?: string }) {
  let whereClause = '';
  const params: any[] = [];
  if (query.active !== undefined) {
    whereClause = 'WHERE is_active = $1';
    params.push(query.active === 'true');
  }
  const { rows } = await db.query(`SELECT * FROM additional_costs ${whereClause} ORDER BY created_at DESC`, params);
  return { data: rows };
}

export async function createAdditionalCost(data: Record<string, any>) {
  const { name, description, default_amount, is_active } = data;
  if (!name) throw { status: 400, message: 'Nama wajib diisi' };

  const { rows } = await db.query(
    `INSERT INTO additional_costs (name, description, unit_type, default_amount, is_active, created_at, updated_at)
     VALUES ($1,$2,'flat',$3,$4, NOW(), NOW()) RETURNING *`,
    [name, description || null, default_amount || null, is_active !== false]
  );
  return { message: 'Biaya tambahan berhasil ditambahkan', data: rows[0] };
}

export async function updateAdditionalCost(data: Record<string, any>) {
  const { id, name, description, default_amount, is_active } = data;
  if (!id) throw { status: 400, message: 'ID wajib diisi' };
  if (!name) throw { status: 400, message: 'Nama wajib diisi' };

  const { rows } = await db.query(
    `UPDATE additional_costs SET name=$2, description=$3, unit_type='flat', default_amount=$4, is_active=$5, updated_at=NOW()
     WHERE id = $1 RETURNING *`,
    [id, name, description || null, default_amount || null, is_active]
  );
  return { message: 'Biaya tambahan berhasil diperbarui', data: rows[0] };
}

export async function deleteAdditionalCost(id: string) {
  await db.query(`DELETE FROM additional_costs WHERE id = $1`, [id]);
  return { message: 'Biaya tambahan berhasil dihapus' };
}

// ========== Additional Cost Types ==========
export async function listAdditionalCostTypes(query: { active?: string }) {
  let whereClause = '';
  const params: any[] = [];
  if (query.active === 'true') { whereClause = 'WHERE is_active = true'; }
  const { rows } = await db.query(`SELECT * FROM additional_cost_types ${whereClause} ORDER BY name`, params);
  return { data: rows };
}

export async function getAdditionalCostTypeById(id: string) {
  const { rows } = await db.query(`SELECT * FROM additional_cost_types WHERE id = $1`, [id]);
  if (!rows[0]) throw { status: 404, message: 'Data tidak ditemukan' };
  return { data: rows[0] };
}

export async function createAdditionalCostType(data: Record<string, any>) {
  const { name, description, calculation_type, default_amount, is_active } = data;
  if (!name || !calculation_type) throw { status: 400, message: 'Nama dan tipe perhitungan wajib diisi' };
  const validTypes = ['per_kg', 'per_km', 'flat', 'percentage'];
  if (!validTypes.includes(calculation_type)) throw { status: 400, message: 'Tipe perhitungan tidak valid' };

  const { rows } = await db.query(
    `INSERT INTO additional_cost_types (name, description, calculation_type, default_amount, is_active, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5, NOW(), NOW()) RETURNING *`,
    [name, description || null, calculation_type, default_amount || 0, is_active !== false]
  );
  return { message: 'Jenis biaya tambahan berhasil ditambahkan', data: rows[0] };
}

export async function updateAdditionalCostType(id: string, data: Record<string, any>) {
  const fields: string[] = ['updated_at = NOW()'];
  const params: any[] = [id];
  let idx = 2;

  if (data.name !== undefined) { fields.push(`name = $${idx++}`); params.push(data.name); }
  if (data.description !== undefined) { fields.push(`description = $${idx++}`); params.push(data.description); }
  if (data.calculation_type !== undefined) {
    const validTypes = ['per_kg', 'per_km', 'flat', 'percentage'];
    if (!validTypes.includes(data.calculation_type)) throw { status: 400, message: 'Tipe perhitungan tidak valid' };
    fields.push(`calculation_type = $${idx++}`); params.push(data.calculation_type);
  }
  if (data.default_amount !== undefined) { fields.push(`default_amount = $${idx++}`); params.push(data.default_amount); }
  if (data.is_active !== undefined) { fields.push(`is_active = $${idx++}`); params.push(data.is_active); }

  const { rows } = await db.query(`UPDATE additional_cost_types SET ${fields.join(', ')} WHERE id = $1 RETURNING *`, params);
  return { message: 'Jenis biaya tambahan berhasil diperbarui', data: rows[0] };
}

export async function deleteAdditionalCostType(id: string) {
  await db.query(`DELETE FROM additional_cost_types WHERE id = $1`, [id]);
  return { message: 'Jenis biaya tambahan berhasil dihapus' };
}

// ========== Unified Transactions ==========
export async function getUnifiedTransactions(userId: string, userRole: string, query: Record<string, string>) {
  const { type, status, payment_status, start_date, end_date, page = '1', limit = '20' } = query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  let whereClauses: string[] = [];
  const params: any[] = [];
  let idx = 1;

  // Role-based filtering
  if (userRole === 'pemasok') {
    const suppId = await getSupplierId(userId);
    if (suppId) {
      whereClauses.push(`t.seller_type = 'supplier' AND t.seller_id = $${idx++}`);
      params.push(suppId);
    }
  } else if (userRole === 'offtaker') {
    const offId = await getOfftakerId(userId);
    if (offId) {
      whereClauses.push(`((t.seller_type = 'offtaker' AND t.seller_id = $${idx}) OR (t.buyer_type = 'offtaker' AND t.buyer_id = $${idx}))`);
      params.push(offId);
      idx++;
    }
  } else if (userRole === 'sppg') {
    const { rows: sppgRows } = await db.query(`SELECT sppg_id FROM sppg_users WHERE user_id = $1`, [userId]);
    if (sppgRows.length) {
      whereClauses.push(`t.buyer_type = 'sppg' AND t.buyer_id = $${idx++}`);
      params.push(sppgRows[0].sppg_id);
    }
  }
  // administrator sees all

  if (type) { whereClauses.push(`t.transaction_type = $${idx++}`); params.push(type); }
  if (status) { whereClauses.push(`t.status = $${idx++}`); params.push(status); }
  if (payment_status) { whereClauses.push(`t.payment_status = $${idx++}`); params.push(payment_status); }
  if (start_date) { whereClauses.push(`t.transaction_date >= $${idx++}`); params.push(start_date); }
  if (end_date) { whereClauses.push(`t.transaction_date <= $${idx++}`); params.push(end_date); }

  const where = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

  // Count
  const { rows: countRows } = await db.query(
    `SELECT COUNT(*)::int as total FROM transactions t ${where}`, params
  );
  const total = countRows[0]?.total || 0;

  // Fetch with seller/buyer names
  const dataParams = [...params, limitNum, offset];
  const { rows } = await db.query(
    `SELECT t.*,
            CASE WHEN t.seller_type = 'supplier' THEN (SELECT name FROM suppliers WHERE id = t.seller_id)
                 WHEN t.seller_type = 'offtaker' THEN (SELECT name FROM offtakers WHERE id = t.seller_id)
            END as seller_name,
            CASE WHEN t.buyer_type = 'offtaker' THEN (SELECT name FROM offtakers WHERE id = t.buyer_id)
                 WHEN t.buyer_type = 'sppg' THEN (SELECT name FROM sppgs WHERE id = t.buyer_id)
            END as buyer_name,
            (SELECT COUNT(*)::int FROM transaction_items WHERE transaction_id = t.id) as items_count
     FROM transactions t ${where}
     ORDER BY t.transaction_date DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    dataParams
  );

  return {
    data: rows,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
  };
}

export async function createUnifiedTransaction(userId: string, body: Record<string, any>) {
  const {
    transaction_type, seller_type, seller_id, buyer_type, buyer_id,
    items, additional_costs, payment_method, payment_status = 'pending', notes
  } = body;

  if (!transaction_type || !seller_type || !seller_id || !buyer_type || !buyer_id || !items?.length) {
    throw { status: 400, message: 'Data transaksi tidak lengkap' };
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Calculate totals
    let totalAmount = 0;
    items.forEach((item: any) => {
      totalAmount += parseFloat(item.quantity) * parseFloat(item.unit_price);
    });

    let additionalCostsTotal = 0;
    if (additional_costs?.length) {
      additional_costs.forEach((c: any) => { additionalCostsTotal += parseFloat(c.total_amount || 0); });
    }

    const grandTotal = totalAmount + additionalCostsTotal;

    // Create transaction
    const { rows: [transaction] } = await client.query(
      `INSERT INTO transactions (transaction_type, seller_type, seller_id, seller_user_id,
         buyer_type, buyer_id, total_amount, additional_costs_total, grand_total,
         payment_status, payment_method, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'completed')
       RETURNING *`,
      [transaction_type, seller_type, seller_id, userId, buyer_type, buyer_id,
       totalAmount, additionalCostsTotal, grandTotal, payment_status, payment_method || null, notes || null]
    );

    // Create items
    for (const item of items) {
      await client.query(
        `INSERT INTO transaction_items (transaction_id, product_type, product_id, commodity_id,
           product_name, quantity, unit, unit_price, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [transaction.id, item.product_type, item.product_id, item.commodity_id || null,
         item.product_name, item.quantity, item.unit, item.unit_price,
         parseFloat(item.quantity) * parseFloat(item.unit_price)]
      );
    }

    // Create additional costs
    if (additional_costs?.length) {
      for (const cost of additional_costs) {
        await client.query(
          `INSERT INTO transaction_additional_costs (transaction_id, additional_cost_id, cost_name,
             description, unit_type, quantity, unit_amount, total_amount)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [transaction.id, cost.additional_cost_id, cost.cost_name,
           cost.description || null, cost.unit_type, cost.quantity, cost.unit_amount, cost.total_amount]
        );
      }
    }

    await client.query('COMMIT');
    return { message: 'Transaksi berhasil dibuat', data: transaction };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
