import db from '../../db/pool';
import ExcelJS from 'exceljs';
import { Response } from 'express';

interface ExportQuery {
  date_from?: string;
  date_to?: string;
  supplier_id?: string;
  offtaker_id?: string;
  sppg_id?: string;
  type?: 'supplier' | 'offtaker' | 'all';
}

export async function exportSalesExcel(query: ExportQuery, res: Response) {
  const { date_from, date_to, supplier_id, offtaker_id, sppg_id, type = 'all' } = query;

  // Build supplier sales query
  let supplierSales: any[] = [];
  if (type === 'all' || type === 'supplier') {
    let stWhere = 'WHERE 1=1';
    const stParams: any[] = [];
    let stIdx = 1;
    if (date_from) { stWhere += ` AND st.transaction_date >= $${stIdx++}`; stParams.push(date_from); }
    if (date_to) { stWhere += ` AND st.transaction_date <= $${stIdx++}`; stParams.push(date_to); }
    if (supplier_id) { stWhere += ` AND st.supplier_id = $${stIdx++}`; stParams.push(supplier_id); }

    const { rows: stRows } = await db.query(
      `SELECT st.id, st.sale_number, st.transaction_date, st.total_amount, st.notes, st.status,
              s.name as supplier_name, s.address as supplier_address, s.phone as supplier_phone,
              'supplier' as source
       FROM sales_transactions st
       LEFT JOIN suppliers s ON s.id = st.supplier_id
       ${stWhere}
       ORDER BY st.transaction_date DESC`,
      stParams
    );
    supplierSales = stRows;

    // Enrich with items
    for (const sale of supplierSales) {
      const { rows: items } = await db.query(
        `SELECT sti.*, c.name as commodity_name, c.unit as commodity_unit
         FROM sales_transaction_items sti
         LEFT JOIN supplier_products sp ON sp.id = sti.supplier_product_id
         LEFT JOIN commodities c ON c.id = sp.commodity_id
         WHERE sti.sales_transaction_id = $1`,
        [sale.id]
      );
      sale.items = items;
    }
  }

  // Build offtaker sales query
  let offtakerSales: any[] = [];
  if (type === 'all' || type === 'offtaker') {
    let osWhere = 'WHERE 1=1';
    const osParams: any[] = [];
    let osIdx = 1;
    if (date_from) { osWhere += ` AND os.sale_date >= $${osIdx++}`; osParams.push(date_from); }
    if (date_to) { osWhere += ` AND os.sale_date <= $${osIdx++}`; osParams.push(date_to); }
    if (offtaker_id) { osWhere += ` AND os.offtaker_id = $${osIdx++}`; osParams.push(offtaker_id); }
    if (sppg_id) { osWhere += ` AND os.sppg_id = $${osIdx++}`; osParams.push(sppg_id); }

    const { rows: osRows } = await db.query(
      `SELECT os.id, os.sale_number, os.sale_date as transaction_date, os.total_amount, os.notes, os.status,
              o.name as offtaker_name, o.phone as offtaker_phone,
              sppg.name as sppg_name,
              'offtaker' as source
       FROM offtaker_sales os
       LEFT JOIN offtakers o ON o.id = os.offtaker_id
       LEFT JOIN sppgs sppg ON sppg.id = os.sppg_id
       ${osWhere}
       ORDER BY os.sale_date DESC`,
      osParams
    );
    offtakerSales = osRows;

    for (const sale of offtakerSales) {
      const { rows: items } = await db.query(
        `SELECT osi.*, c.name as commodity_name, c.unit as commodity_unit
         FROM offtaker_sale_items osi
         LEFT JOIN offtaker_products op ON op.id = osi.offtaker_product_id
         LEFT JOIN supplier_products sp ON sp.id = op.supplier_product_id
         LEFT JOIN commodities c ON c.id = sp.commodity_id
         WHERE osi.offtaker_sale_id = $1`,
        [sale.id]
      );
      sale.items = items;
    }
  }

  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MBG System';
  workbook.created = new Date();

  if (supplierSales.length > 0) {
    const sheet = workbook.addWorksheet('Transaksi Pemasok');
    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'No. Transaksi', key: 'sale_number', width: 20 },
      { header: 'Tanggal', key: 'transaction_date', width: 15 },
      { header: 'Pemasok', key: 'supplier_name', width: 25 },
      { header: 'Komoditas', key: 'commodity_name', width: 20 },
      { header: 'Jumlah', key: 'quantity', width: 10 },
      { header: 'Satuan', key: 'unit', width: 10 },
      { header: 'Harga Satuan', key: 'price_per_unit', width: 15 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Catatan', key: 'notes', width: 25 },
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    let rowNum = 1;
    for (const sale of supplierSales) {
      if (sale.items && sale.items.length > 0) {
        for (const item of sale.items) {
          sheet.addRow({
            no: rowNum++, sale_number: sale.sale_number,
            transaction_date: sale.transaction_date ? new Date(sale.transaction_date).toLocaleDateString('id-ID') : '',
            supplier_name: sale.supplier_name,
            commodity_name: item.commodity_name || '-', quantity: item.quantity,
            unit: item.commodity_unit || item.unit || '-',
            price_per_unit: item.price_per_unit, total: item.subtotal || (item.quantity * item.price_per_unit),
            status: sale.status || '-', notes: sale.notes || ''
          });
        }
      } else {
        sheet.addRow({
          no: rowNum++, sale_number: sale.sale_number,
          transaction_date: sale.transaction_date ? new Date(sale.transaction_date).toLocaleDateString('id-ID') : '',
          supplier_name: sale.supplier_name, commodity_name: '-', quantity: 0, unit: '-',
          price_per_unit: 0, total: sale.total_amount, status: sale.status || '-', notes: sale.notes || ''
        });
      }
    }
  }

  if (offtakerSales.length > 0) {
    const sheet = workbook.addWorksheet('Transaksi Offtaker');
    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'No. Transaksi', key: 'sale_number', width: 20 },
      { header: 'Tanggal', key: 'transaction_date', width: 15 },
      { header: 'Offtaker', key: 'offtaker_name', width: 25 },
      { header: 'SPPG', key: 'sppg_name', width: 25 },
      { header: 'Komoditas', key: 'commodity_name', width: 20 },
      { header: 'Jumlah', key: 'quantity', width: 10 },
      { header: 'Satuan', key: 'unit', width: 10 },
      { header: 'Harga', key: 'price', width: 15 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    let rowNum = 1;
    for (const sale of offtakerSales) {
      if (sale.items && sale.items.length > 0) {
        for (const item of sale.items) {
          sheet.addRow({
            no: rowNum++, sale_number: sale.sale_number,
            transaction_date: sale.transaction_date ? new Date(sale.transaction_date).toLocaleDateString('id-ID') : '',
            offtaker_name: sale.offtaker_name, sppg_name: sale.sppg_name || '-',
            commodity_name: item.commodity_name || '-', quantity: item.quantity,
            unit: item.commodity_unit || '-', price: item.price_per_unit || item.unit_price,
            total: item.subtotal || 0, status: sale.status || '-'
          });
        }
      } else {
        sheet.addRow({
          no: rowNum++, sale_number: sale.sale_number,
          transaction_date: sale.transaction_date ? new Date(sale.transaction_date).toLocaleDateString('id-ID') : '',
          offtaker_name: sale.offtaker_name, sppg_name: sale.sppg_name || '-',
          commodity_name: '-', quantity: 0, unit: '-', price: 0, total: sale.total_amount, status: sale.status || '-'
        });
      }
    }
  }

  // Write to response
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=laporan_penjualan_${new Date().toISOString().split('T')[0]}.xlsx`);

  await workbook.xlsx.write(res);
}
