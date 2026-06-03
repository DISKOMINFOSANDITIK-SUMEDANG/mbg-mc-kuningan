import db from '../db/pool';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { presignFields } from '../lib/s3';
import { AuthPayload } from '../types/auth';

export async function loginUser(email: string, password: string) {
  const { rows } = await db.query(
    `SELECT u.id, u.email, u.password_hash, u.role, u.is_active,
            (SELECT json_build_object('full_name', p.full_name, 'phone', p.phone, 'avatar_url', p.avatar_url)
             FROM user_profiles p WHERE p.user_id = u.id LIMIT 1) as profile,
            (SELECT json_build_object('school_id', su.school_id, 'position', su.position)
             FROM school_users su WHERE su.user_id = u.id LIMIT 1) as school_user,
            (SELECT json_build_object('sppg_id', sp.sppg_id, 'position', sp.position)
             FROM sppg_users sp WHERE sp.user_id = u.id LIMIT 1) as sppg_user,
            (SELECT json_build_object('supplier_id', sup.supplier_id, 'position', sup.position)
             FROM supplier_users sup WHERE sup.user_id = u.id LIMIT 1) as supplier_user,
            (SELECT json_build_object('offtaker_id', ou.offtaker_id, 'position', ou.position)
             FROM offtaker_users ou WHERE ou.user_id = u.id LIMIT 1) as offtaker_user
     FROM users u WHERE u.email = $1 AND u.is_active = true`,
    [email]
  );

  if (rows.length === 0) return null;
  const user = rows[0];

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) return null;

  // Update last_login
  await db.query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [user.id]);

  const authUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.profile?.full_name,
    phone: user.profile?.phone,
    avatarUrl: user.profile?.avatar_url,
    schoolId: user.school_user?.school_id,
    sppgId: user.sppg_user?.sppg_id,
    supplierId: user.supplier_user?.supplier_id,
    offtakerId: user.offtaker_user?.offtaker_id,
    position: user.school_user?.position || user.sppg_user?.position || user.supplier_user?.position || user.offtaker_user?.position,
  };

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    schoolId: authUser.schoolId,
    sppgId: authUser.sppgId,
    supplierId: authUser.supplierId,
    offtakerId: authUser.offtakerId,
  });

  return { user: authUser, token };
}

export async function mobileLogin(email: string, password: string) {
  const result = await loginUser(email, password);
  if (!result) return null;
  if (result.user.role !== 'sekolah') return null;

  // Get school info
  let school = null;
  if (result.user.schoolId) {
    const { rows } = await db.query(
      `SELECT id, name, level, district, village, address, student_count, sppg_id
       FROM schools WHERE id = $1`,
      [result.user.schoolId]
    );
    if (rows.length > 0) school = rows[0];
  }

  return {
    access_token: result.token,
    user: {
      ...result.user,
      school,
      sppgId: school?.sppg_id || result.user.sppgId,
    },
  };
}

export async function refreshUserToken(userId: string) {
  const { rows } = await db.query(
    `SELECT u.id, u.email, u.role,
            (SELECT su.school_id FROM school_users su WHERE su.user_id = u.id LIMIT 1) as school_id,
            (SELECT sp.sppg_id FROM sppg_users sp WHERE sp.user_id = u.id LIMIT 1) as sppg_id,
            (SELECT sup.supplier_id FROM supplier_users sup WHERE sup.user_id = u.id LIMIT 1) as supplier_id,
            (SELECT ou.offtaker_id FROM offtaker_users ou WHERE ou.user_id = u.id LIMIT 1) as offtaker_id,
            (SELECT p.full_name FROM user_profiles p WHERE p.user_id = u.id LIMIT 1) as full_name,
            (SELECT p.phone FROM user_profiles p WHERE p.user_id = u.id LIMIT 1) as phone,
            (SELECT p.avatar_url FROM user_profiles p WHERE p.user_id = u.id LIMIT 1) as avatar_url
     FROM users u WHERE u.id = $1 AND u.is_active = true`,
    [userId]
  );

  if (rows.length === 0) return null;
  const user = rows[0];

  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    schoolId: user.school_id || undefined,
    sppgId: user.sppg_id || undefined,
    supplierId: user.supplier_id || undefined,
    offtakerId: user.offtaker_id || undefined,
  };
  const token = generateToken(payload);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      schoolId: user.school_id,
      sppgId: user.sppg_id,
      supplierId: user.supplier_id,
      offtakerId: user.offtaker_id,
    },
    token,
  };
}

export async function getProfile(userId: string) {
  const { rows } = await db.query(
    `SELECT u.id, u.email, u.role, u.last_login, u.created_at,
            p.full_name, p.phone, p.avatar_url,
            su.school_id, su.position as school_position,
            s.name as school_name, s.level as school_level, s.district as school_district,
            s.village as school_village, s.address as school_address, s.sppg_id as school_sppg_id,
            s.student_count as school_student_count
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     LEFT JOIN school_users su ON su.user_id = u.id
     LEFT JOIN schools s ON s.id = su.school_id
     WHERE u.id = $1`,
    [userId]
  );

  if (rows.length === 0) return null;
  const r = rows[0];

  return {
    id: r.id,
    email: r.email,
    role: r.role,
    fullName: r.full_name,
    full_name: r.full_name,
    phone: r.phone,
    avatarUrl: r.avatar_url,
    avatar_url: r.avatar_url,
    lastLogin: r.last_login,
    last_login: r.last_login,
    schoolId: r.school_id,
    school_id: r.school_id,
    schoolName: r.school_name,
    school_name: r.school_name,
    schoolLevel: r.school_level,
    school_level: r.school_level,
    schoolDistrict: r.school_district,
    school_district: r.school_district,
    schoolVillage: r.school_village,
    school_village: r.school_village,
    schoolAddress: r.school_address,
    school_address: r.school_address,
    sppgId: r.school_sppg_id,
    sppg_id: r.school_sppg_id,
    studentCount: r.school_student_count,
    student_count: r.school_student_count,
  };
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string) {
  const { rows } = await db.query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
  if (rows.length === 0) return { success: false, error: 'User not found' };

  const isValid = await verifyPassword(oldPassword, rows[0].password_hash);
  if (!isValid) return { success: false, error: 'Password lama salah' };

  const hash = await hashPassword(newPassword);
  await db.query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [hash, userId]);
  return { success: true };
}

export async function verifyTokenUser(userId: string) {
  const { rows } = await db.query(
    `SELECT id, email, role, is_active FROM users WHERE id = $1`,
    [userId]
  );
  if (rows.length === 0 || !rows[0].is_active) return null;
  return rows[0];
}

export async function getSppgProfile(sppgId: string) {
  const { rows } = await db.query(
    `SELECT s.id,
            s.name as sppg_name,
            s.type as sppg_type,
            s.capacity as sppg_capacity,
            s.location as sppg_location,
            s.latitude as sppg_latitude,
            s.longitude as sppg_longitude,
            s.phone as sppg_phone,
            s.email as sppg_email,
            s.address as sppg_address,
            s.operating_hours_start as sppg_operating_hours_start,
            s.operating_hours_end as sppg_operating_hours_end,
            s.kitchen_photo_url as sppg_kitchen_photo_url,
            fo.name as foundation_name,
            (SELECT json_agg(f.*) FROM sppg_facilities f WHERE f.sppg_id = s.id) as facilities,
            (SELECT json_agg(n.*) FROM nutritionists n WHERE n.sppg_id = s.id) as nutritionists,
            (SELECT json_agg(c.*) FROM slhs_certificates c WHERE c.sppg_id = s.id) as certificates,
            (SELECT json_agg(kp.* ORDER BY kp.display_order) FROM sppg_kitchen_photos kp WHERE kp.sppg_id = s.id) as kitchen_photos,
            (SELECT COUNT(*) FROM schools sc WHERE sc.sppg_id = s.id)::int as total_schools_served
     FROM sppgs s
     LEFT JOIN foundation fo ON fo.id = s.foundation_id
     WHERE s.id = $1`,
    [sppgId]
  );
  if (rows.length === 0) return null;
  
  const profile = rows[0];
  
  // Presign nutritionist photo URLs
  if (profile.nutritionists && Array.isArray(profile.nutritionists)) {
    profile.nutritionists = await presignFields(profile.nutritionists, ['photo_url']);
  }
  
  // Presign kitchen photos
  if (profile.kitchen_photos && Array.isArray(profile.kitchen_photos)) {
    profile.kitchen_photos = await presignFields(profile.kitchen_photos, ['photo_url']);
  }
  
  return profile;
}

export async function getSchoolDistributions(schoolId: string, params: {
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}) {
  const limit = params.limit || 50;
  const offset = params.offset || 0;
  const conditions = ['d.recipient_id = $1', "d.recipient_type = 'school'"];
  const queryParams: any[] = [schoolId];
  let idx = 2;

  if (params.start_date) {
    conditions.push(`d.distribution_date >= $${idx}`);
    queryParams.push(params.start_date);
    idx++;
  }
  if (params.end_date) {
    conditions.push(`d.distribution_date <= $${idx}`);
    queryParams.push(params.end_date);
    idx++;
  }

  const where = conditions.join(' AND ');

  const countResult = await db.query(
    `SELECT COUNT(*)::int as total FROM daily_distributions d WHERE ${where}`,
    queryParams
  );

  queryParams.push(limit, offset);
  const { rows } = await db.query(
    `SELECT d.*, s.name as sppg_name, s.type as sppg_type,
            m.name as menu_name, m.total_calories as menu_total_calories
     FROM daily_distributions d
     LEFT JOIN sppgs s ON s.id = d.sppg_id
     LEFT JOIN menus m ON m.id = d.menu_id
     WHERE ${where}
     ORDER BY d.distribution_date DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    queryParams
  );

  const total = countResult.rows[0].total;
  return {
    data: rows,
    pagination: { total, limit, offset, has_more: offset + limit < total },
    statistics: {
      total_distributions: total,
      total_portions: rows.reduce((sum: number, r: any) => sum + (r.portions || 0), 0),
      unique_dates: [...new Set(rows.map((r: any) => r.distribution_date))].length,
    },
  };
}

export async function getDistricts() {
  const { rows } = await db.query(
    `SELECT DISTINCT district FROM schools WHERE district IS NOT NULL ORDER BY district`
  );
  return rows.map((r) => r.district);
}

export async function getVillages(district: string) {
  const { rows } = await db.query(
    `SELECT DISTINCT village FROM schools WHERE district = $1 AND village IS NOT NULL ORDER BY village`,
    [district]
  );
  return rows.map((r) => r.village);
}

export async function getSppgList() {
  const { rows } = await db.query(
    `SELECT id, name, address, location FROM sppgs ORDER BY name`
  );
  return rows;
}

export async function getMbgReports(userId: string, schoolId: string, options?: { startDate?: string; endDate?: string; limit?: number; offset?: number }) {
  const params: any[] = [schoolId];
  let sql = `SELECT r.*,
            json_build_object('id', s.id, 'name', s.name, 'level', s.level, 'district', s.district, 'village', s.village) as schools,
            json_build_object('id', sp.id, 'name', sp.name, 'type', sp.type, 'location', sp.location, 'address', sp.address, 'phone', sp.phone) as sppgs
     FROM mbg_reports r
     LEFT JOIN schools s ON s.id = r.school_id
     LEFT JOIN sppgs sp ON sp.id = r.sppg_id
     WHERE r.school_id = $1`;

  if (options?.startDate) {
    params.push(options.startDate);
    sql += ` AND r.report_date >= $${params.length}`;
  }
  if (options?.endDate) {
    params.push(options.endDate);
    sql += ` AND r.report_date <= $${params.length}`;
  }

  sql += ` ORDER BY r.report_date DESC`;

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  params.push(limit);
  sql += ` LIMIT $${params.length}`;
  params.push(offset);
  sql += ` OFFSET $${params.length}`;

  const { rows } = await db.query(sql, params);
  const presigned = await presignFields(rows, ['menu_photo_url', 'students_photo_url']);
  return { data: presigned };
}

export async function getMbgReportById(reportId: string) {
  const { rows } = await db.query(
    `SELECT r.*,
            s.name as school_name, s.level as school_level,
            s.district as school_district, s.village as school_village,
            s.student_count as school_student_count,
            sp.name as sppg_name, sp.type as sppg_type,
            sp.location as sppg_location, sp.phone as sppg_phone,
            sp.email as sppg_email, sp.address as sppg_address,
            u.email as submitted_by_email,
            p.full_name as submitted_by_name
     FROM mbg_reports r
     LEFT JOIN schools s ON s.id = r.school_id
     LEFT JOIN sppgs sp ON sp.id = s.sppg_id
     LEFT JOIN users u ON u.id = r.submitted_by
     LEFT JOIN user_profiles p ON p.user_id = r.submitted_by
     WHERE r.id = $1`,
    [reportId]
  );
  if (rows.length === 0) return null;
  const [presigned] = await presignFields([rows[0]], ['menu_photo_url', 'students_photo_url']);
  return presigned;
}

export async function deleteMbgReport(reportId: string, userId: string) {
  // Check report exists and belongs to user, and is from today
  // Use PostgreSQL for date comparison to avoid JS timezone conversion issues
  const { rows } = await db.query(
    `SELECT id, submitted_by, report_date,
            report_date::text as report_date_text,
            (NOW() AT TIME ZONE 'Asia/Jakarta')::date::text as today_text
     FROM mbg_reports WHERE id = $1`,
    [reportId]
  );
  if (rows.length === 0) return { success: false, error: 'Report not found' };

  const report = rows[0];
  if (report.submitted_by !== userId) {
    return { success: false, error: 'You can only delete your own reports' };
  }

  // Compare dates using PostgreSQL-computed text values to avoid JS Date timezone issues
  if (report.report_date_text !== report.today_text) {
    return { success: false, error: 'Hanya bisa menghapus laporan hari ini' };
  }

  await db.query(`DELETE FROM mbg_reports WHERE id = $1`, [reportId]);
  return { success: true };
}

export async function createMbgReport(data: {
  school_id: string;
  sppg_id: string | null;
  report_date: string;
  menu_photo_url: string;
  students_photo_url: string;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  device_timestamp: string;
  submitted_by: string;
  is_rapel?: boolean;
  rapel_start_date?: string | null;
  rapel_end_date?: string | null;
}) {
  // Resolve sppg_id from school if not provided
  let sppgId = data.sppg_id;
  if (!sppgId) {
    const { rows: schoolRows } = await db.query(
      `SELECT sppg_id FROM schools WHERE id = $1`,
      [data.school_id]
    );
    if (schoolRows.length > 0) {
      sppgId = schoolRows[0].sppg_id;
    }
  }

  if (!sppgId) {
    return { success: false, error: 'Sekolah Anda belum terdaftar di SPPG. Silakan hubungi administrator untuk mendaftarkan sekolah ke SPPG terlebih dahulu.' };
  }

  // Check for duplicate report on the same date
  const { rows: existing } = await db.query(
    `SELECT id FROM mbg_reports WHERE school_id = $1 AND report_date = $2 LIMIT 1`,
    [data.school_id, data.report_date]
  );
  if (existing.length > 0) {
    return { success: false, error: 'Laporan untuk tanggal ini sudah ada. Hanya boleh satu laporan per hari.' };
  }

  const { rows } = await db.query(
    `INSERT INTO mbg_reports (
      school_id, sppg_id, report_date, menu_photo_url, students_photo_url,
      latitude, longitude, location_accuracy, device_timestamp, submitted_by,
      is_rapel, rapel_start_date, rapel_end_date
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      data.school_id, sppgId, data.report_date,
      data.menu_photo_url, data.students_photo_url,
      data.latitude, data.longitude, data.location_accuracy,
      data.device_timestamp, data.submitted_by,
      data.is_rapel || false, data.rapel_start_date || null, data.rapel_end_date || null
    ]
  );
  return { success: true, report: rows[0] };
}

export async function checkDailyReport(schoolId: string, reportDate?: string) {
  // Default to today in Asia/Jakarta
  if (!reportDate) {
    const now = new Date();
    const jakartaOffset = 7 * 60 * 60 * 1000;
    const jakartaNow = new Date(now.getTime() + jakartaOffset);
    reportDate = jakartaNow.toISOString().split('T')[0];
  }

  const { rows } = await db.query(
    `SELECT r.*,
            json_build_object('id', s.id, 'name', s.name, 'level', s.level, 'district', s.district, 'village', s.village) as schools,
            json_build_object('id', sp.id, 'name', sp.name, 'type', sp.type, 'location', sp.location, 'address', sp.address, 'phone', sp.phone) as sppgs
     FROM mbg_reports r
     LEFT JOIN schools s ON s.id = r.school_id
     LEFT JOIN sppgs sp ON sp.id = r.sppg_id
     WHERE r.school_id = $1 AND r.report_date = $2 LIMIT 1`,
    [schoolId, reportDate]
  );

  let report = rows[0] || null;
  if (report) {
    const [presigned] = await presignFields([report], ['menu_photo_url', 'students_photo_url']);
    report = presigned;
  }

  return {
    has_submitted: rows.length > 0,
    report_date: reportDate,
    report,
    is_in_rapel_period: false,
  };
}

export async function getSchoolProfile(userId: string) {
  const { rows } = await db.query(
    `SELECT u.id as user_id, u.email, u.role,
            p.full_name, p.phone, p.avatar_url,
            su.school_id, su.position,
            s.name as school_name, s.level as school_level,
            s.address as school_address, s.district as school_district,
            s.village as school_village, s.student_count as school_student_count,
            s.status as school_status, s.latitude as school_latitude,
            s.longitude as school_longitude, s.sppg_id,
            sp.name as sppg_name, sp.type as sppg_type,
            sp.location as sppg_location
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     LEFT JOIN school_users su ON su.user_id = u.id
     LEFT JOIN schools s ON s.id = su.school_id
     LEFT JOIN sppgs sp ON sp.id = s.sppg_id
     WHERE u.id = $1`,
    [userId]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

export async function updateSchoolProfile(userId: string, data: any) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    if (data.full_name || data.phone) {
      await client.query(
        `UPDATE user_profiles SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), updated_at = NOW()
         WHERE user_id = $3`,
        [data.full_name, data.phone, userId]
      );
    }

    if (data.position) {
      await client.query(
        `UPDATE school_users SET position = $1 WHERE user_id = $2`,
        [data.position, userId]
      );
    }

    if (data.school_id) {
      const schoolUpdates: string[] = [];
      const schoolParams: any[] = [];
      let idx = 1;

      for (const field of ['name', 'address', 'district', 'village', 'student_count', 'latitude', 'longitude']) {
        if (data[`school_${field}`] !== undefined) {
          schoolUpdates.push(`${field} = $${idx}`);
          schoolParams.push(data[`school_${field}`]);
          idx++;
        }
      }

      if (data.sppg_id !== undefined) {
        schoolUpdates.push(`sppg_id = $${idx}`);
        schoolParams.push(data.sppg_id);
        idx++;
      }

      if (schoolUpdates.length > 0) {
        schoolUpdates.push(`updated_at = NOW()`);
        schoolParams.push(data.school_id);
        await client.query(
          `UPDATE schools SET ${schoolUpdates.join(', ')} WHERE id = $${idx}`,
          schoolParams
        );
      }
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getSppgUser(userId: string) {
  const { rows } = await db.query(
    `SELECT sppg_id, position FROM sppg_users WHERE user_id = $1`,
    [userId]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

export async function getDistributionById(distributionId: string) {
  const { rows } = await db.query(
    `SELECT d.*,
            sp.name as sppg_name, sp.type as sppg_type,
            sp.location as sppg_location, sp.phone as sppg_phone,
            m.name as menu_name, m.total_calories,
            CASE WHEN d.recipient_type = 'school'
              THEN (SELECT row_to_json(s) FROM (SELECT id, name, level, district, village, latitude, longitude FROM schools WHERE id = d.recipient_id) s)
              ELSE (SELECT row_to_json(g) FROM (SELECT id, name, description FROM groups WHERE id = d.recipient_id) g)
            END as recipient
     FROM daily_distributions d
     LEFT JOIN sppgs sp ON sp.id = d.sppg_id
     LEFT JOIN menus m ON m.id = d.menu_id
     WHERE d.id = $1`,
    [distributionId]
  );
  if (rows.length === 0) return null;

  const dist = rows[0];

  // Get menu items
  const { rows: menuItems } = await db.query(
    `SELECT mi.* FROM menu_items mi
     JOIN menu_details md ON md.menu_item_id = mi.id
     WHERE md.menu_id = $1`,
    [dist.menu_id]
  );
  dist.menu_items = menuItems;

  // Get kitchen photos
  const { rows: photos } = await db.query(
    `SELECT * FROM sppg_kitchen_photos WHERE sppg_id = $1 ORDER BY display_order`,
    [dist.sppg_id]
  );
  dist.kitchen_photos = photos;

  return dist;
}

export async function getMbgReportStatistics(schoolId: string, monthParam?: string, yearParam?: string) {
  // Total reports
  const { rows: totalRows } = await db.query(
    `SELECT COUNT(*)::int as count FROM mbg_reports WHERE school_id = $1`,
    [schoolId]
  );
  const totalReports = totalRows[0]?.count || 0;

  // Determine target month/year
  const now = new Date();
  const targetYear = yearParam ? parseInt(yearParam) : now.getFullYear();
  const targetMonth = monthParam ? parseInt(monthParam) : now.getMonth() + 1;

  const firstDay = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
  const lastDayDate = new Date(targetYear, targetMonth, 0);
  const lastDay = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDayDate.getDate()).padStart(2, '0')}`;

  // Monthly reports
  const { rows: monthlyRows } = await db.query(
    `SELECT COUNT(*)::int as count FROM mbg_reports WHERE school_id = $1 AND report_date >= $2 AND report_date <= $3`,
    [schoolId, firstDay, lastDay]
  );
  const monthlyReports = monthlyRows[0]?.count || 0;

  // Weekly reports (last 7 days of the target month)
  const weekStart = new Date(lastDayDate);
  weekStart.setDate(weekStart.getDate() - 6);
  const firstDayDate = new Date(targetYear, targetMonth - 1, 1);
  const effectiveWeekStart = weekStart < firstDayDate ? firstDayDate : weekStart;
  const weekStartStr = effectiveWeekStart.toISOString().split('T')[0];

  const { rows: weeklyRows } = await db.query(
    `SELECT COUNT(*)::int as count FROM mbg_reports WHERE school_id = $1 AND report_date >= $2 AND report_date <= $3`,
    [schoolId, weekStartStr, lastDay]
  );
  const weeklyReports = weeklyRows[0]?.count || 0;

  // Recent reports (last 5)
  const { rows: recentReports } = await db.query(
    `SELECT r.id, r.report_date, r.menu_photo_url, r.students_photo_url,
            r.latitude, r.longitude, r.location_accuracy, r.is_rapel,
            r.rapel_start_date, r.rapel_end_date, r.created_at, r.updated_at,
            json_build_object('id', s.id, 'name', s.name, 'level', s.level, 'district', s.district, 'village', s.village) as schools,
            json_build_object('id', sp.id, 'name', sp.name, 'type', sp.type, 'location', sp.location, 'address', sp.address, 'phone', sp.phone) as sppgs
     FROM mbg_reports r
     LEFT JOIN schools s ON s.id = r.school_id
     LEFT JOIN sppgs sp ON sp.id = r.sppg_id
     WHERE r.school_id = $1
     ORDER BY r.report_date DESC LIMIT 5`,
    [schoolId]
  );

  // Current streak
  const { rows: allDates } = await db.query(
    `SELECT DISTINCT report_date FROM mbg_reports WHERE school_id = $1 ORDER BY report_date DESC`,
    [schoolId]
  );

  let currentStreak = 0;
  if (allDates.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(today);

    for (const row of allDates) {
      const reportDate = new Date(row.report_date);
      reportDate.setHours(0, 0, 0, 0);
      if (reportDate.getTime() === checkDate.getTime()) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Working days and completion rate
  const isCurrentMonth = targetYear === now.getFullYear() && targetMonth === (now.getMonth() + 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = isCurrentMonth && today < lastDayDate ? today : lastDayDate;

  let workingDaysCount = 0;
  const checkDate = new Date(firstDayDate);
  while (checkDate <= endDate) {
    const dow = checkDate.getDay();
    if (dow !== 0 && dow !== 6) workingDaysCount++;
    checkDate.setDate(checkDate.getDate() + 1);
  }

  const completionRate = workingDaysCount > 0 ? Math.round(monthlyReports / workingDaysCount * 100) : 0;

  const presignedReports = await presignFields(recentReports, ['menu_photo_url', 'students_photo_url']);

  return {
    total_reports: totalReports,
    monthly_reports: monthlyReports,
    weekly_reports: weeklyReports,
    current_streak: currentStreak,
    completion_rate: completionRate,
    working_days_this_month: workingDaysCount,
    recent_reports: presignedReports,
  };
}
