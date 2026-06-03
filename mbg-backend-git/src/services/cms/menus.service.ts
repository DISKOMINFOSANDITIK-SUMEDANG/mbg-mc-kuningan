import db from '../../db/pool';
import { presignUrl, presignFields } from '../../lib/s3';

/**
 * Strip presigned query parameters from S3 URLs before storing in DB.
 * Presigned URLs contain ?X-Amz-Algorithm=... which expire.
 */
function stripPresignParams(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has('X-Amz-Algorithm')) {
      return `${parsed.origin}${parsed.pathname}`;
    }
  } catch { /* not a valid URL, return as-is */ }
  return url;
}

// --- Menus ---
export async function listMenus(query: { q?: string; sppg_id?: string; page?: number; limit?: number }, userSppgId?: string) {
  const page = query.page || 1;
  const limit = query.limit || 50;
  const offset = (page - 1) * limit;
  const params: any[] = [];
  let paramIdx = 1;
  let whereClause = 'WHERE 1=1';

  // SPPG role sees only own menus
  const sppgFilter = query.sppg_id || userSppgId;
  if (sppgFilter) {
    whereClause += ` AND m.sppg_id = $${paramIdx++}`;
    params.push(sppgFilter);
  }

  if (query.q) {
    whereClause += ` AND (m.name ILIKE $${paramIdx} OR m.description ILIKE $${paramIdx})`;
    params.push(`%${query.q}%`);
    paramIdx++;
  }

  const countResult = await db.query(`SELECT COUNT(*) FROM menus m ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count);

  const { rows: menus } = await db.query(
    `SELECT m.*, s.name as sppg_name, s.type as sppg_type
     FROM menus m
     LEFT JOIN sppgs s ON s.id = m.sppg_id
     ${whereClause}
     ORDER BY m.created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  // Fetch menu_items for each menu via menu_details
  if (menus.length > 0) {
    const menuIds = menus.map((m: any) => m.id);
    const { rows: details } = await db.query(
      `SELECT md.menu_id, mi.*
       FROM menu_details md
       JOIN menu_items mi ON mi.id = md.menu_item_id
       WHERE md.menu_id = ANY($1)`,
      [menuIds]
    );
    const detailsByMenu: Record<string, any[]> = {};
    for (const d of details) {
      if (!detailsByMenu[d.menu_id]) detailsByMenu[d.menu_id] = [];
      detailsByMenu[d.menu_id].push(d);
    }
    for (const menu of menus) {
      menu.menu_items = detailsByMenu[menu.id] || [];
    }
  }

  // Presign image URLs
  const presignedMenus = await presignFields(menus, ['image_url']);
  for (const menu of presignedMenus) {
    if (menu.menu_items?.length) {
      menu.menu_items = await presignFields(menu.menu_items, ['image_url']);
    }
  }

  return { menus: presignedMenus, total, page, limit };
}

export async function getMenuById(id: string) {
  const { rows } = await db.query(`SELECT m.*, s.name as sppg_name FROM menus m LEFT JOIN sppgs s ON s.id = m.sppg_id WHERE m.id = $1`, [id]);
  if (!rows[0]) return null;
  const menu = rows[0];

  const { rows: items } = await db.query(
    `SELECT mi.* FROM menu_details md JOIN menu_items mi ON mi.id = md.menu_item_id WHERE md.menu_id = $1`,
    [id]
  );
  menu.menu_items = await presignFields(items, ['image_url']);
  if (menu.image_url) {
    menu.image_url = await presignUrl(menu.image_url);
  }
  return menu;
}

export async function createMenu(data: Record<string, any>, userSppgId?: string) {
  const { name, notes, date, menu_item_ids, total_calories, menu_type, target_recipients } = data;
  const image_url = stripPresignParams(data.image_url);
  const sppgId = data.sppg_id || userSppgId;
  if (!name) throw { status: 400, message: 'Name is required' };

  const { rows } = await db.query(
    `INSERT INTO menus (name, notes, date, sppg_id, total_calories, menu_type, target_recipients, image_url, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW(), NOW()) RETURNING *`,
    [name, notes || null, date || null, sppgId || null, total_calories || null, menu_type || 'general', target_recipients || null, image_url || null]
  );
  const menu = rows[0];

  // Link menu items via menu_details
  if (menu_item_ids && Array.isArray(menu_item_ids) && menu_item_ids.length > 0) {
    const values = menu_item_ids.map((_: any, i: number) => `($1, $${i + 2})`).join(', ');
    await db.query(
      `INSERT INTO menu_details (menu_id, menu_item_id) VALUES ${values}`,
      [menu.id, ...menu_item_ids]
    );
  }

  return getMenuById(menu.id);
}

export async function updateMenu(id: string, data: Record<string, any>) {
  const { name, notes, date, sppg_id, menu_item_ids, total_calories, menu_type, target_recipients } = data;
  const image_url = stripPresignParams(data.image_url);
  if (!name) throw { status: 400, message: 'Name is required' };

  const { rows } = await db.query(
    `UPDATE menus SET name=$2, notes=$3, date=$4, sppg_id=$5, total_calories=$6, menu_type=$7, target_recipients=$8, image_url=$9, updated_at=NOW()
     WHERE id = $1 RETURNING *`,
    [id, name, notes || null, date || null, sppg_id || null, total_calories || null, menu_type || 'general', target_recipients || null, image_url || null]
  );
  if (!rows[0]) return null;

  // Replace menu_details
  if (menu_item_ids && Array.isArray(menu_item_ids)) {
    await db.query(`DELETE FROM menu_details WHERE menu_id = $1`, [id]);
    if (menu_item_ids.length > 0) {
      const values = menu_item_ids.map((_: any, i: number) => `($1, $${i + 2})`).join(', ');
      await db.query(
        `INSERT INTO menu_details (menu_id, menu_item_id) VALUES ${values}`,
        [id, ...menu_item_ids]
      );
    }
  }

  return getMenuById(id);
}

export async function deleteMenu(id: string) {
  await db.query(`DELETE FROM menu_details WHERE menu_id = $1`, [id]);
  await db.query(`DELETE FROM menus WHERE id = $1`, [id]);
}

// --- Menu Items ---
export async function listMenuItems(query: { q?: string; sppg_id?: string; page?: number; limit?: number }, userSppgId?: string) {
  const page = query.page || 1;
  const limit = query.limit || 50;
  const offset = (page - 1) * limit;
  const params: any[] = [];
  let paramIdx = 1;
  let whereClause = 'WHERE 1=1';

  const sppgFilter = query.sppg_id || userSppgId;
  if (sppgFilter) {
    whereClause += ` AND mi.sppg_id = $${paramIdx++}`;
    params.push(sppgFilter);
  }

  if (query.q) {
    whereClause += ` AND (mi.name ILIKE $${paramIdx} OR mi.description ILIKE $${paramIdx})`;
    params.push(`%${query.q}%`);
    paramIdx++;
  }

  const countResult = await db.query(`SELECT COUNT(*) FROM menu_items mi ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count);

  const { rows } = await db.query(
    `SELECT mi.*, s.name as sppg_name, s.type as sppg_type, s.location as sppg_location
     FROM menu_items mi
     LEFT JOIN sppgs s ON s.id = mi.sppg_id
     ${whereClause}
     ORDER BY mi.name
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  const presignedItems = await presignFields(rows, ['image_url']);
  return { items: presignedItems, total, page, limit };
}

export async function getMenuItemById(id: string) {
  const { rows } = await db.query(`SELECT * FROM menu_items WHERE id = $1`, [id]);
  if (!rows[0]) return null;
  if (rows[0].image_url) {
    rows[0].image_url = await presignUrl(rows[0].image_url);
  }
  return rows[0];
}

export async function createMenuItem(data: Record<string, any>, userSppgId?: string) {
  const { name, description, calories, protein, carbs, fat } = data;
  const image_url = stripPresignParams(data.image_url);
  const sppgId = data.sppg_id || userSppgId;
  if (!name) throw { status: 400, message: 'Name is required' };

  const { rows } = await db.query(
    `INSERT INTO menu_items (name, description, calories, protein, carbs, fat, image_url, sppg_id, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW(), NOW()) RETURNING *`,
    [name, description || null, calories || null, protein || null,
     carbs || null, fat || null, image_url || null, sppgId || null]
  );
  return rows[0];
}

export async function updateMenuItem(id: string, data: Record<string, any>) {
  const { name, description, calories, protein, carbs, fat, sppg_id } = data;
  const image_url = stripPresignParams(data.image_url);
  if (!name) throw { status: 400, message: 'Name is required' };

  const { rows } = await db.query(
    `UPDATE menu_items SET name=$2, description=$3, calories=$4, protein=$5,
       carbs=$6, fat=$7, image_url=$8, sppg_id=$9, updated_at=NOW()
     WHERE id = $1 RETURNING *`,
    [id, name, description || null, calories || null, protein || null,
     carbs || null, fat || null, image_url || null, sppg_id || null]
  );
  return rows[0] || null;
}

export async function deleteMenuItem(id: string) {
  await db.query(`DELETE FROM menu_details WHERE menu_item_id = $1`, [id]);
  await db.query(`DELETE FROM menu_items WHERE id = $1`, [id]);
}
