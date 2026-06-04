import ExcelJS from 'exceljs';

interface TransactionItem {
  commodity_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
}

interface ExportTransaction {
  transaction_number: string;
  transaction_date: string;
  sppg_name: string;
  sppg_address: string;
  supplier_name?: string;
  offtaker_name?: string;
  total_amount: number;
  payment_status: string;
  payment_method?: string;
  notes?: string;
  items: TransactionItem[];
  created_at: string;
}

interface ExportOptions {
  dateFrom?: string;
  dateTo?: string;
  paymentStatus?: string;
}

/**
 * Generate Excel file for sales report based on MBG format
 * Mimics the format from the reference PDF (NOTA PESANAN BAHAN MAKANAN)
 */
export async function generateSalesReportExcel(
  transactions: ExportTransaction[],
  options?: ExportOptions
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Laporan Penjualan');

  // Set column widths
  worksheet.columns = [
    { key: 'no', width: 5 },
    { key: 'item', width: 30 },
    { key: 'quantity', width: 15 },
    { key: 'unit', width: 10 },
    { key: 'price', width: 15 },
    { key: 'unit_label', width: 10 },
    { key: 'total', width: 20 },
  ];

  let currentRow = 1;

  // Add header for each transaction
  transactions.forEach((transaction, index) => {
    if (index > 0) {
      currentRow += 3; // Add spacing between transactions
    }

    // Logo and Header Section
    const headerRow1 = worksheet.getRow(currentRow);
    worksheet.mergeCells(currentRow, 1, currentRow, 3);
    const logoCell = worksheet.getCell(currentRow, 1);
    logoCell.value = 'BADAN GIZI NASIONAL';
    logoCell.font = { size: 16, bold: true };
    logoCell.alignment = { vertical: 'middle', horizontal: 'left' };
    currentRow++;

    // SPPG Info
    const sppgRow1 = worksheet.getRow(currentRow);
    worksheet.mergeCells(currentRow, 1, currentRow, 7);
    const sppgCell1 = worksheet.getCell(currentRow, 1);
    sppgCell1.value = transaction.sppg_name;
    sppgCell1.font = { size: 12, bold: true };
    sppgCell1.alignment = { vertical: 'middle', horizontal: 'center' };
    currentRow++;

    const sppgRow2 = worksheet.getRow(currentRow);
    worksheet.mergeCells(currentRow, 1, currentRow, 7);
    const sppgCell2 = worksheet.getCell(currentRow, 1);
    sppgCell2.value = transaction.sppg_address;
    sppgCell2.font = { size: 10 };
    sppgCell2.alignment = { vertical: 'middle', horizontal: 'center' };
    currentRow++;

    const sppgRow3 = worksheet.getRow(currentRow);
    worksheet.mergeCells(currentRow, 1, currentRow, 7);
    const sppgCell3 = worksheet.getCell(currentRow, 1);
    sppgCell3.value = 'Kecamatan Kuningan Selatan Kabupaten Kuningan';
    sppgCell3.font = { size: 10 };
    sppgCell3.alignment = { vertical: 'middle', horizontal: 'center' };
    currentRow++;

    currentRow++; // Empty row

    // Title
    const titleRow = worksheet.getRow(currentRow);
    worksheet.mergeCells(currentRow, 1, currentRow, 7);
    const titleCell = worksheet.getCell(currentRow, 1);
    titleCell.value = 'NOTA PESANAN BAHAN MAKANAN';
    titleCell.font = { size: 14, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    currentRow++;

    // Transaction Number
    const transNumRow = worksheet.getRow(currentRow);
    worksheet.mergeCells(currentRow, 1, currentRow, 7);
    const transNumCell = worksheet.getCell(currentRow, 1);
    transNumCell.value = `NO. ${transaction.transaction_number}`;
    transNumCell.font = { size: 12, bold: true };
    transNumCell.alignment = { vertical: 'middle', horizontal: 'center' };
    currentRow++;

    currentRow++; // Empty row

    // Transaction Details
    const detailsStartRow = currentRow;
    
    // Dari (From)
    worksheet.getCell(currentRow, 1).value = 'Dari';
    worksheet.getCell(currentRow, 2).value = ':';
    worksheet.mergeCells(currentRow, 3, currentRow, 7);
    worksheet.getCell(currentRow, 3).value = transaction.sppg_name;
    currentRow++;

    // Kepada (To)
    worksheet.getCell(currentRow, 1).value = 'Kepada';
    worksheet.getCell(currentRow, 2).value = ':';
    worksheet.mergeCells(currentRow, 3, currentRow, 7);
    worksheet.getCell(currentRow, 3).value = transaction.supplier_name || transaction.offtaker_name || '-';
    currentRow++;

    // Alamat (Address)
    worksheet.getCell(currentRow, 1).value = 'Alamat';
    worksheet.getCell(currentRow, 2).value = ':';
    worksheet.mergeCells(currentRow, 3, currentRow, 7);
    worksheet.getCell(currentRow, 3).value = 'Kuningan';
    currentRow++;

    // Tanggal Pesan (Order Date)
    worksheet.getCell(currentRow, 1).value = 'Tanggal Pesan';
    worksheet.getCell(currentRow, 2).value = ':';
    worksheet.mergeCells(currentRow, 3, currentRow, 7);
    worksheet.getCell(currentRow, 3).value = formatDate(transaction.transaction_date);
    currentRow++;

    // Tanggal dikirim (Delivery Date)
    worksheet.getCell(currentRow, 1).value = 'Tanggal dikirim';
    worksheet.getCell(currentRow, 2).value = ':';
    worksheet.mergeCells(currentRow, 3, currentRow, 7);
    worksheet.getCell(currentRow, 3).value = formatDate(transaction.transaction_date);
    currentRow++;

    currentRow++; // Empty row

    // Table Header
    const tableHeaderRow = worksheet.getRow(currentRow);
    tableHeaderRow.height = 25;
    
    const headers = [
      { col: 1, value: 'No' },
      { col: 2, value: 'Uraian Jenis Bahan makanan' },
      { col: 3, value: 'Banyaknya (Angka)' },
      { col: 4, value: 'Satuan' },
      { col: 5, value: 'Harga' },
      { col: 6, value: 'Satuan' },
      { col: 7, value: 'Jumlah' },
    ];

    headers.forEach(({ col, value }) => {
      const cell = worksheet.getCell(currentRow, col);
      cell.value = value;
      cell.font = { bold: true, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    });

    currentRow++;

    // Table Data
    let itemNumber = 1;
    transaction.items.forEach((item) => {
      const dataRow = worksheet.getRow(currentRow);
      
      // No
      const noCell = worksheet.getCell(currentRow, 1);
      noCell.value = itemNumber;
      noCell.alignment = { vertical: 'middle', horizontal: 'center' };
      noCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      // Item name
      const itemCell = worksheet.getCell(currentRow, 2);
      itemCell.value = item.commodity_name;
      itemCell.alignment = { vertical: 'middle', horizontal: 'left' };
      itemCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      // Quantity
      const qtyCell = worksheet.getCell(currentRow, 3);
      qtyCell.value = item.quantity;
      qtyCell.alignment = { vertical: 'middle', horizontal: 'right' };
      qtyCell.numFmt = '#,##0.00';
      qtyCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      // Unit
      const unitCell = worksheet.getCell(currentRow, 4);
      unitCell.value = item.unit;
      unitCell.alignment = { vertical: 'middle', horizontal: 'center' };
      unitCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      // Price
      const priceCell = worksheet.getCell(currentRow, 5);
      priceCell.value = item.unit_price;
      priceCell.alignment = { vertical: 'middle', horizontal: 'right' };
      priceCell.numFmt = '#,##0';
      priceCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      // Unit label
      const unitLabelCell = worksheet.getCell(currentRow, 6);
      unitLabelCell.value = item.unit;
      unitLabelCell.alignment = { vertical: 'middle', horizontal: 'center' };
      unitLabelCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      // Subtotal
      const subtotalCell = worksheet.getCell(currentRow, 7);
      subtotalCell.value = item.subtotal;
      subtotalCell.alignment = { vertical: 'middle', horizontal: 'right' };
      subtotalCell.numFmt = '#,##0';
      subtotalCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      currentRow++;
      itemNumber++;
    });

    // Total Row
    worksheet.mergeCells(currentRow, 1, currentRow, 6);
    const totalLabelCell = worksheet.getCell(currentRow, 1);
    totalLabelCell.value = 'TOTAL';
    totalLabelCell.font = { bold: true, size: 12 };
    totalLabelCell.alignment = { vertical: 'middle', horizontal: 'center' };
    totalLabelCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    totalLabelCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const totalValueCell = worksheet.getCell(currentRow, 7);
    totalValueCell.value = transaction.total_amount;
    totalValueCell.font = { bold: true, size: 12 };
    totalValueCell.alignment = { vertical: 'middle', horizontal: 'right' };
    totalValueCell.numFmt = '#,##0';
    totalValueCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    totalValueCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    currentRow += 2; // Empty rows

    // Signature Section
    const signatureRow1 = currentRow;
    
    // Date
    worksheet.mergeCells(currentRow, 5, currentRow, 7);
    const dateCell = worksheet.getCell(currentRow, 5);
    dateCell.value = `Kuningan, ${formatDate(new Date().toISOString())}`;
    dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
    currentRow++;

    currentRow++; // Empty row

    // Signature titles
    worksheet.mergeCells(currentRow, 1, currentRow, 3);
    const sig1TitleCell = worksheet.getCell(currentRow, 1);
    sig1TitleCell.value = 'Kepala Satuan Pelayanan';
    sig1TitleCell.font = { bold: true };
    sig1TitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells(currentRow, 5, currentRow, 7);
    const sig2TitleCell = worksheet.getCell(currentRow, 5);
    sig2TitleCell.value = 'Mitra';
    sig2TitleCell.font = { bold: true };
    sig2TitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    currentRow++;

    // Subtitle
    worksheet.mergeCells(currentRow, 1, currentRow, 3);
    const sig1SubtitleCell = worksheet.getCell(currentRow, 1);
    sig1SubtitleCell.value = 'Pemenuhan Gizi';
    sig1SubtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells(currentRow, 5, currentRow, 7);
    const sig2SubtitleCell = worksheet.getCell(currentRow, 5);
    sig2SubtitleCell.value = `Dapur ${transaction.sppg_name}`;
    sig2SubtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    currentRow++;

    // SPPG name
    worksheet.mergeCells(currentRow, 1, currentRow, 3);
    const sig1SppgCell = worksheet.getCell(currentRow, 1);
    sig1SppgCell.value = transaction.sppg_name;
    sig1SppgCell.alignment = { vertical: 'middle', horizontal: 'center' };
    currentRow++;

    currentRow += 4; // Space for signatures

    // Names
    worksheet.mergeCells(currentRow, 1, currentRow, 3);
    const name1Cell = worksheet.getCell(currentRow, 1);
    name1Cell.value = 'Indah Nur Octavia, S.Pn';
    name1Cell.font = { bold: true };
    name1Cell.alignment = { vertical: 'middle', horizontal: 'center' };
    name1Cell.border = {
      bottom: { style: 'thin' },
    };

    worksheet.mergeCells(currentRow, 5, currentRow, 7);
    const name2Cell = worksheet.getCell(currentRow, 5);
    name2Cell.value = 'Mulyadi Hidayat';
    name2Cell.font = { bold: true };
    name2Cell.alignment = { vertical: 'middle', horizontal: 'center' };
    name2Cell.border = {
      bottom: { style: 'thin' },
    };

    currentRow++;
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Format date to Indonesian format (DD Month YYYY)
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
}
