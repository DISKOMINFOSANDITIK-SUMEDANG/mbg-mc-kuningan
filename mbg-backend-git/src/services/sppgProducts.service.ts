import { query } from '../db/pool';

export async function getOfftakerProducts(filters: { offtaker_id?: string; is_available?: string }) {
  let sql = `SELECT 
    op.id, op.offtaker_id, op.supplier_price, op.markup_price, op.markup_percentage,
    op.stock_quantity, op.unit, op.is_available, op.notes, op.created_at,
    o.id as offtaker_oid, o.name as offtaker_name, o.address as offtaker_address,
    o.phone as offtaker_phone, o.email as offtaker_email,
    sp.id as sp_id, sp.price_per_unit, sp.stock as sp_stock, sp.availability_status,
    c.id as commodity_id, c.name as commodity_name, c.description as commodity_desc,
    c.unit as commodity_unit, c.photo_url as commodity_photo,
    cc.id as category_id, cc.name as category_name
  FROM offtaker_products op
  LEFT JOIN offtakers o ON op.offtaker_id = o.id
  LEFT JOIN supplier_products sp ON op.supplier_product_id = sp.id
  LEFT JOIN commodities c ON sp.commodity_id = c.id
  LEFT JOIN commodity_categories cc ON c.category_id = cc.id`;

  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.offtaker_id) {
    params.push(filters.offtaker_id);
    conditions.push(`op.offtaker_id = $${params.length}`);
  }
  if (filters.is_available !== undefined) {
    params.push(filters.is_available === 'true');
    conditions.push(`op.is_available = $${params.length}`);
  }

  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY op.created_at DESC';

  const { rows } = await query(sql, params);

  return rows.map((r: any) => ({
    id: r.id,
    offtaker_id: r.offtaker_id,
    supplier_price: r.supplier_price,
    markup_price: r.markup_price,
    markup_percentage: r.markup_percentage,
    stock_quantity: r.sp_stock || 0,
    unit: r.unit || r.commodity_unit || 'Kg',
    is_available: r.is_available,
    notes: r.notes,
    created_at: r.created_at,
    offtakers: r.offtaker_oid ? {
      id: r.offtaker_oid, name: r.offtaker_name,
      address: r.offtaker_address, phone: r.offtaker_phone, email: r.offtaker_email,
    } : null,
    supplier_products: r.sp_id ? {
      id: r.sp_id, price_per_unit: r.price_per_unit, stock: r.sp_stock,
      availability_status: r.availability_status,
      commodities: r.commodity_id ? {
        id: r.commodity_id, name: r.commodity_name, description: r.commodity_desc,
        unit: r.commodity_unit, photo_url: r.commodity_photo,
        commodity_categories: r.category_id ? { id: r.category_id, name: r.category_name } : null,
      } : null,
    } : null,
  }));
}

export async function getSupplierProducts(filters: { supplier_id?: string }) {
  let sql = `SELECT 
    sp.id, sp.supplier_id, sp.commodity_id, sp.price_per_unit, sp.stock,
    sp.availability_status, sp.notes, sp.created_at,
    s.id as sup_id, s.name as sup_name, s.address as sup_address, s.district as sup_district,
    s.phone as sup_phone, s.email as sup_email, s.logo_url as sup_logo,
    c.id as com_id, c.name as com_name, c.description as com_desc,
    c.unit as com_unit, c.photo_url as com_photo,
    cc.id as cat_id, cc.name as cat_name
  FROM supplier_products sp
  LEFT JOIN suppliers s ON sp.supplier_id = s.id
  LEFT JOIN commodities c ON sp.commodity_id = c.id
  LEFT JOIN commodity_categories cc ON c.category_id = cc.id
  WHERE sp.availability_status = 'available' AND sp.stock > 0`;

  const params: any[] = [];
  if (filters.supplier_id) {
    params.push(filters.supplier_id);
    sql += ` AND sp.supplier_id = $${params.length}`;
  }
  sql += ' ORDER BY sp.created_at DESC';

  const { rows } = await query(sql, params);

  return rows
    .filter((r: any) => r.sup_id) // Only active suppliers
    .map((r: any) => ({
      id: r.id, supplier_id: r.supplier_id, commodity_id: r.commodity_id,
      price_per_unit: r.price_per_unit, stock: r.stock,
      availability_status: r.availability_status, notes: r.notes, created_at: r.created_at,
      suppliers: {
        id: r.sup_id, name: r.sup_name, address: r.sup_address, district: r.sup_district,
        phone: r.sup_phone, email: r.sup_email, logo_url: r.sup_logo,
      },
      commodities: r.com_id ? {
        id: r.com_id, name: r.com_name, description: r.com_desc,
        unit: r.com_unit, photo_url: r.com_photo,
        commodity_categories: r.cat_id ? { id: r.cat_id, name: r.cat_name } : null,
      } : null,
    }));
}

export async function getProductRequests(sppgId: string, status?: string) {
  let sql = `SELECT 
    pr.id, pr.request_number, pr.sppg_id, pr.offtaker_id, pr.offtaker_product_id,
    pr.requested_quantity, pr.unit, pr.estimated_price, pr.status,
    pr.request_notes, pr.response_notes, pr.requested_by, pr.responded_by,
    pr.responded_at, pr.created_at, pr.updated_at,
    o.id as off_id, o.name as off_name, o.phone as off_phone, o.email as off_email,
    op.id as op_id, op.markup_price as op_markup, op.unit as op_unit,
    c.id as com_id, c.name as com_name, c.photo_url as com_photo, c.unit as com_unit
  FROM sppg_product_requests pr
  LEFT JOIN offtakers o ON pr.offtaker_id = o.id
  LEFT JOIN offtaker_products op ON pr.offtaker_product_id = op.id
  LEFT JOIN supplier_products sp ON op.supplier_product_id = sp.id
  LEFT JOIN commodities c ON sp.commodity_id = c.id
  WHERE pr.sppg_id = $1`;

  const params: any[] = [sppgId];
  if (status) {
    params.push(status);
    sql += ` AND pr.status = $${params.length}`;
  }
  sql += ' ORDER BY pr.created_at DESC';

  const { rows } = await query(sql, params);

  return rows.map((r: any) => ({
    id: r.id, request_number: r.request_number, sppg_id: r.sppg_id,
    offtaker_id: r.offtaker_id, offtaker_product_id: r.offtaker_product_id,
    requested_quantity: r.requested_quantity, unit: r.unit,
    estimated_price: r.estimated_price, status: r.status,
    request_notes: r.request_notes, response_notes: r.response_notes,
    requested_by: r.requested_by, responded_by: r.responded_by,
    responded_at: r.responded_at, created_at: r.created_at, updated_at: r.updated_at,
    offtakers: r.off_id ? { id: r.off_id, name: r.off_name, phone: r.off_phone, email: r.off_email } : null,
    offtaker_products: r.op_id ? {
      id: r.op_id, markup_price: r.op_markup, unit: r.op_unit,
      supplier_products: { commodities: r.com_id ? { id: r.com_id, name: r.com_name, photo_url: r.com_photo, unit: r.com_unit } : null },
    } : null,
  }));
}

export async function createProductRequest(sppgId: string, userId: string, body: any) {
  const { offtaker_id, offtaker_product_id, requested_quantity, unit, request_notes } = body;

  if (!offtaker_id || !offtaker_product_id || !requested_quantity || !unit) {
    throw new Error('Missing required fields: offtaker_id, offtaker_product_id, requested_quantity, unit');
  }
  if (requested_quantity <= 0) {
    throw new Error('Requested quantity must be greater than 0');
  }

  // Verify product
  const { rows: [product] } = await query(
    'SELECT id, offtaker_id, markup_price, is_available FROM offtaker_products WHERE id = $1',
    [offtaker_product_id]
  );

  if (!product) throw Object.assign(new Error('Product not found'), { status: 404 });
  if (!product.is_available) throw Object.assign(new Error('Product is not available'), { status: 400 });
  if (product.offtaker_id !== offtaker_id) throw Object.assign(new Error('Product does not belong to specified offtaker'), { status: 400 });

  const estimatedPrice = Number(product.markup_price) * Number(requested_quantity);
  const requestNumber = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  const { rows: [created] } = await query(
    `INSERT INTO sppg_product_requests 
      (request_number, sppg_id, offtaker_id, offtaker_product_id, requested_quantity, unit, estimated_price, status, request_notes, requested_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9)
    RETURNING *`,
    [requestNumber, sppgId, offtaker_id, offtaker_product_id, Number(requested_quantity), unit, estimatedPrice, request_notes || null, userId]
  );

  return created;
}
