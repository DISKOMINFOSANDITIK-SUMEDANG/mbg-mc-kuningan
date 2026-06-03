import db from '../db/pool';

export async function listMenus(sppgId?: string) {
  let sql = `SELECT m.id, m.sppg_id, m.total_calories, m.notes, m.created_at, m.updated_at
             FROM menus m`;
  const params: any[] = [];
  if (sppgId) {
    sql += ' WHERE m.sppg_id = $1';
    params.push(sppgId);
  }
  sql += ' ORDER BY m.created_at DESC';

  const { rows: menus } = await db.query(sql, params);
  if (menus.length === 0) return [];

  const menuIds = menus.map((m: any) => m.id);
  const { rows: details } = await db.query(
    `SELECT md.menu_id, mi.id, mi.name, mi.description, mi.calories, mi.protein, mi.carbs, mi.fat, mi.image_url
     FROM menu_details md
     JOIN menu_items mi ON mi.id = md.menu_item_id
     WHERE md.menu_id = ANY($1)`,
    [menuIds]
  );

  const itemsMap = new Map<string, any[]>();
  details.forEach((d: any) => {
    const items = itemsMap.get(d.menu_id) || [];
    items.push({
      id: d.id,
      name: d.name,
      description: d.description,
      nutritionInfo: {
        calories: d.calories,
        protein: parseFloat(d.protein),
        carbs: parseFloat(d.carbs),
        fat: parseFloat(d.fat),
      },
      allergens: [],
      image: d.image_url,
    });
    itemsMap.set(d.menu_id, items);
  });

  return menus.map((m: any) => ({
    id: m.id,
    sppgId: m.sppg_id,
    totalCalories: m.total_calories,
    notes: m.notes,
    menuItems: itemsMap.get(m.id) || [],
  }));
}

export async function listMenuItems(q?: string) {
  let sql = `SELECT mi.id, mi.name, mi.description, mi.calories, mi.protein, mi.carbs, mi.fat, mi.image_url
             FROM menu_items mi`;
  const params: any[] = [];
  if (q) {
    sql += ' WHERE mi.name ILIKE $1 OR mi.description ILIKE $1';
    params.push(`%${q}%`);
  }
  sql += ' ORDER BY mi.name';

  const { rows } = await db.query(sql, params);
  const itemIds = rows.map((r: any) => r.id);

  const { rows: allergens } = itemIds.length
    ? await db.query(`SELECT menu_item_id, allergen_name FROM menu_item_allergens WHERE menu_item_id = ANY($1)`, [itemIds])
    : { rows: [] };

  const allergenMap = new Map<string, string[]>();
  allergens.forEach((a: any) => {
    const arr = allergenMap.get(a.menu_item_id) || [];
    arr.push(a.allergen_name);
    allergenMap.set(a.menu_item_id, arr);
  });

  return rows.map((item: any) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    nutritionInfo: {
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    },
    allergens: allergenMap.get(item.id) || [],
    image: item.image_url,
  }));
}
