import db from '../db/pool';

export async function listGroups(q?: string, sppgId?: string) {
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (sppgId) {
    // Use INNER JOIN to filter by sppg_id
    const { rows } = await db.query(
      `SELECT g.id, g.name, g.description, g.created_at, g.updated_at
       FROM groups g
       INNER JOIN group_sppg_relations gsr ON gsr.group_id = g.id
       WHERE gsr.sppg_id = $1 ${q ? 'AND (g.name ILIKE $2 OR g.description ILIKE $2)' : ''}
       ORDER BY g.name`,
      q ? [sppgId, `%${q}%`] : [sppgId]
    );
    return rows.map((g: any) => ({ id: g.id, name: g.name, description: g.description }));
  }

  let sql = `SELECT g.id, g.name, g.description, g.created_at, g.updated_at FROM groups g`;
  if (q) {
    sql += ' WHERE g.name ILIKE $1 OR g.description ILIKE $1';
    params.push(`%${q}%`);
  }
  sql += ' ORDER BY g.name';

  const { rows } = await db.query(sql, params);
  return rows.map((g: any) => ({ id: g.id, name: g.name, description: g.description }));
}

export async function getGroupById(id: string) {
  const { rows } = await db.query(
    `SELECT id, name, description, created_at, updated_at FROM groups WHERE id = $1`,
    [id]
  );
  if (rows.length === 0) return null;
  return { id: rows[0].id, name: rows[0].name, description: rows[0].description };
}

export async function getGroupSppgs(groupId: string) {
  const { rows } = await db.query(
    `SELECT sp.id, sp.name, sp.type, sp.location, sp.capacity,
            sp.operating_hours_start, sp.operating_hours_end,
            sp.phone, sp.email, sp.address, sp.latitude, sp.longitude,
            sp.kitchen_photo_url
     FROM group_sppg_relations gsr
     JOIN sppgs sp ON sp.id = gsr.sppg_id
     WHERE gsr.group_id = $1`,
    [groupId]
  );

  return rows.map((s: any) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    location: s.location,
    capacity: s.capacity,
    operatingHours: { start: s.operating_hours_start || '08:00', end: s.operating_hours_end || '16:00' },
    contact: { phone: s.phone || '', email: s.email || '', address: s.address || '' },
    coordinates: { lat: s.latitude || 0, lng: s.longitude || 0 },
    facilities: [],
    kitchenPhoto: s.kitchen_photo_url || '',
    nutritionist: { name: 'N/A', qualification: 'N/A', experience: 'N/A', photo: '' },
    slhsCertificate: { certificateNumber: 'N/A', issueDate: new Date().toISOString(), expiryDate: new Date().toISOString(), fileUrl: '' },
    schools: [],
  }));
}
