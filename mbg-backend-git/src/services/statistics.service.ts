import { query } from '../db/pool';

const EXCLUDED_SPPG_NAMES = ['Dapur Pusat Tanjungsari', 'Dapur Satelit Modular Sirah Cai', 'SPPG DEMO'];

function getIndonesiaToday(): string {
  const now = new Date();
  const indonesiaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  return indonesiaTime.toISOString().split('T')[0];
}

export async function getStatistics() {
  const today = getIndonesiaToday();
  const placeholders = EXCLUDED_SPPG_NAMES.map((_, i) => `$${i + 1}`).join(', ');

  const [
    sppgCount,
    schoolCount,
    sppgsWithMenus,
    todayReports,
    todayDistributions,
    schoolStudents,
  ] = await Promise.all([
    query(`SELECT COUNT(*) as count FROM sppgs WHERE name NOT IN (${placeholders})`, EXCLUDED_SPPG_NAMES),
    query('SELECT COUNT(*) as count FROM schools'),
    query('SELECT DISTINCT sppg_id FROM menus WHERE sppg_id IS NOT NULL'),
    query(
      `SELECT sppg_id, school_id FROM mbg_reports 
       WHERE report_date = $1 
       OR (is_rapel = true AND rapel_start_date <= $1 AND rapel_end_date >= $1)`,
      [today]
    ),
    query('SELECT sppg_id, portions FROM daily_distributions WHERE distribution_date = $1', [today]),
    query("SELECT student_count FROM schools WHERE status = 'Active'"),
  ]);

  const totalSppgs = parseInt(sppgCount.rows[0].count);
  const totalSchools = parseInt(schoolCount.rows[0].count);
  const totalStudents = schoolStudents.rows.reduce((sum: number, r: any) => sum + (r.student_count || 0), 0);
  const sppgsWithMenusCount = sppgsWithMenus.rows.length;

  const uniqueReportSppgIds = [...new Set(todayReports.rows.map((r: any) => r.sppg_id))];
  const uniqueDistSppgIds = [...new Set(todayDistributions.rows.map((d: any) => d.sppg_id))];
  const allActiveSppgIds = new Set([...uniqueReportSppgIds, ...uniqueDistSppgIds]);

  const uniqueSchoolIds = [...new Set(todayReports.rows.map((r: any) => r.school_id))];
  const schoolsReportedToday = uniqueSchoolIds.length;
  const totalMBGReportsToday = todayReports.rows.length;
  const totalDistributionPortionsToday = todayDistributions.rows.reduce((sum: number, d: any) => sum + (d.portions || 0), 0);

  const percentage = totalSppgs ? Math.round((sppgsWithMenusCount / totalSppgs) * 100) : 0;
  const distributionPercentage = totalSppgs ? Math.round((allActiveSppgIds.size / totalSppgs) * 100) : 0;
  const schoolReportPercentage = totalSchools ? Math.round((schoolsReportedToday / totalSchools) * 100) : 0;

  return {
    totalSppgs,
    totalSchools,
    totalStudents,
    sppgsWithMenus: sppgsWithMenusCount,
    percentage,
    todayDistribution: {
      sppgsWithDistributions: allActiveSppgIds.size,
      sppgsWithMBGReports: uniqueReportSppgIds.length,
      sppgsWithDailyDistributions: uniqueDistSppgIds.length,
      totalMBGReports: totalMBGReportsToday,
      totalDistributionPortions: totalDistributionPortionsToday,
      totalPortions: totalMBGReportsToday + totalDistributionPortionsToday,
      distributionPercentage,
      schoolsReportedToday,
      schoolsNotReportedToday: totalSchools - schoolsReportedToday,
      schoolReportPercentage,
      date: today,
    },
  };
}

export async function getSchoolStatistics() {
  const today = getIndonesiaToday();
  const placeholders = EXCLUDED_SPPG_NAMES.map((_, i) => `$${i + 1}`).join(', ');

  const [schoolCount, sppgCount, todayDist, weekDist] = await Promise.all([
    query('SELECT COUNT(*) as count FROM schools'),
    query(`SELECT COUNT(*) as count FROM sppgs WHERE name NOT IN (${placeholders})`, EXCLUDED_SPPG_NAMES),
    query('SELECT portions FROM daily_distributions WHERE distribution_date = $1', [today]),
    query(
      `SELECT portions FROM daily_distributions 
       WHERE distribution_date >= $1 AND distribution_date <= $2`,
      [new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], today]
    ),
  ]);

  const totalPortionsToday = todayDist.rows.reduce((sum: number, d: any) => sum + (d.portions || 0), 0);
  const totalPortionsWeek = weekDist.rows.reduce((sum: number, d: any) => sum + (d.portions || 0), 0);
  const averageDailyPortions = weekDist.rows.length > 0 ? Math.round(totalPortionsWeek / 7) : totalPortionsToday;

  return {
    totalSchools: parseInt(schoolCount.rows[0].count),
    activeSppgs: parseInt(sppgCount.rows[0].count),
    todayPortions: totalPortionsToday,
    averageDailyPortions,
  };
}
