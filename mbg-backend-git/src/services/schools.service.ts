import db from '../db/pool';
import { buildSmartSearchConditions, normalizeSearchQuery } from '../utils/schoolSearch';
import { presignFields } from '../lib/s3';

export async function listSchools(query: {
  q?: string;
  district?: string;
  village?: string;
  level?: string;
  status?: string;
  sppg_id?: string;
}) {
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (query.q) {
    const search = buildSmartSearchConditions(query.q);
    // Prefix unqualified column names with sc.
    const prefixed = search.clause
      .replace(/\bname\b/g, 'sc.name')
      .replace(/\bdistrict\b/g, 'sc.district')
      .replace(/\bvillage\b/g, 'sc.village')
      .replace(/\baddress\b/g, 'sc.address');
    conditions.push(`(${prefixed})`);
    params.push(...search.params);
    idx += search.params.length;
  }

  if (query.district) {
    conditions.push(`sc.district = $${idx}`);
    params.push(query.district);
    idx++;
  }
  if (query.village) {
    conditions.push(`sc.village = $${idx}`);
    params.push(query.village);
    idx++;
  }
  if (query.level) {
    conditions.push(`sc.level = $${idx}`);
    params.push(query.level);
    idx++;
  }
  if (query.status) {
    conditions.push(`sc.status = $${idx}`);
    params.push(query.status);
    idx++;
  }
  if (query.sppg_id) {
    conditions.push(`sc.sppg_id = $${idx}`);
    params.push(query.sppg_id);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await db.query(
    `SELECT sc.id, sc.name, sc.level, sc.address, sc.district, sc.village,
            sc.student_count, sc.program_start_date, sc.status, sc.sppg_id,
            sc.latitude, sc.longitude, sc.created_at, sc.updated_at,
            sp.id as sppg_row_id, sp.name as sppg_name, sp.type as sppg_type,
            sp.capacity as sppg_capacity, sp.location as sppg_location
     FROM schools sc
     LEFT JOIN sppgs sp ON sp.id = sc.sppg_id
     ${where}
     ORDER BY sc.name`,
    params
  );

  let transformed = rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    level: r.level,
    address: r.address,
    district: r.district,
    village: r.village,
    studentCount: r.student_count,
    programStartDate: r.program_start_date,
    status: r.status,
    sppgId: r.sppg_id,
    coordinates: r.latitude && r.longitude ? { lat: r.latitude, lng: r.longitude } : undefined,
    sppg: r.sppg_row_id
      ? { id: r.sppg_row_id, name: r.sppg_name, type: r.sppg_type, capacity: r.sppg_capacity, location: r.sppg_location }
      : undefined,
  }));

  // Smart relevance sorting when search query present
  if (query.q && transformed.length > 0) {
    const queryLower = query.q.toLowerCase().trim();
    const queryWords = queryLower.split(' ').filter((w: string) => w.length >= 1);
    const abbreviationMatch = queryLower.match(/\b(sd|smp|sma|smk)n\s*(\d+)/i);
    const schoolNumberMatch = queryLower.match(/\b(sd|smp|sma|smk)\s+(?:negeri\s+)?(\d+)/i);
    let queryLevel: string | null = null;
    let queryNumber: string | null = null;
    if (abbreviationMatch) { queryLevel = abbreviationMatch[1].toUpperCase(); queryNumber = abbreviationMatch[2]; }
    else if (schoolNumberMatch) { queryLevel = schoolNumberMatch[1].toUpperCase(); queryNumber = schoolNumberMatch[2]; }

    transformed.sort((a: any, b: any) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      if (aName === queryLower) return -1;
      if (bName === queryLower) return 1;
      if (queryLevel && queryNumber) {
        const re = /\b(sd|smp|sma|smk)(?:n)?\s+(?:negeri\s+)?(\d+)/i;
        const aM = aName.match(re), bM = bName.match(re);
        const aLM = aM && aM[1].toUpperCase() === queryLevel;
        const bLM = bM && bM[1].toUpperCase() === queryLevel;
        const aNM = aM && aM[2] === queryNumber;
        const bNM = bM && bM[2] === queryNumber;
        if (aLM && aNM && !(bLM && bNM)) return -1;
        if (!(aLM && aNM) && bLM && bNM) return 1;
        if (aLM && !bLM) return -1;
        if (!aLM && bLM) return 1;
      }
      if (aName.startsWith(queryLower) && !bName.startsWith(queryLower)) return -1;
      if (!aName.startsWith(queryLower) && bName.startsWith(queryLower)) return 1;
      let aScore = 0, bScore = 0;
      queryWords.forEach((word: string) => {
        if (word.length < 2) return;
        if (aName.includes(word)) aScore += aName.indexOf(word) === 0 ? 10 : 5;
        if (bName.includes(word)) bScore += bName.indexOf(word) === 0 ? 10 : 5;
      });
      if (aScore !== bScore) return bScore - aScore;
      if (Math.abs(aName.length - bName.length) > 15) return aName.length - bName.length;
      return aName.localeCompare(bName);
    });
  }

  return transformed;
}

export async function getSchoolById(id: string) {
  const { rows } = await db.query(
    `SELECT sc.id, sc.name, sc.level, sc.address, sc.district, sc.village,
            sc.student_count, sc.program_start_date, sc.status, sc.sppg_id,
            sc.latitude, sc.longitude, sc.created_at, sc.updated_at,
            sp.id as sppg_row_id, sp.name as sppg_name, sp.type as sppg_type,
            sp.capacity as sppg_capacity, sp.location as sppg_location,
            sp.phone as sppg_phone, sp.email as sppg_email, sp.address as sppg_address
     FROM schools sc
     LEFT JOIN sppgs sp ON sp.id = sc.sppg_id
     WHERE sc.id = $1`,
    [id]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    level: r.level,
    address: r.address,
    district: r.district,
    village: r.village,
    studentCount: r.student_count,
    programStartDate: r.program_start_date,
    status: r.status,
    coordinates: r.latitude && r.longitude ? { lat: r.latitude, lng: r.longitude } : undefined,
    sppgId: r.sppg_id,
    sppg: r.sppg_row_id ? {
      id: r.sppg_row_id,
      name: r.sppg_name,
      type: r.sppg_type,
      capacity: r.sppg_capacity,
      location: r.sppg_location,
      contact: { phone: r.sppg_phone, email: r.sppg_email, address: r.sppg_address }
    } : undefined,
  };
}

export async function getSchoolReports(schoolId: string, date?: string) {
  let sql = `SELECT id, report_date, menu_photo_url, students_photo_url,
                    latitude, longitude, location_accuracy, device_timestamp,
                    created_at, updated_at, is_rapel, rapel_start_date, rapel_end_date
             FROM mbg_reports WHERE school_id = $1`;
  const params: any[] = [schoolId];

  if (date) {
    sql += ` AND (report_date = $2 OR (is_rapel = true AND rapel_start_date <= $2 AND rapel_end_date >= $2))`;
    params.push(date);
  }
  sql += ' ORDER BY created_at DESC';

  const { rows } = await db.query(sql, params);
  return presignFields(rows, ['menu_photo_url', 'students_photo_url']);
}
