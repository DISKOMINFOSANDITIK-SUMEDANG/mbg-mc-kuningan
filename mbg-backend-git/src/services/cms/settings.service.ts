import { query } from '../../db/pool';

export interface BeneficiaryTargets {
  total_realized: number;
  total_target: number;
  pesantren_realized: number;
  pesantren_total: number;
  santri_realized: number;
  santri_target: number;
  sekolah_realized: number;
  sekolah_total: number;
  siswa_realized: number;
  siswa_target: number;
  ibu_balita_realized: number;
  ibu_balita_target: number;
  bumil_realized: number;
  bumil_target: number;
  busui_realized: number;
  busui_target: number;
  balita_realized: number;
  balita_target: number;
}

const DEFAULT_BENEFICIARY_TARGETS: BeneficiaryTargets = {
  total_realized: 289361,
  total_target: 355906,
  pesantren_realized: 14,
  pesantren_total: 309,
  santri_realized: 681,
  santri_target: 10337,
  sekolah_realized: 1732,
  sekolah_total: 2707,
  siswa_realized: 228266,
  siswa_target: 275543,
  ibu_balita_realized: 49892,
  ibu_balita_target: 86878,
  bumil_realized: 2751,
  bumil_target: 8935,
  busui_realized: 7525,
  busui_target: 8728,
  balita_realized: 39616,
  balita_target: 62700,
};

async function ensureSettingsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key VARCHAR(255) PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

export async function getBeneficiaryTargets(): Promise<BeneficiaryTargets> {
  await ensureSettingsTable();
  const result = await query(
    `SELECT value FROM site_settings WHERE key = 'beneficiary_targets'`
  );
  if (result.rows.length === 0) {
    return DEFAULT_BENEFICIARY_TARGETS;
  }
  return result.rows[0].value as BeneficiaryTargets;
}

export async function updateBeneficiaryTargets(data: BeneficiaryTargets): Promise<BeneficiaryTargets> {
  await ensureSettingsTable();
  await query(
    `INSERT INTO site_settings (key, value, updated_at)
     VALUES ('beneficiary_targets', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
    [JSON.stringify(data)]
  );
  return data;
}
