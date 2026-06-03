import db from '../db/pool';

export async function listBahanBaku(filters: {
  q?: string;
  kecamatan?: string;
  category_id?: string;
  availability?: string;
}) {
  const availFilter = filters.availability && filters.availability !== 'all'
    ? [filters.availability]
    : ['available', 'limited'];

  const { rows } = await db.query(
    `SELECT sp.id, sp.price_per_unit, sp.stock, sp.availability_status, sp.notes,
            sp.created_at, sp.updated_at,
            s.id as supplier_id, s.name as supplier_name, s.district as supplier_district,
            s.village as supplier_village, s.phone as supplier_phone, s.email as supplier_email,
            s.address as supplier_address, s.logo_url as supplier_logo, s.status as supplier_status,
            c.id as commodity_id, c.name as commodity_name, c.unit as commodity_unit,
            c.description as commodity_description, c.photo_url as commodity_photo_url,
            c.status as commodity_status,
            cc.id as category_id, cc.name as category_name
     FROM supplier_products sp
     INNER JOIN suppliers s ON s.id = sp.supplier_id AND s.status = 'active'
     INNER JOIN commodities c ON c.id = sp.commodity_id AND c.status = 'active'
     LEFT JOIN commodity_categories cc ON cc.id = c.category_id
     WHERE sp.availability_status = ANY($1)
     ORDER BY sp.updated_at DESC`,
    [availFilter]
  );

  let transformed = rows.map((r: any) => ({
    id: r.id,
    no: r.id,
    nama_kwt: r.supplier_name || 'N/A',
    supplier_id: r.supplier_id,
    kecamatan: r.supplier_district || 'N/A',
    village: r.supplier_village,
    komoditas: r.commodity_name || 'N/A',
    commodity_id: r.commodity_id,
    kategori: r.category_name || 'Lainnya',
    produksi: parseFloat(r.stock) || 0,
    satuan: r.commodity_unit || 'Kg',
    harga_per_kg: r.price_per_unit || 0,
    minimum_order: 1,
    availability_status: r.availability_status,
    photo_url: r.commodity_photo_url,
    supplier_phone: r.supplier_phone,
    supplier_email: r.supplier_email,
    supplier_address: r.supplier_address,
    supplier_logo: r.supplier_logo,
    description: r.commodity_description || r.notes,
    created_at: r.created_at,
  }));

  if (filters.q) {
    const searchLower = filters.q.toLowerCase();
    transformed = transformed.filter((item: any) =>
      item.nama_kwt.toLowerCase().includes(searchLower) ||
      item.komoditas.toLowerCase().includes(searchLower) ||
      item.kecamatan.toLowerCase().includes(searchLower)
    );
  }
  if (filters.kecamatan) {
    transformed = transformed.filter((item: any) => item.kecamatan === filters.kecamatan);
  }
  if (filters.category_id) {
    transformed = transformed.filter((item: any) => item.commodity_id === filters.category_id);
  }

  return { title: 'Ketersediaan Bahan Baku dari Pemasok', data: transformed };
}

export async function getBahanBakuById(id: string) {
  const { rows } = await db.query(
    `SELECT sp.id, sp.price_per_unit, sp.stock, sp.availability_status, sp.notes, sp.updated_at,
            s.id as supplier_id, s.name as supplier_name, s.district as supplier_district,
            s.village as supplier_village, s.address as supplier_address,
            s.phone as supplier_phone, s.email as supplier_email, s.logo_url as supplier_logo,
            c.id as commodity_id, c.name as commodity_name, c.unit as commodity_unit,
            c.description as commodity_description, c.photo_url as commodity_photo_url,
            cc.id as category_id, cc.name as category_name
     FROM supplier_products sp
     LEFT JOIN suppliers s ON s.id = sp.supplier_id
     LEFT JOIN commodities c ON c.id = sp.commodity_id
     LEFT JOIN commodity_categories cc ON cc.id = c.category_id
     WHERE sp.id = $1`,
    [id]
  );

  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    data: {
      id: r.id,
      no: r.id,
      nama_kwt: r.supplier_name || 'Unknown',
      supplier_id: r.supplier_id,
      kecamatan: r.supplier_district || 'Unknown',
      village: r.supplier_village,
      komoditas: r.commodity_name || 'Unknown',
      commodity_id: r.commodity_id,
      kategori: r.category_name || 'Lainnya',
      produksi: parseFloat(r.stock) || 0,
      satuan: r.commodity_unit || 'Kg',
      harga_per_kg: r.price_per_unit || 0,
      minimum_order: 1,
      availability_status: r.availability_status,
      photo_url: r.commodity_photo_url,
      supplier_phone: r.supplier_phone,
      supplier_email: r.supplier_email,
      supplier_address: r.supplier_address,
      supplier_logo: r.supplier_logo,
      description: r.notes || r.commodity_description,
      created_at: r.updated_at,
    },
  };
}
