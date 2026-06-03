import db from '../db/pool';
import { presignFields, presignUrl } from '../lib/s3';

const EXCLUDED_SPPG_NAMES = ['Dapur Pusat Tanjungsari', 'Dapur Satelit Modular Sirah Cai', 'SPPG DEMO'];

function excludeClause(paramStart: number): { clause: string; params: string[] } {
  const placeholders = EXCLUDED_SPPG_NAMES.map((_, i) => `$${paramStart + i}`);
  return { clause: `name NOT IN (${placeholders.join(',')})`, params: [...EXCLUDED_SPPG_NAMES] };
}

export async function listSppgs(query: {
  q?: string;
  type?: string;
  location?: string;
  include_stats?: string;
  paginate?: string;
  page?: number;
  limit?: number;
}) {
  const exc = excludeClause(1);

  if (query.include_stats === 'true') {
    const { rows: sppgData } = await db.query(
      `SELECT id, id_sppg, name, type, location, latitude, longitude, phone, address,
              operating_hours_start, operating_hours_end, foundation_id, is_active
       FROM sppgs WHERE ${exc.clause}`,
      exc.params
    );

    const sppgIds = sppgData.map((s: any) => s.id);
    const { rows: schools } = sppgIds.length
      ? await db.query(`SELECT id, sppg_id, district, student_count FROM schools WHERE sppg_id = ANY($1)`, [sppgIds])
      : { rows: [] };

    const foundationIds = sppgData.map((s: any) => s.foundation_id).filter(Boolean);
    const { rows: foundations } = foundationIds.length
      ? await db.query(`SELECT id, name FROM foundation WHERE id = ANY($1)`, [foundationIds])
      : { rows: [] };
    const fMap = new Map(foundations.map((f: any) => [f.id, f.name]));

    return sppgData.map((sppg: any) => {
      const sppgSchools = schools.filter((s: any) => s.sppg_id === sppg.id);
      const uniqueDistricts = new Set(sppgSchools.map((s: any) => s.district).filter(Boolean));
      return {
        id: sppg.id,
        id_sppg: sppg.id_sppg,
        sppg_name: sppg.name,
        type: sppg.type,
        location: sppg.location,
        latitude: sppg.latitude,
        longitude: sppg.longitude,
        phone: sppg.phone,
        address: sppg.address,
        operating_hours_start: sppg.operating_hours_start,
        operating_hours_end: sppg.operating_hours_end,
        foundation_name: fMap.get(sppg.foundation_id) || null,
        is_active: sppg.is_active,
        total_schools: sppgSchools.length,
        total_districts: uniqueDistricts.size,
        total_students: sppgSchools.reduce((sum: number, s: any) => sum + (s.student_count || 0), 0),
      };
    });
  }

  // Normal list
  const conditions: string[] = [exc.clause];
  const params: any[] = [...exc.params];
  let idx = exc.params.length + 1;

  if (query.q) {
    conditions.push(`(name ILIKE $${idx} OR type ILIKE $${idx} OR location ILIKE $${idx} OR address ILIKE $${idx})`);
    params.push(`%${query.q}%`);
    idx++;
  }
  if (query.type) {
    conditions.push(`type = $${idx}`);
    params.push(query.type);
    idx++;
  }
  if (query.location) {
    conditions.push(`location ILIKE $${idx}`);
    params.push(`%${query.location}%`);
    idx++;
  }

  const { rows } = await db.query(
    `SELECT id, id_sppg, name, type, capacity, location, latitude, longitude,
            phone, email, address, operating_hours_start, operating_hours_end,
            kitchen_photo_url, foundation_id, is_active, created_at, updated_at
     FROM sppgs WHERE ${conditions.join(' AND ')} ORDER BY name`,
    params
  );

  const sppgIds = rows.map((s: any) => s.id);
  const [
    { rows: schoolCounts },
    { rows: facilities },
    { rows: nutritionists },
    { rows: certificates },
    { rows: kitchenPhotos },
  ] = sppgIds.length
    ? await Promise.all([
        db.query(`SELECT sppg_id, COUNT(*)::int as cnt FROM schools WHERE sppg_id = ANY($1) GROUP BY sppg_id`, [sppgIds]),
        db.query(`SELECT sppg_id, facility_name FROM sppg_facilities WHERE sppg_id = ANY($1) ORDER BY created_at ASC`, [sppgIds]),
        db.query(
          `SELECT DISTINCT ON (sppg_id) sppg_id, name, qualification, experience, photo_url
           FROM nutritionists
           WHERE sppg_id = ANY($1)
           ORDER BY sppg_id, updated_at DESC NULLS LAST, created_at DESC NULLS LAST`,
          [sppgIds]
        ),
        db.query(
          `SELECT DISTINCT ON (sppg_id) sppg_id, certificate_number, file_url, issue_date, expiry_date
           FROM slhs_certificates
           WHERE sppg_id = ANY($1)
           ORDER BY sppg_id, updated_at DESC NULLS LAST, created_at DESC NULLS LAST`,
          [sppgIds]
        ),
        db.query(
          `SELECT sppg_id, id, photo_url, caption, display_order
           FROM sppg_kitchen_photos
           WHERE sppg_id = ANY($1)
           ORDER BY sppg_id, display_order ASC, created_at ASC`,
          [sppgIds]
        ),
      ])
    : [
        { rows: [] },
        { rows: [] },
        { rows: [] },
        { rows: [] },
        { rows: [] },
      ];

  const scMap = new Map(schoolCounts.map((r: any) => [r.sppg_id, r.cnt]));
  const facilitiesMap = new Map<string, string[]>();
  facilities.forEach((facility: any) => {
    const current = facilitiesMap.get(facility.sppg_id) || [];
    current.push(facility.facility_name);
    facilitiesMap.set(facility.sppg_id, current);
  });

  const nutritionistMap = new Map(nutritionists.map((nutritionist: any) => [nutritionist.sppg_id, nutritionist]));
  const certificateMap = new Map(certificates.map((certificate: any) => [certificate.sppg_id, certificate]));
  const kitchenPhotosMap = new Map<string, any[]>();
  kitchenPhotos.forEach((photo: any) => {
    const current = kitchenPhotosMap.get(photo.sppg_id) || [];
    current.push({
      id: photo.id,
      photoUrl: photo.photo_url || '',
      caption: photo.caption || '',
      displayOrder: photo.display_order,
    });
    kitchenPhotosMap.set(photo.sppg_id, current);
  });

  const mappedRows = rows.map((sppg: any) => {
    const nutritionist = nutritionistMap.get(sppg.id) as any;
    const certificate = certificateMap.get(sppg.id) as any;
    const photos = kitchenPhotosMap.get(sppg.id) || [];

    return {
      id: sppg.id,
      id_sppg: sppg.id_sppg,
      name: sppg.name,
      type: sppg.type,
      capacity: sppg.capacity,
      location: sppg.location,
      coordinates: { lat: sppg.latitude, lng: sppg.longitude },
      contact: { phone: sppg.phone, email: sppg.email, address: sppg.address },
      operatingHours: { start: sppg.operating_hours_start, end: sppg.operating_hours_end },
      kitchenPhoto: sppg.kitchen_photo_url || '',
      foundation_id: sppg.foundation_id,
      is_active: sppg.is_active,
      created_at: sppg.created_at,
      updated_at: sppg.updated_at,
      school_count: scMap.get(sppg.id) || 0,
      facilities: facilitiesMap.get(sppg.id) || [],
      schools: [],
      nutritionist: nutritionist
        ? {
            name: nutritionist.name || '',
            qualification: nutritionist.qualification || '',
            experience: nutritionist.experience || '',
            photo: nutritionist.photo_url || '',
          }
        : { name: '', qualification: '', experience: '', photo: '' },
      slhsCertificate: certificate
        ? {
            fileUrl: certificate.file_url || '',
            issueDate: certificate.issue_date || '',
            expiryDate: certificate.expiry_date || '',
            certificateNumber: certificate.certificate_number || '',
          }
        : { fileUrl: '', issueDate: '', expiryDate: '', certificateNumber: '' },
      kitchenPhotos: photos,
      kitchen_photo_count: photos.length,
    };
  });

  if (query.paginate === 'true') {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Number(query.limit || 10));
    const total = mappedRows.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const end = start + limit;
    const data = mappedRows.slice(start, end);

    return {
      data,
      pagination: {
        page: safePage,
        limit,
        total,
        total_pages: totalPages,
        has_more: safePage < totalPages,
      },
    };
  }

  return mappedRows;
}

export async function getSppgById(id: string) {
  const { rows } = await db.query(
    `SELECT id, id_sppg, name, type, capacity, location, latitude, longitude,
            phone, email, address, operating_hours_start, operating_hours_end,
            kitchen_photo_url, foundation_id, is_active, created_at, updated_at
     FROM sppgs WHERE id = $1`,
    [id]
  );
  if (rows.length === 0) return null;
  const sppg = rows[0];

  const [facRes, nutRes, certRes, schoolRes] = await Promise.all([
    db.query(`SELECT facility_name FROM sppg_facilities WHERE sppg_id = $1`, [id]),
    db.query(`SELECT name, qualification, experience, photo_url FROM nutritionists WHERE sppg_id = $1 LIMIT 1`, [id]),
    db.query(`SELECT certificate_number, file_url, issue_date, expiry_date FROM slhs_certificates WHERE sppg_id = $1 LIMIT 1`, [id]),
    db.query(`SELECT id, name, level, district, village FROM schools WHERE sppg_id = $1`, [id]),
  ]);

  const nut = nutRes.rows[0];
  const cert = certRes.rows[0];

  // Presign S3 URLs for nutritionist photo and SLHS certificate
  const nutPhoto = nut?.photo_url ? await presignUrl(nut.photo_url) : '';
  const certFileUrl = cert?.file_url ? await presignUrl(cert.file_url) : '';

  return {
    id: sppg.id,
    id_sppg: sppg.id_sppg,
    name: sppg.name,
    type: sppg.type,
    capacity: sppg.capacity,
    location: sppg.location,
    coordinates: { lat: sppg.latitude, lng: sppg.longitude },
    contact: { phone: sppg.phone, email: sppg.email, address: sppg.address },
    operatingHours: { start: sppg.operating_hours_start, end: sppg.operating_hours_end },
    kitchenPhoto: sppg.kitchen_photo_url || '',
    foundation_id: sppg.foundation_id,
    is_active: sppg.is_active,
    created_at: sppg.created_at,
    updated_at: sppg.updated_at,
    facilities: facRes.rows.map((f: any) => f.facility_name),
    schools: schoolRes.rows.map((s: any) => s.id),
    nutritionist: nut
      ? { name: nut.name, qualification: nut.qualification, experience: nut.experience, photo: nutPhoto }
      : { name: '', qualification: '', experience: '', photo: '' },
    slhsCertificate: cert
      ? { fileUrl: certFileUrl, issueDate: cert.issue_date, expiryDate: cert.expiry_date, certificateNumber: cert.certificate_number }
      : { fileUrl: '', issueDate: '', expiryDate: '', certificateNumber: '' },
  };
}

export async function getSppgDistributions(sppgId: string) {
  const { rows: data } = await db.query(
    `SELECT id, distribution_date, portions, notes, recipient_id, menu_id
     FROM daily_distributions
     WHERE sppg_id = $1 AND recipient_type = 'school'
     ORDER BY distribution_date DESC`,
    [sppgId]
  );

  const recipientIds = [...new Set(data.map((d: any) => d.recipient_id).filter(Boolean))];
  const menuIds = [...new Set(data.map((d: any) => d.menu_id).filter(Boolean))];

  const [schoolsRes, menusRes, menuDetailsRes] = await Promise.all([
    recipientIds.length ? db.query(`SELECT id, name, level, address FROM schools WHERE id = ANY($1)`, [recipientIds]) : { rows: [] },
    menuIds.length ? db.query(`SELECT id, name, total_calories, image_url FROM menus WHERE id = ANY($1)`, [menuIds]) : { rows: [] },
    menuIds.length ? db.query(
      `SELECT md.menu_id, mi.name, mi.description, mi.calories, mi.protein, mi.carbs, mi.fat
       FROM menu_details md JOIN menu_items mi ON mi.id = md.menu_item_id
       WHERE md.menu_id = ANY($1)`, [menuIds]
    ) : { rows: [] },
  ]);

  const presignedMenus = await presignFields(menusRes.rows, ['image_url']);

  const schoolsMap = new Map(schoolsRes.rows.map((s: any) => [s.id, s]));
  const menusMap = new Map(presignedMenus.map((m: any) => [m.id, m]));
  const menuItemsMap = new Map<string, any[]>();
  menuDetailsRes.rows.forEach((d: any) => {
    const items = menuItemsMap.get(d.menu_id) || [];
    items.push({
      name: d.name,
      description: d.description,
      nutritionInfo: { calories: d.calories, protein: d.protein, carbs: d.carbs, fat: d.fat },
    });
    menuItemsMap.set(d.menu_id, items);
  });

  return data.map((item: any) => {
    const school = schoolsMap.get(item.recipient_id) as any;
    const menu = menusMap.get(item.menu_id) as any;
    return {
      id: item.id,
      distribution_date: item.distribution_date,
      portions: item.portions,
      notes: item.notes,
      school_id: school?.id,
      school_name: school?.name || 'Sekolah tidak diketahui',
      school_level: school?.level || '',
      school_address: school?.address || 'Alamat tidak tersedia',
      menu_name: menu?.name || 'Menu tidak diketahui',
      menu_image: menu?.image_url || null,
      total_calories: menu?.total_calories || 0,
      menu_items: menuItemsMap.get(item.menu_id) || [],
    };
  });
}

export async function getSppgKitchenPhotos(sppgId: string) {
  const { rows } = await db.query(
    `SELECT * FROM sppg_kitchen_photos WHERE sppg_id = $1 ORDER BY display_order ASC`,
    [sppgId]
  );
  return presignFields(rows, ['photo_url']);
}

export async function getSppgReports(sppgId: string, date?: string) {
  const now = new Date();
  const indonesiaTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const today = indonesiaTime.toISOString().split('T')[0];
  const selectedDate = date || today;

  const { rows } = await db.query(
    `SELECT r.id, r.report_date, r.menu_photo_url, r.students_photo_url,
            r.latitude, r.longitude, r.location_accuracy, r.device_timestamp,
            r.created_at, r.is_rapel, r.rapel_start_date, r.rapel_end_date,
            s.id as school_id, s.name as school_name, s.level as school_level,
            s.address as school_address, s.district as school_district,
            s.village as school_village, s.student_count as school_student_count
     FROM mbg_reports r
     LEFT JOIN schools s ON s.id = r.school_id
     WHERE r.sppg_id = $1
       AND (r.report_date = $2 OR (r.is_rapel = true AND r.rapel_start_date <= $2 AND r.rapel_end_date >= $2))
     ORDER BY r.created_at DESC`,
    [sppgId, selectedDate]
  );

  const mapped = rows.map((r: any) => ({
    id: r.id,
    report_date: r.report_date,
    menu_photo_url: r.menu_photo_url,
    students_photo_url: r.students_photo_url,
    latitude: r.latitude,
    longitude: r.longitude,
    location_accuracy: r.location_accuracy,
    device_timestamp: r.device_timestamp,
    created_at: r.created_at,
    is_rapel: r.is_rapel,
    rapel_start_date: r.rapel_start_date,
    rapel_end_date: r.rapel_end_date,
    schools: {
      id: r.school_id,
      name: r.school_name,
      level: r.school_level,
      address: r.school_address,
      district: r.school_district,
      village: r.school_village,
      student_count: r.school_student_count,
    },
  }));

  const reports = await presignFields(mapped, ['menu_photo_url', 'students_photo_url']);
  return { reports, selectedDate, sppgId };
}

export async function getSppgSchools(sppgId: string) {
  const { rows } = await db.query(
    `SELECT id, name, address, level, village, district FROM schools WHERE sppg_id = $1 ORDER BY name`,
    [sppgId]
  );
  return rows;
}
