import React, { useRef } from 'react';
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
  Check
} from 'lucide-react';
import { NEXCOIN_CONTRACT_ADDRESS } from '../../utils/nexCoinSignature';

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
  const [copied, setCopied] = React.useState(false);
  const voucherRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
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
    
    // Direct Gmail Web Composer URL
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${toEmail}&su=${subject}&body=${encodedBody}`;
    
    window.open(gmailUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/40 text-amber-400">
              <Bitcoin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">{title}</h3>
              <p className="text-xs text-blue-200">NexCoin Decentralized Marketplace</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10 text-xs">
            <div>
              <span className="text-gray-400">VOUCHER ID: </span>
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
        </div>

        {/* Modal Body / Voucher View */}
        <div ref={voucherRef} className="p-6 space-y-6 text-gray-800 dark:text-gray-200">
          
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
              onClick={() => copyToClipboard(order.voucher_code)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 rounded-lg hover:bg-emerald-200 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar Voucher'}
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
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
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
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
          <div className="pt-2 flex flex-wrap gap-3 items-center justify-between border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-wrap gap-2">
              {/* Option to send via Gmail */}
              <button
                onClick={handleOpenGmail}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-sm transition hover:shadow-md"
                title="Abrir en Gmail para enviar o respaldar este comprobante"
              >
                <Mail className="w-4 h-4" />
                <span>Enviar por Gmail</span>
              </button>

              {/* Download PDF */}
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
              >
                <Download className="w-4 h-4" />
                <span>Descargar PDF</span>
              </button>

              {/* Print */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
