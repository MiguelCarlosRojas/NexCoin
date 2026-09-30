import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  supplierName?: string;
  stats?: { label: string; value: string }[];
  headers: string[];
  rows: (string | number)[][];
  fileName: string;
  columnStyles?: Record<number, {
    halign?: 'left' | 'center' | 'right';
    cellWidth?: number | 'auto';
    fontStyle?: 'normal' | 'bold' | 'italic';
    textColor?: [number, number, number] | number[] | string;
    fillColor?: [number, number, number] | number[] | string;
    [key: string]: any;
  }>;
  footers?: (string | number)[][];
}

/**
 * Generate a professional, horizontally oriented (Landscape A4) PDF report
 * with tabular data using jspdf-autotable and official NexCoin styling.
 */
export function exportLandscapePdfTable(options: PdfReportOptions) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4', // 297mm width x 210mm height
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // Top Dark Banner
  doc.setFillColor(10, 15, 29);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Amber accent line
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 27, pageWidth, 1.2, 'F');

  // Brand Name
  doc.setTextColor(245, 158, 11);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('NexCoin', 14, 12);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('|  Portal de Proveedores Web3 & Pagos Bitcoin', 38, 12);

  // Report Title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(241, 245, 249);
  doc.text(options.title, 14, 21);

  // Metadata on right side
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  const nowStr = new Date().toLocaleString();
  doc.text(`Proveedor: ${options.supplierName || 'Proveedor Verificado'}`, pageWidth - 14, 11, { align: 'right' });
  doc.text(`Fecha de Emisión: ${nowStr}`, pageWidth - 14, 17, { align: 'right' });
  doc.text('Smart Contract: NexCoin.sol v2.0 (On-Chain)', pageWidth - 14, 23, { align: 'right' });

  let startY = 34;

  // Optional summary KPI cards
  if (options.stats && options.stats.length > 0) {
    const cardWidth = Math.min(52, (pageWidth - 28 - (options.stats.length - 1) * 4) / options.stats.length);
    options.stats.forEach((st, idx) => {
      const x = 14 + idx * (cardWidth + 4);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, startY, cardWidth, 12, 1.5, 1.5, 'FD');

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(st.label.toUpperCase(), x + 3, startY + 4.5);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(st.value, x + 3, startY + 9.5);
    });
    startY += 16;
  }

  // Render Table using autoTable
  autoTable(doc, {
    startY: startY,
    head: [options.headers],
    body: options.rows,
    foot: options.footers,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      font: 'helvetica',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [245, 158, 11],
      fontStyle: 'bold',
      halign: 'left',
      fontSize: 8,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: (options.columnStyles as any) || {},
    margin: { left: 14, right: 14, bottom: 16 },
    didDrawPage: (data) => {
      const pageNumber = data.pageNumber;
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'NexCoin Marketplace - Reporte Oficial generado horizontalmente (Landscape A4)',
        14,
        pageHeight - 6
      );
      doc.text(
        `Página ${pageNumber}`,
        pageWidth - 14,
        pageHeight - 6,
        { align: 'right' }
      );
    },
  });

  doc.save(options.fileName.endsWith('.pdf') ? options.fileName : `${options.fileName}.pdf`);
}
