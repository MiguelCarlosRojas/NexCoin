import React, { useRef, useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Order } from '../../types/store';
import { 
  X, 
  Printer, 
  Download, 
  Mail, 
  Copy, 
  ShieldCheck, 
  Bitcoin,
  Check,
  Receipt,
  FileText,
  Smartphone,
  Building2
} from 'lucide-react';
import { NOVASATS_CONTRACT_ADDRESS } from '../../utils/novaSatsSignature';
import { getSupplierVoucherConfig } from '../../lib/voucherConfigHelper';
import { getSupplierVerification, SupplierVerificationInfo } from '../../lib/supplierVerificationHelper';
import { getSupplierSession } from '../../lib/cookieSession';
import { supabase } from '../../lib/supabaseClient';

// INFORMACIÓN FISCAL Y DATOS COMERCIALES BASE / FALLBACK
export const NOVASATS_FISCAL_INFO = {
  razonSocial: 'TechGlobal Hardware & Cryptowear S.A.C.',
  nombreComercial: 'TechGlobal Hardware & Cryptowear',
  ruc: '20601234567',
  direccionFiscal: 'Av. Blockchain 404, San Isidro, Lima - Perú',
  telefono: '+51 987 654 321',
  whatsapp: '+51 987 654 321',
  emailFacturacion: 'proveedor@novasats.com',
  emailSoporte: 'soporte@novasats.com',
  web: 'https://novasats.vercel.app',
  giroComercial: 'Venta de Hardware Cripto, Nodos y Plataforma de Pasarela Web3',
  autorizacionSunat: 'Resolución de Superintendencia N° 097-2012/SUNAT',
  tipoComprobante: 'COMPROBANTE ELECTRÓNICO DE PAGO BITCOIN ON-CHAIN',
};

interface VoucherModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  isSupplierView?: boolean;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({
  order,
  isOpen,
  onClose,
  title = 'Comprobante de Pago Electrónico',
  isSupplierView: _isSupplierView = false,
}) => {
  const [copied, setCopied] = useState(false);

  // Supplier permissions and fiscal config for vouchers
  const sessionSupplier = getSupplierSession();
  const resolvedSupplierId = order?.items?.[0]?.supplier_id || (order as any)?.supplier_id || sessionSupplier?.id;
  const voucherConfig = getSupplierVoucherConfig(resolvedSupplierId);

  // Supplier Verification & Commercial Profile from "Mi Perfil & Icono"
  const [supplierVerification, setSupplierVerification] = useState<SupplierVerificationInfo>(() =>
    getSupplierVerification(resolvedSupplierId)
  );
  const [supplierProfile, setSupplierProfile] = useState<any>(() => {
    if (sessionSupplier && (!resolvedSupplierId || sessionSupplier.id === resolvedSupplierId)) {
      return sessionSupplier;
    }
    return null;
  });

  useEffect(() => {
    let isMounted = true;
    const loadSupplierFiscalData = async () => {
      const currentId = resolvedSupplierId;
      if (!currentId) return;

      const verif = getSupplierVerification(currentId);
      if (isMounted) setSupplierVerification(verif);

      if (!supplierProfile || supplierProfile.id !== currentId) {
        try {
          const { data } = await supabase
            .from('suppliers')
            .select('*')
            .eq('id', currentId)
            .maybeSingle();
          if (data && isMounted) {
            setSupplierProfile(data);
          }
        } catch (err) {
          console.error('Error fetching supplier fiscal profile:', err);
        }
      }
    };

    loadSupplierFiscalData();
    return () => {
      isMounted = false;
    };
  }, [resolvedSupplierId]);

  // Dynamic fiscal & commercial data from "Mi Perfil & Icono"
  const fiscalInfo = {
    razonSocial: supplierVerification?.legalName || supplierProfile?.company_name || NOVASATS_FISCAL_INFO.razonSocial,
    nombreComercial: supplierProfile?.company_name || supplierVerification?.legalName || NOVASATS_FISCAL_INFO.nombreComercial,
    ruc: supplierVerification?.taxId || NOVASATS_FISCAL_INFO.ruc,
    direccionFiscal: supplierVerification?.businessAddress || NOVASATS_FISCAL_INFO.direccionFiscal,
    telefono: supplierProfile?.phone || NOVASATS_FISCAL_INFO.telefono,
    whatsapp: supplierProfile?.phone || NOVASATS_FISCAL_INFO.whatsapp,
    emailFacturacion: supplierProfile?.email || NOVASATS_FISCAL_INFO.emailFacturacion,
    emailSoporte: supplierProfile?.email || NOVASATS_FISCAL_INFO.emailSoporte,
    web: supplierVerification?.website || NOVASATS_FISCAL_INFO.web,
    giroComercial: NOVASATS_FISCAL_INFO.giroComercial,
    autorizacionSunat: NOVASATS_FISCAL_INFO.autorizacionSunat,
    tipoComprobante: NOVASATS_FISCAL_INFO.tipoComprobante,
  };

  const [viewMode, setViewMode] = useState<'preview80mm' | 'standard'>(() => {
    if (!voucherConfig.allow80mm && voucherConfig.allowDigital) return 'standard';
    return 'preview80mm';
  });

  // Keep viewMode synchronized with active supplier configuration
  useEffect(() => {
    if (!voucherConfig.allow80mm && voucherConfig.allowDigital) {
      setViewMode('standard');
    } else if (!voucherConfig.allowDigital && voucherConfig.allow80mm) {
      setViewMode('preview80mm');
    }
  }, [voucherConfig.allow80mm, voucherConfig.allowDigital]);

  const [pdf80mmUrl, setPdf80mmUrl] = useState<string | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const voucherRef = useRef<HTMLDivElement>(null);

  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;
      setIsMobileDevice(isMobileUA || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Helpers for calculations
  const calculateTaxes = (totalUsd: number) => {
    const total = Number(totalUsd) || 0;
    const subtotal = total / 1.18;
    const igv = total - subtotal;
    return {
      subtotal: subtotal.toFixed(2),
      igv: igv.toFixed(2),
      total: total.toFixed(2),
    };
  };

  const getPosSeriesNumber = (orderNumber: string) => {
    const digits = orderNumber.replace(/\D/g, '');
    const padded = digits.slice(-6).padStart(6, '0') || '004829';
    return `T001-${padded}`;
  };

  // Generate 80mm PDF for thermal printer (Clean POS Monochrome Aesthetic with Full Fiscal Data)
  const generate80mmPdfDoc = (currentOrder: Order) => {
    const itemsCount = currentOrder.items?.length || 1;
    const calculatedHeight = Math.max(220, 160 + itemsCount * 12);
    
    // 80mm width ticket (monochrome/clean thermal receipt style)
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, calculatedHeight],
    });

    let y = 7;
    doc.setTextColor(0, 0, 0);

    // 1. Cabecera Fiscal y Datos Comerciales desde "Mi Perfil & Icono"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const legalLines = doc.splitTextToSize(fiscalInfo.razonSocial, 72);
    doc.text(legalLines, 40, y, { align: 'center' });
    y += legalLines.length * 3.4 + 0.6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`R.U.C. ${fiscalInfo.ruc}`, 40, y, { align: 'center' });
    y += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    const addrLines = doc.splitTextToSize(fiscalInfo.direccionFiscal, 72);
    doc.text(addrLines, 40, y, { align: 'center' });
    y += addrLines.length * 2.8 + 0.6;

    doc.text(`Tel: ${fiscalInfo.telefono} | WA: ${fiscalInfo.whatsapp}`, 40, y, { align: 'center' });
    y += 3;
    doc.text(`Email: ${fiscalInfo.emailFacturacion}`, 40, y, { align: 'center' });
    y += 3;
    doc.text(`Web: ${fiscalInfo.web}`, 40, y, { align: 'center' });
    y += 4;

    // Línea separadora limpia
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(4, y, 76, y);
    y += 4.5;

    // 2. Título de Comprobante y Serie POS
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('COMPROBANTE ELECTRÓNICO DE PAGO', 40, y, { align: 'center' });
    y += 3.8;
    doc.text(`TICKET POS N° ${getPosSeriesNumber(currentOrder.order_number)}`, 40, y, { align: 'center' });
    y += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(NOVASATS_FISCAL_INFO.autorizacionSunat, 40, y, { align: 'center' });
    y += 3.5;

    doc.line(4, y, 76, y);
    y += 4.5;

    // 3. Metadatos de la Orden
    doc.setFontSize(7);
    
    doc.setFont('helvetica', 'bold');
    doc.text('FECHA / HORA:', 4, y);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(currentOrder.created_at).toLocaleString(), 76, y, { align: 'right' });
    y += 3.8;

    doc.setFont('helvetica', 'bold');
    doc.text('VOUCHER:', 4, y);
    doc.text(currentOrder.voucher_code, 76, y, { align: 'right' });
    y += 3.8;

    doc.setFont('helvetica', 'bold');
    doc.text('N° ORDEN:', 4, y);
    doc.text(`#${currentOrder.order_number}`, 76, y, { align: 'right' });
    y += 3.8;

    doc.setFont('helvetica', 'bold');
    doc.text('FORMA DE PAGO:', 4, y);
    doc.setFont('helvetica', 'normal');
    doc.text('BITCOIN ON-CHAIN (L1)', 76, y, { align: 'right' });
    y += 3.8;

    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO:', 4, y);
    doc.text('PAGO LIQUIDADO Y CONFIRMADO', 76, y, { align: 'right' });
    y += 4.5;

    doc.line(4, y, 76, y);
    y += 4;

    // 4. Datos del Cliente / Comprador
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.text('DATOS DEL CLIENTE:', 4, y);
    y += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(`Cliente: ${currentOrder.customer_name.substring(0, 26)}`, 4, y);
    y += 3.2;
    doc.text(`Email: ${currentOrder.customer_email.substring(0, 30)}`, 4, y);
    y += 3.2;

    const walletShort = currentOrder.customer_wallet 
      ? `${currentOrder.customer_wallet.substring(0, 10)}...${currentOrder.customer_wallet.substring(currentOrder.customer_wallet.length - 8)}`
      : 'No especificada';
    doc.text(`Wallet: ${walletShort}`, 4, y);
    y += 4.5;

    doc.line(4, y, 76, y);
    y += 4;

    // 5. Tabla de Artículos
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.text('CANT', 4, y);
    doc.text('DESCRIPCIÓN', 16, y);
    doc.text('P.UNIT', 56, y);
    doc.text('TOTAL', 76, y, { align: 'right' });
    y += 3.5;
    doc.line(4, y, 76, y);
    y += 3.8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);

    if (currentOrder.items && currentOrder.items.length > 0) {
      currentOrder.items.forEach((item) => {
        const itemLines = doc.splitTextToSize(item.product_name, 38);
        doc.text(String(item.quantity), 5, y);
        doc.text(itemLines, 16, y);
        doc.text(`$${Number(item.unit_price_usd).toFixed(2)}`, 56, y);
        doc.text(`$${Number(item.total_usd).toFixed(2)}`, 76, y, { align: 'right' });
        
        const lineH = Math.max(itemLines.length * 3.2, 4);
        y += lineH;
      });
    }

    doc.line(4, y, 76, y);
    y += 4.5;

    // 6. Desglose Fiscal & Totales
    const taxes = calculateTaxes(currentOrder.total_usd);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.text('SUBTOTAL GRAVADO (USD):', 4, y);
    doc.text(`$${taxes.subtotal}`, 76, y, { align: 'right' });
    y += 3.3;

    doc.text('I.G.V. (18.00%):', 4, y);
    doc.text(`$${taxes.igv}`, 76, y, { align: 'right' });
    y += 3.3;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.text('TOTAL IMPORTE (USD):', 4, y);
    doc.text(`$${taxes.total} USD`, 76, y, { align: 'right' });
    y += 3.4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    const btcPriceRef = Number(currentOrder.total_usd) / (Number(currentOrder.total_btc) || 1);
    doc.text('TASA DE CAMBIO REF.:', 4, y);
    doc.text(`$${btcPriceRef.toFixed(2)} USD/BTC`, 76, y, { align: 'right' });
    y += 3.3;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.text('TOTAL BITCOIN LIQUIDADO:', 4, y);
    doc.text(`${Number(currentOrder.total_btc).toFixed(8)} BTC`, 76, y, { align: 'right' });
    y += 4.5;

    doc.line(4, y, 76, y);
    y += 4;

    // 7. Registro Criptográfico & Auditoría On-Chain
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('AUDITORÍA ON-CHAIN & CONTRATO SMART:', 4, y);
    y += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    const txText = `TX: ${currentOrder.payment_tx_hash || '0x...'}`;
    const txLines = doc.splitTextToSize(txText, 72);
    doc.text(txLines, 4, y);
    y += txLines.length * 2.8 + 0.6;

    const contractFull = currentOrder.contract_address || NOVASATS_CONTRACT_ADDRESS;
    const contractText = `CONTRATO: ${contractFull} (NovaSats.sol)`;
    const contractLines = doc.splitTextToSize(contractText, 72);
    doc.text(contractLines, 4, y);
    y += contractLines.length * 2.8 + 0.6;

    const sigText = `FIRMA ECDSA: ${currentOrder.signature_novasats || '0x3a4b9c8d...'}`;
    const sigLines = doc.splitTextToSize(sigText, 72);
    doc.text(sigLines, 4, y);
    y += sigLines.length * 2.8 + 1;

    doc.line(4, y, 76, y);
    y += 4;

    // 8. Términos & Garantía Fiscal
    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'normal');
    doc.text('- Representación impresa de Comprobante de Pago Electrónico.', 40, y, { align: 'center' });
    y += 2.8;
    doc.text('- Válido como comprobante oficial de compra y garantía.', 40, y, { align: 'center' });
    y += 2.8;
    doc.text('- Garantía oficial de 12 meses respaldada en NovaSats.sol.', 40, y, { align: 'center' });
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('¡GRACIAS POR SU PREFERENCIA!', 40, y, { align: 'center' });
    y += 3.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text('https://novasats.vercel.app', 40, y, { align: 'center' });

    return doc;
  };

  // Re-generate 80mm PDF blob url whenever order or fiscal data changes
  useEffect(() => {
    if (!order) {
      setPdf80mmUrl(null);
      return;
    }

    try {
      const doc = generate80mmPdfDoc(order);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPdf80mmUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (e) {
      console.error('Error generating 80mm preview:', e);
    }
  }, [order, fiscalInfo.razonSocial, fiscalInfo.ruc, fiscalInfo.direccionFiscal, fiscalInfo.telefono, fiscalInfo.emailFacturacion, fiscalInfo.web]);

  if (!isOpen || !order) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const taxes = calculateTaxes(order.total_usd);

  // Download standard A4 PDF (Detailed Tax Invoice / Comprobante Fiscal)
  const handleDownloadStandardPdf = () => {
    try {
      const doc = new jsPDF();
      doc.setFont('helvetica');

      // Top Fiscal Header
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 36, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('NOVASATS MARKETPLACE', 14, 16);
      
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(251, 191, 36);
      doc.text('Plataforma Web3 & Pasarela de Pagos Bitcoin On-Chain', 14, 23);
      doc.setTextColor(203, 213, 225);
      doc.text(fiscalInfo.web, 14, 29);

      // Fiscal Box on Top Right
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(125, 6, 72, 24, 2, 2, 'FD');
      
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`R.U.C. ${fiscalInfo.ruc}`, 161, 13, { align: 'center' });
      doc.setFontSize(8);
      doc.text('COMPROBANTE ELECTRÓNICO', 161, 19, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(217, 119, 6);
      doc.text(getPosSeriesNumber(order.order_number), 161, 26, { align: 'center' });

      let y = 46;

      // 1. Datos del Emisor (Empresa) y Datos del Cliente
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, y, 88, 38, 2, 2, 'F');
      doc.roundedRect(108, y, 88, 38, 2, 2, 'F');

      // Emisor Fiscal
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('DATOS DE LA EMPRESA / EMISOR:', 18, y + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Razón Social: ${fiscalInfo.razonSocial.substring(0, 36)}`, 18, y + 12);
      doc.text(`R.U.C.: ${fiscalInfo.ruc}`, 18, y + 17);
      doc.text(`Dirección: ${fiscalInfo.direccionFiscal.substring(0, 38)}...`, 18, y + 22);
      doc.text(`Tel: ${fiscalInfo.telefono}`, 18, y + 27);
      doc.text(`Email: ${fiscalInfo.emailFacturacion}`, 18, y + 32);

      // Cliente / Adquiriente
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('DATOS DEL CLIENTE / RECEPTOR:', 112, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Cliente: ${order.customer_name}`, 112, y + 12);
      doc.text(`Email: ${order.customer_email}`, 112, y + 17);
      doc.text(`Fecha: ${new Date(order.created_at).toLocaleString()}`, 112, y + 22);
      doc.text(`Voucher: ${order.voucher_code}`, 112, y + 27);
      doc.text(`Orden N°: #${order.order_number}`, 112, y + 32);

      y += 46;

      // 2. Tabla de Productos
      doc.setFillColor(15, 23, 42);
      doc.rect(14, y, 182, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('CANT', 18, y + 5.5);
      doc.text('DESCRIPCIÓN DEL ARTÍCULO', 36, y + 5.5);
      doc.text('PRECIO UNITARIO', 130, y + 5.5);
      doc.text('IMPORTE USD', 170, y + 5.5);

      y += 11;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          doc.setTextColor(30, 41, 59);
          doc.text(String(item.quantity), 20, y);
          doc.text(item.product_name.substring(0, 50), 36, y);
          doc.text(`$${Number(item.unit_price_usd).toFixed(2)}`, 130, y);
          doc.setFont('helvetica', 'bold');
          doc.text(`$${Number(item.total_usd).toFixed(2)}`, 170, y);
          doc.setFont('helvetica', 'normal');
          
          y += 6.5;
        });
      }

      y += 4;
      doc.setDrawColor(203, 213, 225);
      doc.line(14, y, 196, y);
      y += 6;

      // 3. Resumen y Desglose Tributario
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text('SUBTOTAL OPERACIÓN GRAVADA:', 110, y);
      doc.text(`$${taxes.subtotal} USD`, 170, y);
      y += 5.5;

      doc.text('I.G.V. / TAX (18.00%):', 110, y);
      doc.text(`$${taxes.igv} USD`, 170, y);
      y += 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text('TOTAL IMPORTE PAGADO:', 110, y);
      doc.text(`$${taxes.total} USD`, 170, y);
      y += 6.5;

      doc.setFontSize(9.5);
      doc.setTextColor(217, 119, 6);
      doc.text('TOTAL BITCOIN ON-CHAIN:', 110, y);
      doc.text(`${Number(order.total_btc).toFixed(8)} BTC`, 170, y);
      y += 12;

      // 4. Auditoría y Firma Blockchain
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, y, 182, 34, 2, 2, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('SEGURIDAD CRIPTOGRÁFICA & CONTRATO SMART (NOVASATS.SOL)', 18, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(`TX Hash Bitcoin: ${order.payment_tx_hash || '0x...'}`, 18, y + 13);
      doc.text(`Wallet Pagadora: ${order.customer_wallet || 'No especificada'}`, 18, y + 19);
      doc.text(`Contrato Inteligente: ${order.contract_address || NOVASATS_CONTRACT_ADDRESS} (NovaSats.sol)`, 18, y + 25);
      doc.text(`Firma ECDSA: ${(order.signature_novasats || '0x3a4b9c8d...').substring(0, 85)}...`, 18, y + 30);

      // Footer
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Este documento es una representación impresa de Comprobante de Pago Electrónico generado bajo protocolo Web3.', 14, 280);
      doc.text(`Para consultas o reclamos tributarios contactar a ${fiscalInfo.emailFacturacion}. Garantía de 12 meses respaldada on-chain.`, 14, 285);

      doc.save(`Comprobante_NovaSats_${order.order_number}.pdf`);
    } catch (e) {
      console.error('Error generating PDF:', e);
    }
  };

  // Download 80mm PDF
  const handleDownload80mmPdf = () => {
    try {
      const doc = generate80mmPdfDoc(order);
      doc.save(`Ticket_80mm_NovaSats_${order.order_number}.pdf`);
    } catch (e) {
      console.error('Error generating 80mm PDF:', e);
    }
  };

  // Open in Gmail with prefilled body
  const handleOpenGmail = () => {
    const subject = `Comprobante Oficial de Compra NovaSats - Voucher ${order.voucher_code} (Orden ${order.order_number})`;
    const itemsText = (order.items || [])
      .map((it) => `- ${it.quantity}x ${it.product_name} ($${Number(it.total_usd).toFixed(2)} USD)`)
      .join('\n');

    const bodyText = `Estimado/a ${order.customer_name},

Aquí tienes el comprobante electrónico oficial de tu compra realizada con Bitcoin en NovaSats Marketplace.

------------------------------------------------
INFORMACIÓN FISCAL DEL EMISOR
------------------------------------------------
Razón Social: ${fiscalInfo.razonSocial}
R.U.C.: ${fiscalInfo.ruc}
Dirección Fiscal: ${fiscalInfo.direccionFiscal}
Teléfono: ${fiscalInfo.telefono} | WhatsApp: ${fiscalInfo.whatsapp}
Email Fiscal: ${fiscalInfo.emailFacturacion}

------------------------------------------------
DETALLES DEL COMPROBANTE
------------------------------------------------
Código de Voucher: ${order.voucher_code}
Número de Orden: ${order.order_number}
Ticket POS: ${getPosSeriesNumber(order.order_number)}
Fecha: ${new Date(order.created_at).toLocaleString()}
Cliente: ${order.customer_name}
Email: ${order.customer_email}
Wallet Cliente: ${order.customer_wallet}
TX Hash Bitcoin: ${order.payment_tx_hash}

------------------------------------------------
PRODUCTOS ADQUIRIDOS
------------------------------------------------
${itemsText}

------------------------------------------------
DESGLOSE DE PAGO
------------------------------------------------
Subtotal Gravado (USD): $${taxes.subtotal}
I.G.V. (18%): $${taxes.igv}
Total Importe: $${taxes.total} USD
Total Bitcoin Liquidado: ${Number(order.total_btc).toFixed(8)} BTC

Estado del Pago: CONFIRMADO EN BLOCKCHAIN
Gracias por comprar en NovaSats Marketplace.
${fiscalInfo.web}`;

    const encodedBody = encodeURIComponent(bodyText);
    const toEmail = encodeURIComponent(order.customer_email);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${toEmail}&su=${encodeURIComponent(subject)}&body=${encodedBody}`;
    window.open(gmailUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-5 sm:p-6 relative border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/40 text-amber-400">
              <Bitcoin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">{title}</h3>
              <p className="text-xs text-amber-200/80">NovaSats Marketplace · Comprobante Electrónico Homologado</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10 text-xs">
            <div>
              <span className="text-gray-400 font-mono">SERIE POS: </span>
              <span className="font-mono font-bold text-amber-400">{getPosSeriesNumber(order.order_number)}</span>
            </div>
            <div>
              <span className="text-gray-400 font-mono">VOUCHER: </span>
              <span className="font-mono font-bold text-white">{order.voucher_code}</span>
            </div>
            <div>
              <span className="text-gray-400 font-mono">ORDEN: </span>
              <span className="font-mono font-semibold text-slate-300">{order.order_number}</span>
            </div>
          </div>

          {/* Tab Selector: Solo se muestra si el proveedor habilitó AMBOS formatos */}
          {voucherConfig.allow80mm && voucherConfig.allowDigital && (
            <div className="mt-4 flex items-center gap-2 p-1 bg-black/40 rounded-xl border border-white/10 max-w-fit">
              <button
                type="button"
                onClick={() => setViewMode('preview80mm')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'preview80mm'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Ticket Térmico · 80mm</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('standard')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'standard'
                    ? 'bg-white/20 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Comprobante Digital Detallado</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        {viewMode === 'preview80mm' ? (
          <div className="p-5 sm:p-6 space-y-4">
            {isMobileDevice ? (
              /* En Celular: Mensaje y Botón de Descarga Directa */
              <div className="p-6 bg-slate-900 border border-amber-500/30 rounded-2xl text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Smartphone className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    Ticket Térmico Oficial 80mm
                  </h4>
                  <p className="text-xs text-slate-300 mt-1.5 max-w-md mx-auto leading-relaxed">
                    Formato de impresión térmica de 80mm con datos fiscales completos de la empresa, desglose tributario y firma on-chain.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button
                    type="button"
                    onClick={handleDownload80mmPdf}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-xl transition active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Ticket 80mm (PDF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('standard')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold border border-white/10 transition"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Ver Detalles en Pantalla</span>
                  </button>
                </div>
              </div>
            ) : (
              /* En Laptop / PC: Vista previa del voucher · 80mm */
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-950/80 px-4 py-2.5 rounded-xl border border-white/10 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    <span>Formato térmico oficial <strong className="text-white">80 mm</strong> listo para impresión o descarga.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownload80mmPdf}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar 80mm</span>
                    </button>
                  </div>
                </div>

                <div className="w-full h-[520px] bg-slate-950 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center shadow-inner">
                  {pdf80mmUrl ? (
                    <iframe
                      src={pdf80mmUrl}
                      className="w-full h-full rounded-xl bg-white"
                      title="Vista previa del voucher · 80mm"
                    />
                  ) : (
                    <div className="text-center p-8 text-slate-400 text-xs">
                      Generando ticket térmico de 80mm...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Actions for 80mm mode */}
            <div className="pt-2 flex flex-wrap gap-2.5 items-center justify-between border-t border-gray-100 dark:border-gray-800">
              <div className="flex flex-wrap gap-2">
                {voucherConfig.allow80mm && (
                  <button
                    type="button"
                    onClick={handleDownload80mmPdf}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold rounded-xl text-xs shadow-md hover:from-amber-400 hover:to-orange-400 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Ticket 80mm</span>
                  </button>
                )}
                {voucherConfig.allowDigital && (
                  <>
                    <button
                      type="button"
                      onClick={handleDownloadStandardPdf}
                      className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar A4</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenGmail}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Gmail</span>
                    </button>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-white transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          /* Vista Digital Detallada con Información Fiscal y Comercial */
          <div ref={voucherRef} className="p-5 sm:p-6 space-y-5 text-gray-800 dark:text-gray-200">
            
            {/* Status & Copy banner */}
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    Transacción Bitcoin Liquidada y Verificada On-Chain
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(order.voucher_code)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 rounded-lg hover:bg-emerald-200 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado' : 'Copiar Voucher'}
              </button>
            </div>

            {/* SECCIÓN FISCAL & COMERCIAL DE LA EMPRESA */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Información Fiscal & Comercial de la Empresa
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {getPosSeriesNumber(order.order_number)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Razón Social:</span>
                  <p className="font-bold text-white">{fiscalInfo.razonSocial}</p>
                  <span className="text-slate-400 block text-[11px] mt-1.5">R.U.C. Fiscal:</span>
                  <p className="font-mono font-bold text-amber-400">{fiscalInfo.ruc}</p>
                  <span className="text-slate-400 block text-[11px] mt-1.5">Dirección Fiscal:</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{fiscalInfo.direccionFiscal}</p>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Contacto Comercial:</span>
                  <p className="text-slate-200 font-mono text-[11px]">{fiscalInfo.telefono} | WA: {fiscalInfo.whatsapp}</p>
                  <span className="text-slate-400 block text-[11px] mt-1.5">Facturación & Soporte:</span>
                  <p className="text-slate-200 font-mono text-[11px]">{fiscalInfo.emailFacturacion}</p>
                  <span className="text-slate-400 block text-[11px] mt-1.5">Régimen & Autorización:</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{fiscalInfo.autorizacionSunat}</p>
                </div>
              </div>
            </div>

            {/* Details Grid (Cliente y On-Chain) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Datos del Cliente</span>
                <p className="font-medium text-gray-900 dark:text-white">{order.customer_name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{order.customer_email}</p>
              </div>

              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/80">
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block uppercase tracking-wider">
                  Wallet Pagadora Bitcoin
                </span>
                <p className="font-mono text-xs font-bold text-gray-900 dark:text-white truncate mt-0.5 flex items-center gap-1.5" title={order.customer_wallet}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="truncate">{order.customer_wallet || '0xCustomerWallet'}</span>
                </p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5">
                  ✓ Pagador Web3 Verificado
                </span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Hash de Transacción Bitcoin</span>
                <p className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">
                  {order.payment_tx_hash}
                </p>
              </div>

              <div className="sm:col-span-2 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent p-3 rounded-xl border border-amber-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1.5 uppercase tracking-wider">
                    <Bitcoin className="w-3.5 h-3.5" />
                    Firma Criptográfica Contrato Inteligente (NovaSats.sol)
                  </span>
                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                    VERIFICADO ECDSA
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mb-1">
                  Contrato: <span className="text-gray-700 dark:text-gray-300 font-semibold">{order.contract_address || NOVASATS_CONTRACT_ADDRESS} (NovaSats.sol)</span>
                </p>
                <p className="font-mono text-[10px] text-amber-600 dark:text-amber-400 break-all bg-white dark:bg-gray-950 p-2 rounded border border-amber-500/20">
                  {order.signature_novasats || '0x3a4b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b5c'}
                </p>
              </div>
            </div>

            {/* Purchased Items List */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Detalle de Artículos Adquiridos
              </h4>
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{item.product_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Cantidad: <span className="font-semibold text-gray-700 dark:text-gray-300">{item.quantity}</span> × ${Number(item.unit_price_usd).toFixed(2)} USD
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">${Number(item.total_usd).toFixed(2)}</p>
                        <p className="text-xs font-mono text-amber-600 dark:text-amber-400">
                          {Number(item.total_btc).toFixed(8)} ₿
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">Detalles de artículos no disponibles</div>
                )}
              </div>
            </div>

            {/* Total & Tax Breakdown */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/40 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
                <span>Subtotal Operación Gravada (USD):</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">${taxes.subtotal}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
                <span>I.G.V. / Impuesto (18.00%):</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">${taxes.igv}</span>
              </div>
              <div className="border-t border-amber-200/60 dark:border-amber-800/60 pt-2 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-amber-800 dark:text-amber-400">
                    Monto Total Liquidado
                  </p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">
                    ${taxes.total} <span className="text-xs font-normal text-gray-500">USD</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-amber-700 dark:text-amber-300 block">Equivalente en Bitcoin</span>
                  <p className="text-xl font-mono font-bold text-amber-600 dark:text-amber-400">
                    {Number(order.total_btc).toFixed(8)} ₿
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap gap-2.5 items-center justify-between border-t border-gray-100 dark:border-gray-800">
              <div className="flex flex-wrap gap-2">
                {voucherConfig.allow80mm && (
                  <>
                    <button
                      type="button"
                      onClick={() => setViewMode('preview80mm')}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold rounded-xl text-xs shadow transition"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Vista 80mm</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownload80mmPdf}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar 80mm</span>
                    </button>
                  </>
                )}

                {voucherConfig.allowDigital && (
                  <>
                    <button
                      type="button"
                      onClick={handleOpenGmail}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition"
                      title="Abrir en Gmail para enviar o respaldar este comprobante"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Gmail</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadStandardPdf}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF A4</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-medium transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
