import db from '../../db/pool';
import { hashPassword } from '../../utils/password';
import crypto from 'crypto';

const ROLE_DISPLAY: Record<string, string> = {
  administrator: 'Administrator',
  sekolah: 'Sekolah',
  sppg: 'SPPG',
  pemasok: 'Pemasok',
  offtaker: 'Offtaker',
  dinas_pertanian: 'Dinas Pertanian',
};

export async function listUsers(query: { q?: string; role?: string; is_active?: string; sppg_unlinked?: string; page?: number; limit?: number }) {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramIdx = 1;

  if (query.role) {
    whereClause += ` AND u.role = $${paramIdx++}`;
    params.push(query.role);
  }

  if (query.is_active !== undefined && query.is_active !== '') {
    whereClause += ` AND u.is_active = $${paramIdx++}`;
    params.push(query.is_active === 'true');
  }

  if (query.q && query.q.trim().length > 0) {
    const searchTerm = `%${query.q.trim()}%`;
    whereClause += ` AND (u.email ILIKE $${paramIdx} OR p.full_name ILIKE $${paramIdx})`;
    params.push(searchTerm);
    paramIdx++;
  }

  if (query.sppg_unlinked === 'true') {
    whereClause += ` AND (u.role = 'sppg' OR p.full_name ILIKE '%sppg%') AND NOT EXISTS (SELECT 1 FROM sppg_users spu WHERE spu.user_id = u.id)`;
  }

  // Count total (includes search filter)
  const countResult = await db.query(
    `SELECT COUNT(*) FROM users u LEFT JOIN user_profiles p ON p.user_id = u.id ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // Get users
  const usersResult = await db.query(
    `SELECT u.id, u.email, u.role, u.is_active, u.last_login, u.created_at, u.updated_at,
            p.full_name, p.phone, p.avatar_url
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     ${whereClause}
     ORDER BY u.created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  let users = usersResult.rows;

  // Enrich with role-specific data
  if (users.length > 0) {
    const userIds = users.map((u: any) => u.id);

    // Get school associations
    const { rows: schoolAssocs } = await db.query(
      `SELECT su.user_id, su.school_id, su.position,
              sc.name as school_name, sc.level as school_level, sc.district as school_district
       FROM school_users su
       JOIN schools sc ON sc.id = su.school_id
       WHERE su.user_id = ANY($1)`,
      [userIds]
    );

    // Get SPPG associations
    const { rows: sppgAssocs } = await db.query(
      `SELECT spu.user_id, spu.sppg_id, spu.position,
              sp.name as sppg_name, sp.type as sppg_type, sp.location as sppg_location
       FROM sppg_users spu
       JOIN sppgs sp ON sp.id = spu.sppg_id
       WHERE spu.user_id = ANY($1)`,
      [userIds]
    );

    // Get supplier associations
    const { rows: supplierAssocs } = await db.query(
      `SELECT su.user_id, su.supplier_id,
              s.name as supplier_name, s.address as supplier_address, s.district as supplier_district
       FROM supplier_users su
       JOIN suppliers s ON s.id = su.supplier_id
       WHERE su.user_id = ANY($1)`,
      [userIds]
    );

    // Get offtaker associations
    const { rows: offtakerAssocs } = await db.query(
      `SELECT ou.user_id, ou.offtaker_id,
              o.name as offtaker_name, o.address as offtaker_address, o.district as offtaker_district
       FROM offtaker_users ou
       JOIN offtakers o ON o.id = ou.offtaker_id
       WHERE ou.user_id = ANY($1)`,
      [userIds]
    );

    users = users.map((user: any) => {
      const school = schoolAssocs.find((a: any) => a.user_id === user.id) || null;
      const sppg = sppgAssocs.find((a: any) => a.user_id === user.id) || null;
      const supplier = supplierAssocs.find((a: any) => a.user_id === user.id) || null;
      const offtaker = offtakerAssocs.find((a: any) => a.user_id === user.id) || null;
      return {
        ...user,
        role_display: ROLE_DISPLAY[user.role] || user.role,
        position: school?.position || sppg?.position || null,
        school_id: school?.school_id || null,
        school_name: school?.school_name || null,
        school_level: school?.school_level || null,
        school_district: school?.school_district || null,
        sppg_id: sppg?.sppg_id || null,
        sppg_name: sppg?.sppg_name || null,
        sppg_type: sppg?.sppg_type || null,
        sppg_location: sppg?.sppg_location || null,
        supplier_id: supplier?.supplier_id || null,
        supplier_name: supplier?.supplier_name || null,
        supplier_address: supplier?.supplier_address || null,
        supplier_district: supplier?.supplier_district || null,
        offtaker_id: offtaker?.offtaker_id || null,
        offtaker_name: offtaker?.offtaker_name || null,
        offtaker_address: offtaker?.offtaker_address || null,
        offtaker_district: offtaker?.offtaker_district || null,
      };
    });
  }

  return { users, total, page, limit };
}

export async function getUserById(id: string) {
  const { rows } = await db.query(
    `SELECT u.id, u.email, u.role, u.is_active, u.last_login, u.created_at, u.updated_at,
            p.full_name, p.phone, p.avatar_url
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE u.id = $1`,
    [id]
  );
  if (!rows[0]) return null;

  const user = rows[0];

  // Get role associations (flat fields)
  if (user.role === 'sekolah') {
    const { rows: su } = await db.query(
      `SELECT su.school_id, su.position, sc.name as school_name, sc.level as school_level, sc.district as school_district
       FROM school_users su JOIN schools sc ON sc.id = su.school_id WHERE su.user_id = $1`, [id]);
    const school = su[0] || null;
    user.school_id = school?.school_id || null;
    user.school_name = school?.school_name || null;
    user.school_level = school?.school_level || null;
    user.school_district = school?.school_district || null;
    user.position = school?.position || null;
  } else if (user.role === 'sppg') {
    const { rows: spu } = await db.query(
      `SELECT spu.sppg_id, spu.position, sp.name as sppg_name, sp.type as sppg_type, sp.location as sppg_location
       FROM sppg_users spu JOIN sppgs sp ON sp.id = spu.sppg_id WHERE spu.user_id = $1`, [id]);
    const sppg = spu[0] || null;
    user.sppg_id = sppg?.sppg_id || null;
    user.sppg_name = sppg?.sppg_name || null;
    user.sppg_type = sppg?.sppg_type || null;
    user.sppg_location = sppg?.sppg_location || null;
    user.position = sppg?.position || null;
  } else if (user.role === 'pemasok') {
    const { rows: su } = await db.query(
      `SELECT su.supplier_id, s.name as supplier_name, s.address as supplier_address, s.district as supplier_district
       FROM supplier_users su JOIN suppliers s ON s.id = su.supplier_id WHERE su.user_id = $1`, [id]);
    const supplier = su[0] || null;
    user.supplier_id = supplier?.supplier_id || null;
    user.supplier_name = supplier?.supplier_name || null;
    user.supplier_address = supplier?.supplier_address || null;
    user.supplier_district = supplier?.supplier_district || null;
  } else if (user.role === 'offtaker') {
    const { rows: ou } = await db.query(
      `SELECT ou.offtaker_id, o.name as offtaker_name, o.address as offtaker_address, o.district as offtaker_district
       FROM offtaker_users ou JOIN offtakers o ON o.id = ou.offtaker_id WHERE ou.user_id = $1`, [id]);
    const offtaker = ou[0] || null;
    user.offtaker_id = offtaker?.offtaker_id || null;
    user.offtaker_name = offtaker?.offtaker_name || null;
    user.offtaker_address = offtaker?.offtaker_address || null;
    user.offtaker_district = offtaker?.offtaker_district || null;
  }

  user.role_display = ROLE_DISPLAY[user.role] || user.role;
  return user;
}

export async function createUser(data: {
  email: string; password: string; role: string; full_name?: string; phone?: string;
  position?: string;
  school_id?: string; sppg_id?: string; supplier_id?: string; offtaker_id?: string;
}) {
  const { email, role, full_name, phone, position, school_id, sppg_id, supplier_id, offtaker_id } = data;
  // Auto-generate password if not provided
  const password = data.password || crypto.randomBytes(6).toString('hex');

  // Check email uniqueness
  const { rows: existing } = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.length > 0) {
    throw { status: 400, message: 'Email sudah digunakan' };
  }

  const password_hash = await hashPassword(password);

  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, role, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, email, role, created_at`,
    [email, password_hash, role]
  );
  const user = rows[0];

  // Create profile
  if (full_name || phone) {
    await db.query(
      `INSERT INTO user_profiles (user_id, full_name, phone) VALUES ($1, $2, $3)`,
      [user.id, full_name || null, phone || null]
    );
  }

  // Create role-specific association
  if (role === 'sekolah' && school_id) {
    await db.query(`INSERT INTO school_users (user_id, school_id, position) VALUES ($1, $2, $3)`, [user.id, school_id, position || '']);
  } else if (role === 'sppg' && sppg_id) {
    await db.query(`INSERT INTO sppg_users (user_id, sppg_id, position) VALUES ($1, $2, $3)`, [user.id, sppg_id, position || '']);
  } else if (role === 'pemasok' && supplier_id) {
    await db.query(`INSERT INTO supplier_users (user_id, supplier_id) VALUES ($1, $2)`, [user.id, supplier_id]);
  } else if (role === 'offtaker' && offtaker_id) {
    await db.query(`INSERT INTO offtaker_users (user_id, offtaker_id) VALUES ($1, $2)`, [user.id, offtaker_id]);
  }

  return { ...user, temp_password: password };
}

export async function updateUser(id: string, data: {
  email?: string; role?: string; full_name?: string; phone?: string;
  position?: string;
  school_id?: string; sppg_id?: string; supplier_id?: string; offtaker_id?: string;
}) {
  const { email, role, full_name, phone, position, school_id, sppg_id, supplier_id, offtaker_id } = data;

  // Get current user
  const { rows: currentRows } = await db.query('SELECT role FROM users WHERE id = $1', [id]);
  if (!currentRows[0]) throw { status: 404, message: 'User not found' };
  const currentRole = currentRows[0].role;

  // Update user
  const userFields: string[] = ['updated_at = NOW()'];
  const userParams: any[] = [];
  let idx = 1;

  if (email) { userFields.push(`email = $${idx++}`); userParams.push(email); }
  if (role) { userFields.push(`role = $${idx++}`); userParams.push(role); }

  userParams.push(id);
  await db.query(`UPDATE users SET ${userFields.join(', ')} WHERE id = $${idx}`, userParams);

  // Update profile
  if (full_name !== undefined || phone !== undefined) {
    const { rowCount } = await db.query(
      `UPDATE user_profiles SET full_name = COALESCE($2, full_name), phone = COALESCE($3, phone), updated_at = NOW() WHERE user_id = $1`,
      [id, full_name ?? null, phone ?? null]
    );
    if ((rowCount ?? 0) === 0) {
      await db.query(
        `INSERT INTO user_profiles (user_id, full_name, phone, updated_at) VALUES ($1, $2, $3, NOW())`,
        [id, full_name ?? null, phone ?? null]
      );
    }
  }

  // Handle role change
  const effectiveRole = role || currentRole;
  if (role && role !== currentRole) {
    // Remove old associations
    await db.query('DELETE FROM school_users WHERE user_id = $1', [id]);
    await db.query('DELETE FROM sppg_users WHERE user_id = $1', [id]);
    await db.query('DELETE FROM supplier_users WHERE user_id = $1', [id]);
    await db.query('DELETE FROM offtaker_users WHERE user_id = $1', [id]);
  }

  // Create/update role-specific association
  if (effectiveRole === 'sekolah' && school_id) {
    const { rowCount } = await db.query(
      `UPDATE school_users SET school_id = $2, position = COALESCE($3, position) WHERE user_id = $1`,
      [id, school_id, position ?? null]
    );
    if ((rowCount ?? 0) === 0) await db.query(`INSERT INTO school_users (user_id, school_id, position) VALUES ($1, $2, $3)`, [id, school_id, position || '']);
  } else if (effectiveRole === 'sppg' && sppg_id) {
    const { rowCount } = await db.query(
      `UPDATE sppg_users SET sppg_id = $2, position = COALESCE($3, position) WHERE user_id = $1`,
      [id, sppg_id, position ?? null]
    );
    if ((rowCount ?? 0) === 0) await db.query(`INSERT INTO sppg_users (user_id, sppg_id, position) VALUES ($1, $2, $3)`, [id, sppg_id, position || '']);
  } else if (effectiveRole === 'pemasok' && supplier_id) {
    const { rowCount } = await db.query(`UPDATE supplier_users SET supplier_id = $2 WHERE user_id = $1`, [id, supplier_id]);
    if ((rowCount ?? 0) === 0) await db.query(`INSERT INTO supplier_users (user_id, supplier_id) VALUES ($1, $2)`, [id, supplier_id]);
  } else if (effectiveRole === 'offtaker' && offtaker_id) {
    const { rowCount } = await db.query(`UPDATE offtaker_users SET offtaker_id = $2 WHERE user_id = $1`, [id, offtaker_id]);
    if ((rowCount ?? 0) === 0) await db.query(`INSERT INTO offtaker_users (user_id, offtaker_id) VALUES ($1, $2)`, [id, offtaker_id]);
  }

  return getUserById(id);
}

export async function resetUserPassword(userId: string) {
  const tempPassword = crypto.randomBytes(6).toString('hex'); // 12 char random password
  const password_hash = await hashPassword(tempPassword);

  await db.query(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [password_hash, userId]
  );

  return { tempPassword, temp_password: tempPassword };
}

export async function deleteUser(userId: string) {
  // Soft-delete: deactivate the user
  const { rows } = await db.query(
    `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id`,
    [userId]
  );
  if (!rows[0]) throw { status: 404, message: 'User not found' };
}

export async function permanentlyDeleteUser(userId: string) {
  // Hard-delete: permanently remove the user from the database
  const { rows } = await db.query(
    `DELETE FROM users WHERE id = $1 RETURNING id`,
    [userId]
  );
  if (!rows[0]) throw { status: 404, message: 'User not found' };
}
