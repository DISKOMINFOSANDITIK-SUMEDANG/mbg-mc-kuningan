import db from '../db/pool';
import { presignUrl } from '../lib/s3';

export async function listDistributions(filters: {
  sppg_id?: string;
  date?: string;
  recipient_type?: string;
  recipient_id?: string;
}) {
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (filters.sppg_id) { conditions.push(`dd.sppg_id = $${idx}`); params.push(filters.sppg_id); idx++; }
  if (filters.date) { conditions.push(`dd.distribution_date = $${idx}`); params.push(filters.date); idx++; }
  if (filters.recipient_type) { conditions.push(`dd.recipient_type = $${idx}`); params.push(filters.recipient_type); idx++; }
  if (filters.recipient_id) { conditions.push(`dd.recipient_id = $${idx}`); params.push(filters.recipient_id); idx++; }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await db.query(
    `SELECT dd.id, dd.sppg_id, dd.distribution_date, dd.recipient_type, dd.recipient_id,
            dd.portions, dd.notes, dd.created_at, dd.updated_at, dd.menu_id,
            m.id as menu_row_id, m.name as menu_name, m.total_calories as menu_total_calories,
            m.notes as menu_notes, m.image_url as menu_image_url
     FROM daily_distributions dd
     LEFT JOIN menus m ON m.id = dd.menu_id
     ${where}
     ORDER BY dd.distribution_date DESC`,
    params
  );

  // Get menu items for all menus
  const menuIds = [...new Set(rows.map((r: any) => r.menu_id).filter(Boolean))];
  const { rows: menuDetails } = menuIds.length
    ? await db.query(
      `SELECT md.menu_id, mi.id, mi.name, mi.description, mi.calories, mi.protein, mi.carbs, mi.fat, mi.image_url
       FROM menu_details md JOIN menu_items mi ON mi.id = md.menu_item_id
       WHERE md.menu_id = ANY($1)`, [menuIds])
    : { rows: [] };

  const menuItemsMap = new Map<string, any[]>();
  menuDetails.forEach((d: any) => {
    const items = menuItemsMap.get(d.menu_id) || [];
    items.push({
      id: d.id,
      name: d.name,
      description: d.description,
      nutritionInfo: {
        calories: d.calories,
        protein: typeof d.protein === 'string' ? parseFloat(d.protein) : d.protein ?? 0,
        carbs: typeof d.carbs === 'string' ? parseFloat(d.carbs) : d.carbs ?? 0,
        fat: typeof d.fat === 'string' ? parseFloat(d.fat) : d.fat ?? 0,
      },
      allergens: [],
      image: d.image_url,
    });
    menuItemsMap.set(d.menu_id, items);
  });

  return Promise.all(rows.map(async (r: any) => ({
    id: r.id,
    sppgId: r.sppg_id,
    distributionDate: r.distribution_date,
    recipientType: r.recipient_type,
    recipientId: r.recipient_id,
    portions: r.portions,
    notes: r.notes,
    menu: r.menu_row_id ? {
      id: r.menu_row_id,
      name: r.menu_name,
      totalCalories: r.menu_total_calories,
      notes: r.menu_notes,
      image: r.menu_image_url ? await presignUrl(r.menu_image_url) : null,
      menuItems: menuItemsMap.get(r.menu_id) || [],
    } : null,
    recipient: null,
  })));
}
