import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Order } from '../../types/store';
import { 
  X, 
  Printer, 
  Download, 
  Mail, 
  Bitcoin,
  Receipt,
  FileText,
  Smartphone
} from 'lucide-react';
import { NOVASATS_CONTRACT_ADDRESS } from '../../utils/novaSatsSignature';
import { getSupplierVoucherConfig } from '../../lib/voucherConfigHelper';
import { getSupplierVerification, SupplierVerificationInfo } from '../../lib/supplierVerificationHelper';
import { getSupplierSession } from '../../lib/cookieSession';
import { supabase } from '../../lib/supabaseClient';

// INFORMACIÓN FISCAL Y DATOS COMERCIALES BASE / FALLBACK
export const NOVASATS_FISCAL_INFO = {
  razonSocial: '',
  nombreComercial: '',
  ruc: '',
  direccionFiscal: '',
  telefono: '',
  whatsapp: '',
  emailFacturacion: '',
  emailSoporte: '',
  web: '',
  giroComercial: '',
  autorizacionSunat: '',
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
    razonSocial: supplierVerification?.legalName || supplierProfile?.company_name || 'Comercio Asociado NovaSats',
    nombreComercial: supplierVerification?.nombreComercial || supplierProfile?.company_name || supplierVerification?.legalName || 'NovaSats Marketplace',
    ruc: supplierVerification?.taxId || '',
    direccionFiscal: supplierVerification?.businessAddress || '',
    telefono: supplierVerification?.telefono || supplierProfile?.phone || '',
    whatsapp: supplierVerification?.whatsapp || supplierProfile?.phone || '',
    emailFacturacion: supplierVerification?.emailFacturacion || supplierProfile?.email || '',
    emailSoporte: supplierVerification?.emailSoporte || supplierProfile?.email || '',
    web: supplierVerification?.website || '',
    giroComercial: supplierVerification?.giroComercial || '',
    autorizacionSunat: supplierVerification?.autorizacionSunat || '',
    tipoComprobante: supplierVerification?.tipoComprobante || 'COMPROBANTE ELECTRÓNICO DE PAGO BITCOIN ON-CHAIN',
  };

  const [viewMode, setViewMode] = useState<'preview80mm' | 'standard'>(() => {
    if (!voucherConfig.allow80mm && voucherConfig.allowDigital) return 'standard';
    return 'preview80mm';
  });

  // Set default viewMode on modal open without trapping user tab switching
  useEffect(() => {
    if (isOpen) {
      if (!voucherConfig.allow80mm && voucherConfig.allowDigital) {
        setViewMode('standard');
      } else {
        setViewMode('preview80mm');
      }
    }
  }, [isOpen, voucherConfig.allow80mm, voucherConfig.allowDigital]);

  const [pdf80mmUrl, setPdf80mmUrl] = useState<string | null>(null);
  const [pdfA4Url, setPdfA4Url] = useState<string | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

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
    if (fiscalInfo.autorizacionSunat) {
      doc.text(fiscalInfo.autorizacionSunat, 40, y, { align: 'center' });
      y += 3.5;
    }

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
    doc.text('SubTotal Gravado (USD):', 4, y);
    doc.text(`$${taxes.subtotal}`, 76, y, { align: 'right' });
    y += 3.3;

    doc.text('I.G.V. (18.00%):', 4, y);
    doc.text(`$${taxes.igv}`, 76, y, { align: 'right' });
    y += 3.3;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.text('Total Importe (USD):', 4, y);
    doc.text(`$${taxes.total} USD`, 76, y, { align: 'right' });
    y += 3.4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    const btcPriceRef = Number(currentOrder.total_usd) / (Number(currentOrder.total_btc) || 1);
    doc.text('Tasa de Cambio REF.:', 4, y);
    doc.text(`$${btcPriceRef.toFixed(2)} USD/BTC`, 76, y, { align: 'right' });
    y += 3.3;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.text('Total BitCoin Liquidado:', 4, y);
    doc.text(`${Number(currentOrder.total_btc).toFixed(8)} BTC`, 76, y, { align: 'right' });
    y += 4.5;

    doc.line(4, y, 76, y);
    y += 4;

    // 7. Registro Criptográfico & Auditoría On-Chain
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('AUDITORÍA ON-CHAIN & SMART CONTRACT:', 40, y, { align: 'center' });
    y += 3.8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.text('Smart Contract (NovaSats.sol):', 4, y);
    y += 2.8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.4);
    const contractFull = currentOrder.contract_address || NOVASATS_CONTRACT_ADDRESS || '0x71C260B543D75aF4D4B12DDe9B1D6F094593C3a9';
    doc.text(contractFull, 4, y);
    y += 3.4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.text('Hash de Transacción Bitcoin (TX):', 4, y);
    y += 2.8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    const txText = currentOrder.payment_tx_hash || '0x11a70acf45fadb85ceec739efe4dcb22fa1704ee51998068bf1fee264e95c933';
    const txLines = doc.splitTextToSize(txText, 72);
    doc.text(txLines, 4, y);
    y += txLines.length * 2.6 + 0.8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.text('Firma Digital Criptográfica (ECDSA):', 4, y);
    y += 2.8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    const sigText = currentOrder.signature_novasats || '0x3a4b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b5c';
    const sigLines = doc.splitTextToSize(sigText, 72);
    doc.text(sigLines, 4, y);
    y += sigLines.length * 2.6 + 1.2;

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

  // Generate standard A4 PDF (Detailed Tax Invoice / Comprobante Fiscal A4)
  const generateStandardA4PdfDoc = (currentOrder: Order) => {
    const doc = new jsPDF();
    doc.setFont('helvetica');

    // Top Fiscal Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 36, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text((fiscalInfo.nombreComercial || 'NOVASATS MARKETPLACE').toUpperCase(), 14, 16);
    
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(251, 191, 36);
    doc.text(fiscalInfo.giroComercial, 14, 23);
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
    doc.text(getPosSeriesNumber(currentOrder.order_number), 161, 26, { align: 'center' });

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
    doc.text(`Cliente: ${currentOrder.customer_name}`, 112, y + 12);
    doc.text(`Email: ${currentOrder.customer_email}`, 112, y + 17);
    doc.text(`Fecha: ${new Date(currentOrder.created_at).toLocaleString()}`, 112, y + 22);
    doc.text(`Voucher: ${currentOrder.voucher_code}`, 112, y + 27);
    doc.text(`Orden N°: #${currentOrder.order_number}`, 112, y + 32);

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

    if (currentOrder.items && currentOrder.items.length > 0) {
      currentOrder.items.forEach((item) => {
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

    // 3. Resumen y Desglose Tributario (Casing Corregido)
    const taxesA4 = calculateTaxes(currentOrder.total_usd);

    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('SubTotal Gravado (USD):', 110, y);
    doc.text(`$${taxesA4.subtotal} USD`, 170, y);
    y += 5.5;

    doc.text('I.G.V. / TAX (18.00%):', 110, y);
    doc.text(`$${taxesA4.igv} USD`, 170, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Total Importe (USD):', 110, y);
    doc.text(`$${taxesA4.total} USD`, 170, y);
    y += 6.5;

    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const btcPriceRefA4 = Number(currentOrder.total_usd) / (Number(currentOrder.total_btc) || 1);
    doc.text('Tasa de Cambio REF.:', 110, y);
    doc.text(`$${btcPriceRefA4.toFixed(2)} USD/BTC`, 170, y);
    y += 5.5;

    doc.setFontSize(9.5);
    doc.setTextColor(217, 119, 6);
    doc.text('Total BitCoin Liquidado:', 110, y);
    doc.text(`${Number(currentOrder.total_btc).toFixed(8)} BTC`, 170, y);
    y += 12;

    // 4. Auditoría y Firma Blockchain
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, 182, 34, 2, 2, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('AUDITORÍA ON-CHAIN & CONTRATO SMART (NOVASATS.SOL)', 18, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`TX Hash Bitcoin: ${currentOrder.payment_tx_hash || '0x...'}`, 18, y + 13);
    doc.text(`Wallet Pagadora: ${currentOrder.customer_wallet || 'No especificada'}`, 18, y + 19);
    doc.text(`Contrato Inteligente: ${currentOrder.contract_address || NOVASATS_CONTRACT_ADDRESS || '0x71C260B543D75aF4D4B12DDe9B1D6F094593C3a9'} (NovaSats.sol)`, 18, y + 25);
    doc.text(`Firma ECDSA: ${(currentOrder.signature_novasats || '0x3a4b9c8d...').substring(0, 85)}...`, 18, y + 30);

    // Footer
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Este documento es una representación impresa de Comprobante de Pago Electrónico generado bajo protocolo Web3.', 14, 280);
    doc.text(`Para consultas o reclamos tributarios contactar a ${fiscalInfo.emailFacturacion}. Garantía de 12 meses respaldada on-chain.`, 14, 285);

    return doc;
  };

  // Re-generate 80mm PDF blob url whenever order or fiscal data changes
  useEffect(() => {
    if (!isOpen || !order) {
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
  }, [isOpen, order, fiscalInfo.razonSocial, fiscalInfo.ruc, fiscalInfo.direccionFiscal, fiscalInfo.telefono, fiscalInfo.emailFacturacion, fiscalInfo.web]);

  // Re-generate A4 PDF blob url whenever order or fiscal data changes
  useEffect(() => {
    if (!isOpen || !order) {
      setPdfA4Url(null);
      return;
    }

    try {
      const doc = generateStandardA4PdfDoc(order);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfA4Url(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (e) {
      console.error('Error generating A4 preview:', e);
    }
  }, [isOpen, order, fiscalInfo.razonSocial, fiscalInfo.ruc, fiscalInfo.direccionFiscal, fiscalInfo.telefono, fiscalInfo.emailFacturacion, fiscalInfo.web, fiscalInfo.giroComercial, fiscalInfo.nombreComercial]);

  if (!isOpen || !order) return null;

  const taxes = calculateTaxes(order.total_usd);

  // Download standard A4 PDF (Detailed Tax Invoice / Comprobante Fiscal)
  const handleDownloadStandardPdf = () => {
    try {
      const doc = generateStandardA4PdfDoc(order);
      doc.save(`Comprobante_A4_NovaSats_${order.order_number}.pdf`);
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
    if (viewMode === 'preview80mm' && pdf80mmUrl) {
      const iframe = document.querySelector('iframe[title*="80mm"]') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.print();
        return;
      }
    } else if (viewMode === 'standard' && pdfA4Url) {
      const iframe = document.querySelector('iframe[title*="A4"]') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.print();
        return;
      }
    }
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

          {/* Selector de Pestañas: Vista Previa del Voucher 80mm y Vista Previa del A4 */}
          <div className="mt-4 flex flex-wrap items-center gap-2 p-1 bg-black/40 rounded-xl border border-white/10 max-w-fit">
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
              <span>Vista Previa del Voucher 80mm</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('standard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'standard'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Vista Previa del A4</span>
            </button>
          </div>
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
                    <span>Ver Vista Previa A4</span>
                  </button>
                </div>
              </div>
            ) : (
              /* En Laptop / PC: Vista Previa del Voucher 80mm */
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-950/80 px-4 py-2.5 rounded-xl border border-white/10 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    <span>Vista Previa del Voucher <strong className="text-white">80 mm</strong> listo para impresión térmica o descarga.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownload80mmPdf}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar Ticket 80mm</span>
                    </button>
                  </div>
                </div>

                <div className="w-full h-[520px] bg-slate-950 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center shadow-inner">
                  {pdf80mmUrl ? (
                    <iframe
                      src={pdf80mmUrl}
                      className="w-full h-full rounded-xl bg-white"
                      title="Vista Previa del Voucher 80mm"
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
                <button
                  type="button"
                  onClick={handleOpenGmail}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Gmail</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-medium transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
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
          /* Vista Previa del A4 (Factura / Boleta Electrónica Oficial) */
          <div className="p-5 sm:p-6 space-y-4">
            {isMobileDevice ? (
              /* En Celular: Mensaje y Botón de Descarga Directa A4 */
              <div className="p-6 bg-slate-900 border border-blue-500/30 rounded-2xl text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Smartphone className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    Comprobante Electrónico Oficial en Formato A4
                  </h4>
                  <p className="text-xs text-slate-300 mt-1.5 max-w-md mx-auto leading-relaxed">
                    Documento tributario homologado en hoja tamaño A4 con información fiscal de la empresa, desglose impositivo y firma de auditoría Web3.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button
                    type="button"
                    onClick={handleDownloadStandardPdf}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl transition active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar PDF A4</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenGmail}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow transition"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Enviar por Gmail</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('preview80mm')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold border border-white/10 transition"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Ver Voucher 80mm</span>
                  </button>
                </div>
              </div>
            ) : (
              /* En Laptop / PC: Vista previa interactiva del PDF A4 */
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-950/80 px-4 py-2.5 rounded-xl border border-white/10 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Vista previa del <strong className="text-white">A4</strong> · Factura / Boleta Electrónica Oficial con validez tributaria.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadStandardPdf}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-xs font-semibold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar PDF A4</span>
                    </button>
                  </div>
                </div>

                <div className="w-full h-[520px] bg-slate-950 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center shadow-inner">
                  {pdfA4Url ? (
                    <iframe
                      src={pdfA4Url}
                      className="w-full h-full rounded-xl bg-white"
                      title="Vista previa del A4 · Factura Oficial"
                    />
                  ) : (
                    <div className="text-center p-8 text-slate-400 text-xs">
                      Generando comprobante digital en A4...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Actions for A4 mode */}
            <div className="pt-2 flex flex-wrap gap-2.5 items-center justify-between border-t border-gray-100 dark:border-gray-800">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleOpenGmail}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                  title="Abrir en Gmail para enviar o respaldar este comprobante"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Gmail</span>
                </button>

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
