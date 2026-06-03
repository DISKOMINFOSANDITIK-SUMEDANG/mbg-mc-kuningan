import { query } from '../db/pool';

export async function getOfftakerId(userId: string): Promise<string | null> {
  const { rows } = await query(
    'SELECT offtaker_id FROM offtaker_users WHERE user_id = $1',
    [userId]
  );
  return rows[0]?.offtaker_id || null;
}

export async function getRequests(offtakerId: string, status?: string) {
  let sql = `SELECT 
    pr.*,
    sp.id as sppg_oid, sp.name as sppg_name, sp.type as sppg_type, sp.location as sppg_location,
    sp.phone as sppg_phone, sp.email as sppg_email, sp.address as sppg_address,
    op.id as op_id, op.markup_price as op_markup, op.stock_quantity as op_stock, op.unit as op_unit,
    supsp.id as supsp_id,
    c.id as com_id, c.name as com_name, c.photo_url as com_photo, c.unit as com_unit
  FROM sppg_product_requests pr
  LEFT JOIN sppgs sp ON pr.sppg_id = sp.id
  LEFT JOIN offtaker_products op ON pr.offtaker_product_id = op.id
  LEFT JOIN supplier_products supsp ON op.supplier_product_id = supsp.id
  LEFT JOIN commodities c ON supsp.commodity_id = c.id
  WHERE pr.offtaker_id = $1`;

  const params: any[] = [offtakerId];
  if (status) {
    params.push(status);
    sql += ` AND pr.status = $${params.length}`;
  }
  sql += ' ORDER BY pr.created_at DESC';

  const { rows } = await query(sql, params);

  return rows.map((r: any) => ({
    ...r,
    // Remove joined columns, add nested objects
    sppg_oid: undefined, sppg_name: undefined, sppg_type: undefined,
    sppg_location: undefined, sppg_phone: undefined, sppg_email: undefined, sppg_address: undefined,
    op_id: undefined, op_markup: undefined, op_stock: undefined, op_unit: undefined,
    supsp_id: undefined, com_id: undefined, com_name: undefined, com_photo: undefined, com_unit: undefined,
    sppgs: r.sppg_oid ? {
      id: r.sppg_oid, name: r.sppg_name, type: r.sppg_type,
      location: r.sppg_location, phone: r.sppg_phone, email: r.sppg_email, address: r.sppg_address,
    } : null,
    offtaker_products: r.op_id ? {
      id: r.op_id, markup_price: r.op_markup, stock_quantity: r.op_stock, unit: r.op_unit,
      supplier_products: r.supsp_id ? {
        commodities: r.com_id ? { id: r.com_id, name: r.com_name, photo_url: r.com_photo, unit: r.com_unit } : null,
      } : null,
    } : null,
  }));
}

export async function getRequestById(requestId: string, offtakerId: string) {
  const { rows } = await query(
    `SELECT 
      pr.*,
      sp.id as sppg_oid, sp.name as sppg_name, sp.type as sppg_type, sp.location as sppg_location,
      sp.phone as sppg_phone, sp.email as sppg_email, sp.address as sppg_address,
      op.id as op_id, op.markup_price as op_markup, op.stock_quantity as op_stock, op.unit as op_unit,
      supsp.id as supsp_id,
      c.id as com_id, c.name as com_name, c.photo_url as com_photo, c.unit as com_unit
    FROM sppg_product_requests pr
    LEFT JOIN sppgs sp ON pr.sppg_id = sp.id
    LEFT JOIN offtaker_products op ON pr.offtaker_product_id = op.id
    LEFT JOIN supplier_products supsp ON op.supplier_product_id = supsp.id
    LEFT JOIN commodities c ON supsp.commodity_id = c.id
    WHERE pr.id = $1 AND pr.offtaker_id = $2`,
    [requestId, offtakerId]
  );

  if (!rows[0]) return null;

  const r = rows[0];
  return {
    ...r,
    sppg_oid: undefined, sppg_name: undefined, sppg_type: undefined,
    sppg_location: undefined, sppg_phone: undefined, sppg_email: undefined, sppg_address: undefined,
    op_id: undefined, op_markup: undefined, op_stock: undefined, op_unit: undefined,
    supsp_id: undefined, com_id: undefined, com_name: undefined, com_photo: undefined, com_unit: undefined,
    sppgs: r.sppg_oid ? {
      id: r.sppg_oid, name: r.sppg_name, type: r.sppg_type,
      location: r.sppg_location, phone: r.sppg_phone, email: r.sppg_email, address: r.sppg_address,
    } : null,
    offtaker_products: r.op_id ? {
      id: r.op_id, markup_price: r.op_markup, stock_quantity: r.op_stock, unit: r.op_unit,
      supplier_products: r.supsp_id ? {
        commodities: r.com_id ? { id: r.com_id, name: r.com_name, photo_url: r.com_photo, unit: r.com_unit } : null,
      } : null,
    } : null,
  };
}

export async function updateRequest(requestId: string, offtakerId: string, userId: string, body: { status: string; response_notes?: string }) {
  const { status, response_notes } = body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    throw Object.assign(new Error('Invalid status'), { status: 400 });
  }

  const { rows } = await query(
    `UPDATE sppg_product_requests
    SET status = $1, response_notes = $2, responded_by = $3, 
        responded_at = NOW(), updated_at = NOW()
    WHERE id = $4 AND offtaker_id = $5 AND status = 'pending'
    RETURNING *`,
    [status, response_notes || null, userId, requestId, offtakerId]
  );

  return rows[0] || null;
}
