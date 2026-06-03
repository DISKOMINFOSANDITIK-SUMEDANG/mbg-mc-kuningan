import db from '../../db/pool';
import { presignUrl } from '../../lib/s3';

export async function getMe(userId: string) {
  const { rows } = await db.query(
    `SELECT u.id, u.email, u.role, u.created_at, u.updated_at,
            p.full_name, p.phone, p.avatar_url,
            su.school_id, sc.name as school_name,
            spu.sppg_id, sp.name as sppg_name,
            supu.supplier_id, sup.name as supplier_name,
            ou.offtaker_id, o.name as offtaker_name
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     LEFT JOIN school_users su ON su.user_id = u.id
     LEFT JOIN schools sc ON sc.id = su.school_id
     LEFT JOIN sppg_users spu ON spu.user_id = u.id
     LEFT JOIN sppgs sp ON sp.id = spu.sppg_id
     LEFT JOIN supplier_users supu ON supu.user_id = u.id
     LEFT JOIN suppliers sup ON sup.id = supu.supplier_id
     LEFT JOIN offtaker_users ou ON ou.user_id = u.id
     LEFT JOIN offtakers o ON o.id = ou.offtaker_id
     WHERE u.id = $1`,
    [userId]
  );
  const row = rows[0];
  if (!row) return null;
  if (row.avatar_url) {
    row.avatar_url = await presignUrl(row.avatar_url);
  }
  return row;
}

export async function updateAccount(userId: string, data: { email?: string; password_hash?: string }) {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.email) {
    fields.push(`email = $${idx++}`);
    values.push(data.email);
  }
  if (data.password_hash) {
    fields.push(`password_hash = $${idx++}`);
    values.push(data.password_hash);
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = NOW()`);
  values.push(userId);

  const { rows } = await db.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, email, role, updated_at`,
    values
  );
  return rows[0] || null;
}

export async function getProfile(userId: string) {
  const { rows: userRows } = await db.query(
    `SELECT id, email, role, is_active, last_login, created_at, updated_at FROM users WHERE id = $1`,
    [userId]
  );
  if (!userRows[0]) return null;

  const { rows: profileRows } = await db.query(
    `SELECT id, full_name, phone, avatar_url, created_at, updated_at FROM user_profiles WHERE user_id = $1`,
    [userId]
  );

  const rawAvatarUrl = profileRows[0]?.avatar_url || null;
  const avatar_url = rawAvatarUrl ? await presignUrl(rawAvatarUrl) : null;
  const presignedProfile = profileRows[0] ? { ...profileRows[0], avatar_url } : undefined;

  return {
    ...userRows[0],
    full_name: profileRows[0]?.full_name || null,
    phone: profileRows[0]?.phone || null,
    avatar_url,
    user_profiles: presignedProfile ? [presignedProfile] : [],
  };
}

export async function updateProfile(userId: string, data: Record<string, any>) {
  const { full_name, phone } = data;

  // If avatar_url contains '?' it's a presigned URL (not a raw S3 key) — don't overwrite the stored value
  const incomingAvatar: string | undefined = data.avatar_url;
  const isPresigned = incomingAvatar && incomingAvatar.includes('?');
  const newAvatarUrl = isPresigned ? undefined : (incomingAvatar ?? undefined);

  // Try UPDATE first
  if (newAvatarUrl !== undefined) {
    // Avatar changed — update all fields including avatar_url
    const { rows: updated } = await db.query(
      `UPDATE user_profiles
       SET full_name = $2, phone = $3, avatar_url = $4, updated_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [userId, full_name || null, phone || null, newAvatarUrl || null]
    );
    if (updated.length > 0) return updated[0];
  } else {
    // Avatar not changed — keep existing avatar_url
    const { rows: updated } = await db.query(
      `UPDATE user_profiles
       SET full_name = $2, phone = $3, updated_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [userId, full_name || null, phone || null]
    );
    if (updated.length > 0) return updated[0];
  }

  // No existing profile — INSERT (only raw avatar key or null)
  const { rows: inserted } = await db.query(
    `INSERT INTO user_profiles (user_id, full_name, phone, avatar_url, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
    [userId, full_name || null, phone || null, newAvatarUrl || null]
  );
  return inserted[0] || null;
}

export async function getOfftakerProfile(userId: string) {
  const { rows } = await db.query(
    `SELECT o.*, ou.user_id,
            (SELECT COUNT(*) FROM offtaker_products op WHERE op.offtaker_id = o.id) as product_count
     FROM offtakers o
     JOIN offtaker_users ou ON ou.offtaker_id = o.id
     WHERE ou.user_id = $1`,
    [userId]
  );
  return rows[0] || null;
}

export async function updateOfftakerProfile(userId: string, data: Record<string, any>) {
  // First get the offtaker_id for this user
  const { rows: ouRows } = await db.query(
    `SELECT offtaker_id FROM offtaker_users WHERE user_id = $1`,
    [userId]
  );
  if (!ouRows[0]) return null;

  const offtakerId = ouRows[0].offtaker_id;
  const { name, address, subdistrict, district, province, phone, email, pic_name, pic_phone, warehouse_address, warehouse_capacity, notes } = data;

  const { rows } = await db.query(
    `UPDATE offtakers SET
       name = COALESCE($2, name),
       address = COALESCE($3, address),
       subdistrict = COALESCE($4, subdistrict),
       district = COALESCE($5, district),
       province = COALESCE($6, province),
       phone = COALESCE($7, phone),
       email = COALESCE($8, email),
       pic_name = COALESCE($9, pic_name),
       pic_phone = COALESCE($10, pic_phone),
       warehouse_address = COALESCE($11, warehouse_address),
       warehouse_capacity = COALESCE($12, warehouse_capacity),
       notes = COALESCE($13, notes),
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [offtakerId, name, address, subdistrict, district, province, phone, email, pic_name, pic_phone, warehouse_address, warehouse_capacity, notes]
  );
  return rows[0] || null;
}
