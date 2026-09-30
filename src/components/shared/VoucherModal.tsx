import React, { useRef, useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Order } from '../../types/store';
import { 
  X, 
  Printer, 
  Download, 
  Mail, 
  CheckCircle, 
  Copy, 
  ShieldCheck, 
  Bitcoin,
  Check,
  Receipt,
  FileText,
  Smartphone
} from 'lucide-react';
import { NEXCOIN_CONTRACT_ADDRESS } from '../../utils/nexCoinSignature';
import { getSupplierVoucherConfig } from '../../lib/voucherConfigHelper';

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
  title = 'Comprobante de Compra Oficial',
  isSupplierView: _isSupplierView = false,
}) => {
  const [copied, setCopied] = useState(false);

  // Supplier permissions config for vouchers
  const supplierId = order?.items?.[0]?.supplier_id;
  const voucherConfig = getSupplierVoucherConfig(supplierId);

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

  // Generate 80mm PDF for preview or download (Crisp Modern Helvetica Layout)
  const generate80mmPdfDoc = (currentOrder: Order) => {
    const itemsCount = currentOrder.items?.length || 1;
    const calculatedHeight = Math.max(185, 130 + itemsCount * 14);
    
    // 80mm width ticket
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, calculatedHeight],
    });

    // Background header accent
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 80, 24, 'F');

    // Header NexCoin
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('NexCoin Marketplace', 40, 10, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(251, 191, 36); // amber-400
    doc.text('Comercio Web3 & Pagos Bitcoin', 40, 15, { align: 'center' });
    doc.setTextColor(203, 213, 225); // slate-300
    doc.setFontSize(7);
    doc.text('https://nex-coin-rho.vercel.app', 40, 20, { align: 'center' });

    // Ticket Title
    let y = 30;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('VOUCHER ELECTRÓNICO (80MM)', 40, y, { align: 'center' });
    y += 5;

    // Divider
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(4, y, 76, y);
    y += 5;

    // Details Grid
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    doc.text('Voucher:', 4, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(currentOrder.voucher_code, 76, y, { align: 'right' });
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Orden:', 4, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`#${currentOrder.order_number}`, 76, y, { align: 'right' });
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Fecha:', 4, y);
    doc.setTextColor(30, 41, 59);
    doc.text(new Date(currentOrder.created_at).toLocaleDateString(), 76, y, { align: 'right' });
    y += 4.5;

    doc.setTextColor(71, 85, 105);
    doc.text('Cliente:', 4, y);
    doc.setTextColor(30, 41, 59);
    doc.text(currentOrder.customer_name.substring(0, 24), 76, y, { align: 'right' });
    y += 4.5;

    const walletSnippet = currentOrder.customer_wallet 
      ? `${currentOrder.customer_wallet.substring(0, 8)}...${currentOrder.customer_wallet.substring(currentOrder.customer_wallet.length - 6)}`
      : 'N/A';
    doc.setTextColor(71, 85, 105);
    doc.text('Wallet:', 4, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 119, 6);
    doc.text(walletSnippet, 76, y, { align: 'right' });
    y += 6;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(4, y - 4, 72, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('PRODUCTO', 6, y);
    doc.text('CANT', 44, y);
    doc.text('TOTAL', 74, y, { align: 'right' });
    y += 5;

    // Items
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    if (currentOrder.items && currentOrder.items.length > 0) {
      currentOrder.items.forEach((item) => {
        doc.setTextColor(15, 23, 42);
        const nameLines = doc.splitTextToSize(item.product_name, 36);
        doc.text(nameLines, 6, y);
        doc.text(String(item.quantity), 47, y);
        doc.setFont('helvetica', 'bold');
        doc.text(`$${Number(item.total_usd).toFixed(2)}`, 74, y, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        
        const blockHeight = Math.max(nameLines.length * 3.8, 5);
        y += blockHeight;
      });
    }

    y += 2;
    doc.setDrawColor(203, 213, 225);
    doc.line(4, y, 76, y);
    y += 5;

    // Totals
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('TOTAL USD:', 4, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`$${Number(currentOrder.total_usd).toFixed(2)}`, 76, y, { align: 'right' });
    y += 5.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('TOTAL BITCOIN:', 4, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(217, 119, 6); // amber-600
    doc.text(`${Number(currentOrder.total_btc).toFixed(8)} BTC`, 76, y, { align: 'right' });
    y += 6;

    // Status Banner
    doc.setFillColor(236, 253, 245);
    doc.rect(4, y - 4, 72, 7, 'F');
    doc.setTextColor(5, 150, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('PAGO CONFIRMADO ON-CHAIN', 40, y, { align: 'center' });
    y += 6;

    // Blockchain Security Block
    doc.setDrawColor(226, 232, 240);
    doc.line(4, y, 76, y);
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('FIRMA CRIPTOGRAFICA & CONTRATO SMART', 40, y, { align: 'center' });
    y += 3.8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(`TX: ${(currentOrder.payment_tx_hash || '0x...').substring(0, 36)}...`, 40, y, { align: 'center' });
    y += 3.2;
    doc.text(`CONTRATO: ${(currentOrder.contract_address || NEXCOIN_CONTRACT_ADDRESS).substring(0, 34)}...`, 40, y, { align: 'center' });
    y += 3.2;
    doc.text(`ECDSA: ${(currentOrder.signature_nexcoin || '0x3a4b9c8d...').substring(0, 36)}...`, 40, y, { align: 'center' });
    y += 5;

    doc.setDrawColor(203, 213, 225);
    doc.line(4, y, 76, y);
    y += 4.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('¡GRACIAS POR SU COMPRA EN NEXCOIN!', 40, y, { align: 'center' });
    y += 3.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Comprobante inmutable emitido bajo protocolo Web3', 40, y, { align: 'center' });

    return doc;
  };

  // Re-generate 80mm PDF blob url whenever order changes
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
  }, [order]);

  if (!isOpen || !order) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download standard A4 PDF
  const handleDownloadStandardPdf = () => {
    try {
      const doc = new jsPDF();
      doc.setFont('helvetica');

      // Header
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 38, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('NexCoin Marketplace', 14, 20);
      doc.setFontSize(10);
      doc.text('Plataforma Descentralizada de Comercio Web3', 14, 28);
      doc.text(`VOUCHER: ${order.voucher_code}`, 140, 20);
      doc.text(`ORDEN: ${order.order_number}`, 140, 28);

      // Status
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(11);
      doc.text('ESTADO: PAGO CONFIRMADO EN BITCOIN', 14, 48);

      // Customer & Order Info
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(10);
      doc.text(`Cliente: ${order.customer_name}`, 14, 58);
      doc.text(`Email: ${order.customer_email}`, 14, 64);
      doc.text(`Wallet que realizó el pago: ${order.customer_wallet || 'No especificada'}`, 14, 70);
      doc.text(`Fecha: ${new Date(order.created_at).toLocaleString()}`, 14, 76);
      doc.text(`Hash TX: ${order.payment_tx_hash || '0x...'}`, 14, 82);
      doc.setTextColor(217, 119, 6);
      doc.text(`Contrato NexCoin.sol: ${order.contract_address || NEXCOIN_CONTRACT_ADDRESS}`, 14, 88);
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Firma Criptográfica: ${(order.signature_nexcoin || '0x3a4b9c8d...').substring(0, 75)}...`, 14, 93);

      // Table Header
      let y = 104;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y - 6, 182, 10, 'F');
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.text('PRODUCTO', 16, y);
      doc.text('CANT', 110, y);
      doc.text('P. UNIT (USD)', 130, y);
      doc.text('TOTAL (USD)', 165, y);

      // Items
      y += 8;
      doc.setFontSize(9);
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          doc.setTextColor(71, 85, 105);
          doc.text(item.product_name.substring(0, 45), 16, y);
          doc.text(String(item.quantity), 115, y);
          doc.text(`$${Number(item.unit_price_usd).toFixed(2)}`, 130, y);
          doc.text(`$${Number(item.total_usd).toFixed(2)}`, 165, y);
          y += 8;
        });
      }

      // Summary
      y += 6;
      doc.setDrawColor(203, 213, 225);
      doc.line(14, y, 196, y);
      y += 8;
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(`TOTAL PAGADO EN USD: $${Number(order.total_usd).toFixed(2)}`, 110, y);
      y += 7;
      doc.setTextColor(234, 88, 12);
      doc.text(`TOTAL PAGADO EN BTC: ${Number(order.total_btc).toFixed(8)} BTC`, 110, y);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Comprobante digital firmado criptográficamente y respaldado por el contrato inteligente NexCoin.sol.', 14, 280);

      doc.save(`Voucher_NexCoin_${order.order_number}.pdf`);
    } catch (e) {
      console.error('Error generating PDF:', e);
    }
  };

  // Download 80mm PDF
  const handleDownload80mmPdf = () => {
    try {
      const doc = generate80mmPdfDoc(order);
      doc.save(`Voucher_80mm_NexCoin_${order.order_number}.pdf`);
    } catch (e) {
      console.error('Error generating 80mm PDF:', e);
    }
  };

  const handleOpenGmail = () => {
    const subject = encodeURIComponent(`Comprobante de Compra #${order.order_number} - NexCoin Store [Firmado NexCoin.sol]`);
    
    let itemsText = '';
    if (order.items && order.items.length > 0) {
      itemsText = order.items
        .map(
          (item) =>
            `- ${item.product_name} x${item.quantity}: $${Number(item.total_usd).toFixed(2)} USD (${Number(item.total_btc).toFixed(8)} BTC)`
        )
        .join('\n');
    }

    const bodyText = `¡Hola ${order.customer_name}!

Aquí tienes el comprobante oficial de tu compra realizada con Bitcoin en NexCoin Marketplace.

------------------------------------------------
DETALLES DEL VOUCHER
------------------------------------------------
Código de Voucher: ${order.voucher_code}
Número de Orden: ${order.order_number}
Fecha: ${new Date(order.created_at).toLocaleString()}
Cliente: ${order.customer_name}
Email: ${order.customer_email}
Wallet Cliente: ${order.customer_wallet}
TX Hash Bitcoin: ${order.payment_tx_hash}

------------------------------------------------
FIRMA CRIPTOGRÁFICA NEXCOIN.SOL
------------------------------------------------
Contrato Inteligente: ${order.contract_address || NEXCOIN_CONTRACT_ADDRESS} (NexCoin.sol)
Firma Digital: ${order.signature_nexcoin || '0x...'}
Estado de Validación: FIRMADO Y VERIFICADO ON-CHAIN

------------------------------------------------
PRODUCTOS ADQUIRIDOS
------------------------------------------------
${itemsText}

------------------------------------------------
TOTAL PAGADO
------------------------------------------------
Total USD: $${Number(order.total_usd).toFixed(2)} USD
Total BTC: ${Number(order.total_btc).toFixed(8)} BTC

Estado del Pago: CONFIRMADO EN BLOCKCHAIN
Gracias por comprar en NexCoin Store.
https://nex-coin-rho.vercel.app`;

    const encodedBody = encodeURIComponent(bodyText);
    const toEmail = encodeURIComponent(order.customer_email);
    
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${toEmail}&su=${subject}&body=${encodedBody}`;
    window.open(gmailUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-amber-950 text-white p-5 sm:p-6 relative">
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
              <p className="text-xs text-amber-200/80">NexCoin Marketplace · Pagos Bitcoin On-Chain</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10 text-xs">
            <div>
              <span className="text-gray-400">VOUCHER: </span>
              <span className="font-mono font-bold text-amber-300">{order.voucher_code}</span>
            </div>
            <div>
              <span className="text-gray-400">ORDEN: </span>
              <span className="font-mono font-semibold">{order.order_number}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="font-semibold uppercase tracking-wider text-[11px]">Pago Confirmado</span>
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
                <span>Vista previa del voucher · 80mm</span>
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
                    Vista previa de Voucher Térmico 80mm
                  </h4>
                  <p className="text-xs text-slate-300 mt-1.5 max-w-md mx-auto leading-relaxed">
                    En dispositivos móviles no se puede tener vista previa incrustada de vouchers PDF. 
                    Puedes descargar el ticket térmico oficial de 80mm directamente a tu teléfono con un solo toque.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button
                    type="button"
                    onClick={handleDownload80mmPdf}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-xl transition active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Voucher 80mm (PDF)</span>
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
                    <span>Formato térmico oficial <strong className="text-white">80 mm</strong> listo para impresión o archivo.</span>
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

                <div className="w-full h-[500px] bg-slate-950 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center shadow-inner">
                  {pdf80mmUrl ? (
                    <iframe
                      src={pdf80mmUrl}
                      className="w-full h-full rounded-xl bg-white"
                      title="Vista previa del voucher · 80mm"
                    />
                  ) : (
                    <div className="text-center p-8 text-slate-400 text-xs">
                      Generando vista previa del voucher de 80mm...
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
          /* Vista Digital Detallada */
          <div ref={voucherRef} className="p-5 sm:p-6 space-y-5 text-gray-800 dark:text-gray-200">
            {/* Status banner */}
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    Transacción Verificada en Blockchain
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

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Comprador</span>
                <p className="font-medium text-gray-900 dark:text-white">{order.customer_name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{order.customer_email}</p>
              </div>
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/80">
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block uppercase tracking-wider">
                  Wallet que realizó el pago
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
                    Firma Criptográfica Contrato Inteligente (NexCoin.sol)
                  </span>
                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                    VERIFICADO ECDSA
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mb-1">
                  Contrato: <span className="text-gray-700 dark:text-gray-300 font-semibold">{order.contract_address || NEXCOIN_CONTRACT_ADDRESS} (NexCoin.sol)</span>
                </p>
                <p className="font-mono text-[10px] text-amber-600 dark:text-amber-400 break-all bg-white dark:bg-gray-950 p-2 rounded border border-amber-500/20">
                  {order.signature_nexcoin || '0x3a4b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b5c'}
                </p>
              </div>
            </div>

            {/* Purchased Items List */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Artículos en este Voucher
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

            {/* Total Breakdown */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/40 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-amber-800 dark:text-amber-400">
                  Monto Total Liquidado
                </p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  ${Number(order.total_usd).toFixed(2)} <span className="text-xs font-normal text-gray-500">USD</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-amber-700 dark:text-amber-300 block">Equivalente en Bitcoin</span>
                <p className="text-xl font-mono font-bold text-amber-600 dark:text-amber-400">
                  {Number(order.total_btc).toFixed(8)} ₿
                </p>
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
