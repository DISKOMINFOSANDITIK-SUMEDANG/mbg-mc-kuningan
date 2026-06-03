import { query } from '../db/pool';
import { presignFields } from '../lib/s3';

const LEVEL_ORDER: Record<string, number> = {
  'KB': 1, 'PAUD': 2, 'TK': 3, 'RA': 4, 'SD': 5, 'MI': 6, 'MIS': 7, 'MIN': 8,
  'SMP': 9, 'MTS': 10, 'MTsS': 11, 'MTsN': 12, 'SMA': 13, 'MA': 14, 'MAS': 15,
  'MAN': 16, 'SMK': 17, 'SLB': 18, 'PKBM': 19, 'PONPES': 20,
};

export async function getSchoolReports(date: string, status: 'reported' | 'not-reported') {
  if (status === 'reported') {
    const { rows } = await query(
      `SELECT 
        r.report_date, r.created_at, r.menu_photo_url, r.students_photo_url,
        r.is_rapel, r.rapel_start_date, r.rapel_end_date,
        s.id as school_id, s.name as school_name, s.level, s.district, s.address,
        sp.id as sppg_id, sp.name as sppg_name,
        u.email, up.full_name,
        latest_menu.image_url as sppg_menu_photo_url
      FROM mbg_reports r
      INNER JOIN schools s ON r.school_id = s.id
      LEFT JOIN sppgs sp ON r.sppg_id = sp.id
      LEFT JOIN LATERAL (
        SELECT m.image_url FROM daily_distributions dd
        JOIN menus m ON dd.menu_id = m.id
        WHERE dd.sppg_id = sp.id AND dd.distribution_date = r.report_date
        AND m.image_url IS NOT NULL
        LIMIT 1
      ) latest_menu ON true
      INNER JOIN users u ON r.submitted_by = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE r.report_date = $1 
        OR (r.is_rapel = true AND r.rapel_start_date <= $1 AND r.rapel_end_date >= $1)
      ORDER BY r.created_at DESC
      LIMIT 1000`,
      [date]
    );

    const data = rows.map((r: any) => ({
      id: r.school_id,
      name: r.school_name,
      level: r.level,
      location: r.address,
      district: r.district,
      sppgName: r.sppg_name || '-',
      sppgId: r.sppg_id || '',
      updateTime: r.created_at,
      reportDate: r.report_date,
      hasMenuPhoto: !!r.menu_photo_url,
      hasStudentsPhoto: !!r.students_photo_url,
      menuPhotoUrl: r.menu_photo_url || null,
      studentsPhotoUrl: r.students_photo_url || null,
      submittedBy: r.full_name || r.email || '-',
      isRapel: r.is_rapel || false,
      rapelStartDate: r.rapel_start_date || null,
      rapelEndDate: r.rapel_end_date || null,
      sppgMenuPhotoUrl: r.sppg_menu_photo_url || null,
    }));

    const presignedData = await presignFields(data, ['menuPhotoUrl', 'studentsPhotoUrl', 'sppgMenuPhotoUrl']);
    return { data: presignedData, total: presignedData.length };
  } else {
    // Get reported school IDs
    const { rows: reported } = await query(
      `SELECT DISTINCT school_id FROM mbg_reports
       WHERE report_date = $1 
       OR (is_rapel = true AND rapel_start_date <= $1 AND rapel_end_date >= $1)`,
      [date]
    );
    const reportedIds = reported.map((r: any) => r.school_id);

    let sql = `SELECT s.id, s.name, s.level, s.district, s.address,
        sp.id as sppg_id, sp.name as sppg_name
      FROM schools s
      LEFT JOIN sppgs sp ON s.sppg_id = sp.id
      WHERE s.status = 'Active'`;
    const params: any[] = [];

    if (reportedIds.length > 0) {
      const placeholders = reportedIds.map((_: any, i: number) => `$${i + 1}`).join(', ');
      sql += ` AND s.id NOT IN (${placeholders})`;
      params.push(...reportedIds);
    }
    sql += ' ORDER BY s.name LIMIT 1000';

    const { rows } = await query(sql, params);
    const data = rows.map((s: any) => ({
      id: s.id,
      name: s.name,
      level: s.level,
      location: s.address,
      district: s.district,
      sppgName: s.sppg_name || '-',
      sppgId: s.sppg_id || '',
      updateTime: '-',
      reportDate: date,
      hasMenuPhoto: false,
      hasStudentsPhoto: false,
      menuPhotoUrl: null,
      studentsPhotoUrl: null,
      submittedBy: '-',
    }));

    return { data, total: data.length };
  }
}

export async function getSchoolReportsRecap(startDate: string, endDate: string) {
  const { rows } = await query(
    `SELECT 
      r.report_date, r.created_at, r.menu_photo_url, r.students_photo_url,
      r.is_rapel, r.rapel_start_date, r.rapel_end_date,
      s.id as school_id, s.name as school_name, s.level, s.district, s.address,
      sp.id as sppg_id, sp.name as sppg_name,
      u.email, up.full_name,
      latest_menu.image_url as sppg_menu_photo_url
    FROM mbg_reports r
    INNER JOIN schools s ON r.school_id = s.id
    LEFT JOIN sppgs sp ON r.sppg_id = sp.id
    LEFT JOIN LATERAL (
      SELECT m.image_url FROM daily_distributions dd
      JOIN menus m ON dd.menu_id = m.id
      WHERE dd.sppg_id = sp.id AND dd.distribution_date = r.report_date
      AND m.image_url IS NOT NULL
      LIMIT 1
    ) latest_menu ON true
    INNER JOIN users u ON r.submitted_by = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE (r.report_date >= $1 AND r.report_date <= $2)
      OR (r.is_rapel = true AND r.rapel_start_date <= $2 AND r.rapel_end_date >= $1)
    ORDER BY r.created_at DESC
    LIMIT 2000`,
    [startDate, endDate]
  );

  const data = rows.map((r: any) => ({
    id: r.school_id,
    name: r.school_name,
    level: r.level,
    location: r.address,
    district: r.district,
    sppgName: r.sppg_name || '-',
    sppgId: r.sppg_id || '',
    updateTime: r.created_at,
    reportDate: r.report_date,
    hasMenuPhoto: !!r.menu_photo_url,
    hasStudentsPhoto: !!r.students_photo_url,
    menuPhotoUrl: r.menu_photo_url || null,
    studentsPhotoUrl: r.students_photo_url || null,
    submittedBy: r.full_name || r.email || '-',
    isRapel: r.is_rapel || false,
    rapelStartDate: r.rapel_start_date || null,
    rapelEndDate: r.rapel_end_date || null,
    sppgMenuPhotoUrl: r.sppg_menu_photo_url || null,
  }));

  const presignedData = await presignFields(data, ['menuPhotoUrl', 'studentsPhotoUrl', 'sppgMenuPhotoUrl']);
  return { data: presignedData, total: presignedData.length };
}

export async function exportSchoolsReport(startDate?: string, endDate?: string) {
  // Fetch all schools
  const { rows: schools } = await query(
    `SELECT s.id, s.name, s.level, s.address, s.district, s.village,
      s.student_count, s.status, s.program_start_date, s.sppg_id,
      sp.name as sppg_name, sp.type as sppg_type
    FROM schools s
    LEFT JOIN sppgs sp ON s.sppg_id = sp.id
    ORDER BY s.name`
  );

  // Fetch report counts
  let reportSql = 'SELECT school_id, report_date FROM mbg_reports';
  const reportParams: any[] = [];
  const conditions: string[] = [];
  if (startDate) {
    conditions.push(`report_date >= $${reportParams.length + 1}`);
    reportParams.push(startDate);
  }
  if (endDate) {
    conditions.push(`report_date <= $${reportParams.length + 1}`);
    reportParams.push(endDate);
  }
  if (conditions.length) reportSql += ' WHERE ' + conditions.join(' AND ');

  const { rows: reports } = await query(reportSql, reportParams);

  const reportCountMap = new Map<string, number>();
  reports.forEach((r: any) => {
    reportCountMap.set(r.school_id, (reportCountMap.get(r.school_id) || 0) + 1);
  });

  const schoolsWithReports = schools.map((s: any) => ({
    id: s.id,
    name: s.name,
    level: s.level,
    address: s.address || '-',
    district: s.district,
    village: s.village || '-',
    studentCount: s.student_count || 0,
    sppgId: s.sppg_id,
    sppgName: s.sppg_name || '-',
    reportCount: reportCountMap.get(s.id) || 0,
  }));

  // Deduplicate by (name, level, district)
  const grouped = new Map<string, any[]>();
  schoolsWithReports.forEach((s: any) => {
    const key = `${s.name}|||${s.level}|||${s.district}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  });

  const deduplicated: any[] = [];
  grouped.forEach((group) => {
    if (group.length === 1) {
      deduplicated.push(group[0]);
    } else {
      group.sort((a: any, b: any) => {
        if (b.reportCount !== a.reportCount) return b.reportCount - a.reportCount;
        const aHas = a.sppgId ? 1 : 0;
        const bHas = b.sppgId ? 1 : 0;
        if (bHas !== aHas) return bHas - aHas;
        return b.studentCount - a.studentCount;
      });
      const best = { ...group[0] };
      best.reportCount = group.reduce((sum: number, s: any) => sum + s.reportCount, 0);
      if (best.studentCount === 0) {
        const max = Math.max(...group.map((s: any) => s.studentCount));
        if (max > 0) best.studentCount = max;
      }
      deduplicated.push(best);
    }
  });

  deduplicated.sort((a: any, b: any) => {
    const la = LEVEL_ORDER[a.level] || 99;
    const lb = LEVEL_ORDER[b.level] || 99;
    if (la !== lb) return la - lb;
    return a.name.localeCompare(b.name);
  });

  return {
    data: deduplicated,
    total: deduplicated.length,
    totalWithReports: deduplicated.filter((s: any) => s.reportCount > 0).length,
    totalWithoutReports: deduplicated.filter((s: any) => s.reportCount === 0).length,
  };
}

export async function getSppgDistributionDetails(date?: string) {
  const now = new Date();
  const indonesiaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const selectedDate = date || indonesiaTime.toISOString().split('T')[0];

  const [allSppgs, dateReports, dailyDist] = await Promise.all([
    query("SELECT id, name, type, location, capacity FROM sppgs WHERE name != 'SPPG DEMO'"),
    query(
      `SELECT sppg_id, school_id, report_date, created_at, s.name as school_name
       FROM mbg_reports r LEFT JOIN schools s ON r.school_id = s.id
       WHERE r.report_date = $1`,
      [selectedDate]
    ),
    query(
      `SELECT sppg_id, distribution_date, portions, recipient_type, recipient_id, created_at
       FROM daily_distributions WHERE distribution_date = $1`,
      [selectedDate]
    ),
  ]);

  // Get school names for distribution recipients
  const schoolRecipientIds = dailyDist.rows
    .filter((d: any) => d.recipient_type === 'school')
    .map((d: any) => d.recipient_id);
  
  const schoolNamesMap = new Map<string, string>();
  if (schoolRecipientIds.length > 0) {
    const placeholders = schoolRecipientIds.map((_: any, i: number) => `$${i + 1}`).join(', ');
    const { rows: schoolNames } = await query(
      `SELECT id, name FROM schools WHERE id IN (${placeholders})`, schoolRecipientIds
    );
    schoolNames.forEach((s: any) => schoolNamesMap.set(s.id, s.name));
  }

  // Build report map
  const reportMap = new Map<string, { count: number; schools: string[]; lastUpdate: string | null }>();
  dateReports.rows.forEach((r: any) => {
    const cur = reportMap.get(r.sppg_id) || { count: 0, schools: [], lastUpdate: null };
    cur.count += 1;
    if (r.school_name && !cur.schools.includes(r.school_name)) cur.schools.push(r.school_name);
    if (!cur.lastUpdate || r.created_at > cur.lastUpdate) cur.lastUpdate = r.created_at;
    reportMap.set(r.sppg_id, cur);
  });

  // Build distribution map
  const distMap = new Map<string, { totalPortions: number; schoolCount: number; schools: string[]; lastUpdate: string | null }>();
  dailyDist.rows.forEach((d: any) => {
    const cur = distMap.get(d.sppg_id) || { totalPortions: 0, schoolCount: 0, schools: [], lastUpdate: null };
    cur.totalPortions += d.portions || 0;
    if (d.recipient_type === 'school' && d.recipient_id) {
      const name = schoolNamesMap.get(d.recipient_id);
      if (name && !cur.schools.includes(name)) {
        cur.schools.push(name);
        cur.schoolCount += 1;
      }
    }
    if (!cur.lastUpdate || d.created_at > cur.lastUpdate) cur.lastUpdate = d.created_at;
    distMap.set(d.sppg_id, cur);
  });

  const distributed: any[] = [];
  const notDistributed: any[] = [];

  allSppgs.rows.forEach((sppg: any) => {
    const ri = reportMap.get(sppg.id);
    const di = distMap.get(sppg.id);
    const hasAny = ri !== undefined || di !== undefined;

    const allSchools = new Set([...(ri?.schools || []), ...(di?.schools || [])]);
    let lastUpdate = ri?.lastUpdate || null;
    if (di?.lastUpdate && (!lastUpdate || di.lastUpdate > lastUpdate)) lastUpdate = di.lastUpdate;

    const detail = {
      id: sppg.id,
      name: sppg.name,
      type: sppg.type,
      location: sppg.location,
      capacity: sppg.capacity,
      hasDistributedOnDate: hasAny,
      totalMBGReports: ri?.count || 0,
      mbgReportingSchools: ri?.schools || [],
      totalMBGReportingSchools: ri?.schools.length || 0,
      totalDistributions: di?.totalPortions || 0,
      distributedSchools: di?.schools || [],
      totalDistributedSchools: di?.schoolCount || 0,
      distributionDate: hasAny ? selectedDate : null,
      lastUpdateTime: lastUpdate,
      reportingSchools: Array.from(allSchools),
      totalReportingSchools: allSchools.size,
    };

    if (hasAny) distributed.push(detail);
    else notDistributed.push(detail);
  });

  distributed.sort((a, b) => a.name.localeCompare(b.name));
  notDistributed.sort((a, b) => a.name.localeCompare(b.name));

  return { distributed, notDistributed, selectedDate };
}

export async function getSppgDistributionRecap(startDate: string, endDate: string) {
  const { rows } = await query(
    `SELECT
      s.id,
      s.name::text AS name,
      s.type::text AS type,
      s.location::text AS location,
      s.capacity,
      COUNT(DISTINCT mr.report_date)::BIGINT AS update_count,
      COUNT(mr.id)::BIGINT AS total_portions,
      CASE
        WHEN COUNT(mr.id) > 0 THEN
          JSONB_AGG(
            JSONB_BUILD_OBJECT(
              'date', mr.report_date,
              'portions', 1,
              'recipient_type', 'school',
              'school_id', mr.school_id
            ) ORDER BY mr.report_date DESC
          ) FILTER (WHERE mr.report_date IS NOT NULL)
        ELSE
          '[]'::jsonb
      END AS distribution_dates,
      MAX(mr.created_at) AS last_update_time,
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT sch.name::text), NULL) AS reporting_schools,
      COUNT(DISTINCT mr.school_id)::BIGINT AS total_reporting_schools
    FROM sppgs s
    LEFT JOIN mbg_reports mr ON s.id = mr.sppg_id
      AND mr.report_date BETWEEN $1 AND $2
    LEFT JOIN schools sch ON mr.school_id = sch.id
    WHERE s.name != 'SPPG DEMO'
    GROUP BY s.id, s.name, s.type, s.location, s.capacity
    ORDER BY update_count DESC, total_portions DESC, s.name ASC`,
    [startDate, endDate]
  );

  return rows.map((sppg: any) => ({
    id: sppg.id,
    name: sppg.name,
    type: sppg.type,
    location: sppg.location,
    capacity: sppg.capacity,
    update_count: sppg.update_count,
    total_portions: sppg.total_portions,
    distribution_dates: sppg.distribution_dates,
    lastUpdateTime: sppg.last_update_time,
    reportingSchools: sppg.reporting_schools || [],
    totalReportingSchools: sppg.total_reporting_schools || 0,
  }));
}

export async function getSppgDistributionsRecap(startDate: string, endDate: string) {
  const [distResult, reportResult, photoResult] = await Promise.all([
    query(
      `SELECT dd.distribution_date, dd.portions, dd.recipient_type, dd.created_at, dd.updated_at,
        sp.id as sppg_id, sp.name as sppg_name, sp.type as sppg_type, sp.location as sppg_location,
        m.id as menu_id, m.name as menu_name, m.image_url as menu_image_url
      FROM daily_distributions dd
      INNER JOIN sppgs sp ON dd.sppg_id = sp.id
      LEFT JOIN menus m ON dd.menu_id = m.id
      WHERE dd.distribution_date >= $1 AND dd.distribution_date <= $2
      ORDER BY dd.distribution_date DESC
      LIMIT 2000`,
      [startDate, endDate]
    ),
    query(
      `SELECT r.report_date, r.created_at, r.is_rapel, r.rapel_start_date, r.rapel_end_date,
        sp.id as sppg_id, sp.name as sppg_name, sp.type as sppg_type, sp.location as sppg_location
      FROM mbg_reports r
      INNER JOIN sppgs sp ON r.sppg_id = sp.id
      WHERE (r.report_date >= $1 AND r.report_date <= $2)
        OR (r.is_rapel = true AND r.rapel_start_date <= $2 AND r.rapel_end_date >= $1)
      ORDER BY r.report_date DESC
      LIMIT 2000`,
      [startDate, endDate]
    ),
    query(
      `SELECT r.sppg_id, r.report_date, r.menu_photo_url, r.students_photo_url
      FROM mbg_reports r
      WHERE (r.report_date >= $1 AND r.report_date <= $2)
        OR (r.is_rapel = true AND r.rapel_start_date <= $2 AND r.rapel_end_date >= $1)
      ORDER BY r.created_at DESC`,
      [startDate, endDate]
    ),
  ]);

  // Build photo map: sppg_id-date -> first photos
  const sppgPhotoMap = new Map<string, { menuPhotoUrl: string | null; studentsPhotoUrl: string | null }>();
  photoResult.rows.forEach((r: any) => {
    const key = `${r.sppg_id}-${r.report_date}`;
    if (!sppgPhotoMap.has(key)) {
      sppgPhotoMap.set(key, {
        menuPhotoUrl: r.menu_photo_url || null,
        studentsPhotoUrl: r.students_photo_url || null,
      });
    }
  });

  const sppgMap = new Map<string, any>();

  distResult.rows.forEach((d: any) => {
    const key = `${d.sppg_id}-${d.distribution_date}`;
    if (!sppgMap.has(key)) {
      const photos = sppgPhotoMap.get(key);
      sppgMap.set(key, {
        id: d.sppg_id, name: d.sppg_name, type: d.sppg_type, location: d.sppg_location,
        totalPortions: 0, updateTime: d.updated_at, distributionDate: d.distribution_date,
        recipientCount: 0, menuName: d.menu_name || '-', recipients: new Set(),
        menuPhotoUrl: photos?.menuPhotoUrl || null,
        studentsPhotoUrl: photos?.studentsPhotoUrl || null,
        sppgMenuPhotoUrl: d.menu_image_url || null,
      });
    }
    const entry = sppgMap.get(key);
    entry.totalPortions += d.portions || 0;
    entry.recipients.add(d.recipient_type);
    if (new Date(d.updated_at) > new Date(entry.updateTime)) {
      entry.updateTime = d.updated_at;
      entry.menuName = d.menu_name || '-';
    }
  });

  reportResult.rows.forEach((r: any) => {
    const key = `${r.sppg_id}-${r.report_date}`;
    if (!sppgMap.has(key)) {
      const photos = sppgPhotoMap.get(key);
      sppgMap.set(key, {
        id: r.sppg_id, name: r.sppg_name, type: r.sppg_type, location: r.sppg_location,
        totalPortions: 1, updateTime: r.created_at, distributionDate: r.report_date,
        recipientCount: 1, menuName: 'Laporan MBG', recipients: new Set(['school']),
        menuPhotoUrl: photos?.menuPhotoUrl || null,
        studentsPhotoUrl: photos?.studentsPhotoUrl || null,
        sppgMenuPhotoUrl: null,
      });
    } else {
      const entry = sppgMap.get(key);
      entry.totalPortions += 1;
      entry.recipients.add('school');
      if (new Date(r.created_at) > new Date(entry.updateTime)) entry.updateTime = r.created_at;
    }
  });

  const data = Array.from(sppgMap.values())
    .map(({ recipients, ...rest }) => ({ ...rest, recipientCount: recipients.size }))
    .sort((a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime());

  const presignedData = await presignFields(data, ['menuPhotoUrl', 'studentsPhotoUrl', 'sppgMenuPhotoUrl']);
  return { data: presignedData, total: presignedData.length };
}

export async function getSppgDistributionsSubtab(date: string, status: 'distributed' | 'not-distributed') {
  if (status === 'distributed') {
    const [distResult, photoResult] = await Promise.all([
      query(
        `SELECT dd.distribution_date, dd.portions, dd.recipient_type, dd.created_at, dd.updated_at,
          sp.id as sppg_id, sp.name as sppg_name, sp.type as sppg_type, sp.location as sppg_location,
          m.id as menu_id, m.name as menu_name, m.image_url as menu_image_url
        FROM daily_distributions dd
        INNER JOIN sppgs sp ON dd.sppg_id = sp.id
        LEFT JOIN menus m ON dd.menu_id = m.id
        WHERE dd.distribution_date = $1
        ORDER BY dd.updated_at DESC`,
        [date]
      ),
      query(
        `SELECT r.sppg_id, r.menu_photo_url, r.students_photo_url
        FROM mbg_reports r
        WHERE r.report_date = $1
          OR (r.is_rapel = true AND r.rapel_start_date <= $1 AND r.rapel_end_date >= $1)
        ORDER BY r.created_at DESC`,
        [date]
      ),
    ]);

    // Build a map of sppg_id -> first available photos
    const sppgPhotoMap = new Map<string, { menuPhotoUrl: string | null; studentsPhotoUrl: string | null }>();
    photoResult.rows.forEach((r: any) => {
      if (!sppgPhotoMap.has(r.sppg_id)) {
        sppgPhotoMap.set(r.sppg_id, {
          menuPhotoUrl: r.menu_photo_url || null,
          studentsPhotoUrl: r.students_photo_url || null,
        });
      }
    });

    const sppgMap = new Map<string, any>();
    distResult.rows.forEach((d: any) => {
      if (!sppgMap.has(d.sppg_id)) {
        const photos = sppgPhotoMap.get(d.sppg_id);
        sppgMap.set(d.sppg_id, {
          id: d.sppg_id, name: d.sppg_name, type: d.sppg_type, location: d.sppg_location,
          totalPortions: 0, updateTime: d.updated_at, distributionDate: d.distribution_date,
          recipientCount: 0, menuName: d.menu_name || '-', recipients: new Set(),
          menuPhotoUrl: photos?.menuPhotoUrl || null,
          studentsPhotoUrl: photos?.studentsPhotoUrl || null,
          sppgMenuPhotoUrl: d.menu_image_url || null,
        });
      }
      const entry = sppgMap.get(d.sppg_id);
      entry.totalPortions += d.portions || 0;
      entry.recipients.add(d.recipient_type);
      if (new Date(d.updated_at) > new Date(entry.updateTime)) {
        entry.updateTime = d.updated_at;
        entry.menuName = d.menu_name || '-';
      }
    });

    const data = Array.from(sppgMap.values())
      .map(({ recipients, ...rest }) => ({
        ...rest,
        recipientCount: recipients.size,
        isInactive: false,
        statusNote: null,
      }))
      .sort((a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime());

    // On non-Sunday days, inactive SPPGs count as "Sudah Melaporkan"
    const dateObj = new Date(`${date}T00:00:00+07:00`);
    const isSunday = dateObj.getDay() === 0;

    let inactiveRows: any[] = [];
    if (!isSunday) {
      const { rows: inactiveSppgs } = await query(
        `SELECT id, name, type, location
         FROM sppgs
         WHERE COALESCE(is_active, true) = false
           AND name NOT IN ('Dapur Pusat Tanjungsari', 'Dapur Satelit Modular Sirah Cai', 'SPPG DEMO')
         ORDER BY name`
      );
      inactiveRows = inactiveSppgs
        .filter((s: any) => !sppgMap.has(s.id))
        .map((s: any) => ({
          id: s.id, name: s.name, type: s.type, location: s.location,
          totalPortions: 0, updateTime: '-', distributionDate: date,
          recipientCount: 0, menuName: '-',
          menuPhotoUrl: null, studentsPhotoUrl: null, sppgMenuPhotoUrl: null,
          isInactive: true, statusNote: 'SPPG dinonaktifkan sementara',
        }));
    }

    const mergedData = [...data, ...inactiveRows];
    const presignedData = await presignFields(mergedData, ['menuPhotoUrl', 'studentsPhotoUrl', 'sppgMenuPhotoUrl']);
    return { data: presignedData, total: data.length + inactiveRows.length };
  } else {
    // Get distributed SPPG IDs
    const { rows: distSppgs } = await query(
      'SELECT DISTINCT sppg_id FROM daily_distributions WHERE distribution_date = $1',
      [date]
    );
    const activeIds = distSppgs.map((d: any) => d.sppg_id);

    // Get active SPPGs that didn't distribute
    let sql = `SELECT id, name, type, location
               FROM sppgs
               WHERE COALESCE(is_active, true) = true
                 AND name NOT IN ('Dapur Pusat Tanjungsari', 'Dapur Satelit Modular Sirah Cai', 'SPPG DEMO')`;
    const params: any[] = [];
    if (activeIds.length > 0) {
      const placeholders = activeIds.map((_: any, i: number) => `$${i + 1}`).join(', ');
      sql += ` AND id NOT IN (${placeholders})`;
      params.push(...activeIds);
    }
    sql += ' ORDER BY name';

    const { rows } = await query(sql, params);
    const activeData = rows.map((s: any) => ({
      id: s.id, name: s.name, type: s.type, location: s.location,
      totalPortions: 0, updateTime: '-', distributionDate: date,
      recipientCount: 0, menuName: '-',
      menuPhotoUrl: null, studentsPhotoUrl: null, sppgMenuPhotoUrl: null,
      isInactive: false, statusNote: null,
    }));

    // Inactive SPPGs: only include in "Belum Melaporkan" on Sundays.
    // On other days (Mon-Sat), they count as "Sudah Melaporkan" (handled in distributed branch).
    const dateObj = new Date(`${date}T00:00:00+07:00`);
    const isSunday = dateObj.getDay() === 0;

    let inactiveData: any[] = [];
    if (isSunday) {
      const { rows: inactiveSppgs } = await query(
        `SELECT id, name, type, location
         FROM sppgs
         WHERE COALESCE(is_active, true) = false
           AND name NOT IN ('Dapur Pusat Tanjungsari', 'Dapur Satelit Modular Sirah Cai', 'SPPG DEMO')
         ORDER BY name`
      );
      inactiveData = inactiveSppgs.map((s: any) => ({
        id: s.id, name: s.name, type: s.type, location: s.location,
        totalPortions: 0, updateTime: '-', distributionDate: date,
        recipientCount: 0, menuName: '-',
        menuPhotoUrl: null, studentsPhotoUrl: null, sppgMenuPhotoUrl: null,
        isInactive: true, statusNote: 'SPPG dinonaktifkan sementara',
      }));
    }

    const data = [...activeData, ...inactiveData];
    return { data, total: data.length };
  }
}
