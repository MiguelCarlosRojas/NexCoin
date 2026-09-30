import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useWallet } from '../../context/WalletContext';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { supabase } from '../../lib/supabaseClient';
import { VoucherModal } from './VoucherModal';
import { Order } from '../../types/store';
import { signPurchaseWithNexCoin, NEXCOIN_CONTRACT_ADDRESS } from '../../utils/nexCoinSignature';
import confetti from 'canvas-confetti';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Bitcoin,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Wallet
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, totalUsd, totalBtc, itemCount, isCartOpen, setIsCartOpen } = useCart();
  const { walletAddress, sendBtcPayment } = useWallet();
  const { open } = useAppKit();
  const { address: appKitAddress } = useAppKitAccount();

  const effectiveWallet = appKitAddress || walletAddress;

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [showVoucher, setShowVoucher] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isCartOpen) return null;

  const handleStartCheckout = () => {
    setErrorMessage('');
    setIsCheckingOut(true);
  };

  const handleProcessOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim() || !customerEmail.trim()) {
      setErrorMessage('Por favor ingresa tu nombre y correo electrónico para el comprobante.');
      return;
    }

    if (!effectiveWallet) {
      setErrorMessage('Por favor conecta tu billetera real con WalletConnect antes de autorizar la compra.');
      return;
    }

    const payerWalletAddress = effectiveWallet;
    const recipientWallet = cart[0]?.product?.suppliers?.wallet_address || '';

    setProcessingPayment(true);

    try {
      // 1. Send Bitcoin/EVM payment verification
      const payResult = await sendBtcPayment(totalBtc, recipientWallet);
      if (!payResult.success) {
        throw new Error(payResult.error || 'Error al procesar la transferencia');
      }

      const txHash = payResult.txHash || `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      const voucherCode = `VOUCH-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Date.now().toString().slice(-4)}`;

      // 2. Firma criptográfica con el contrato inteligente NexCoin.sol
      const signResult = await signPurchaseWithNexCoin(
        payerWalletAddress,
        orderNumber,
        voucherCode,
        totalBtc,
        totalUsd
      );

      // 3. Insert order into Supabase with NexCoin.sol signature and verified payer wallet
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            order_number: orderNumber,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_wallet: payerWalletAddress,
            payment_tx_hash: txHash,
            payment_currency: 'BTC',
            total_usd: totalUsd,
            total_btc: totalBtc,
            status: 'completed',
            voucher_code: voucherCode,
            signature_nexcoin: signResult.signature,
            contract_address: NEXCOIN_CONTRACT_ADDRESS,
          },
        ])
        .select()
        .single();

      if (orderError) {
        throw new Error(`Error registrando la orden: ${orderError.message}`);
      }

      // 3. Insert order items
      const orderItems = cart.map((item) => ({
        order_id: orderData.id,
        product_id: item.product.id,
        supplier_id: item.product.supplier_id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price_usd: item.product.price_usd,
        unit_price_btc: item.product.price_btc,
        total_usd: Number(item.product.price_usd) * item.quantity,
        total_btc: Number(item.product.price_btc) * item.quantity,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) {
        console.warn('Warning inserting order items:', itemsError);
      }

      // 4. Update product stocks in Supabase
      for (const item of cart) {
        const remainingStock = Math.max(0, item.product.stock - item.quantity);
        await supabase
          .from('products')
          .update({ stock: remainingStock, updated_at: new Date().toISOString() })
          .eq('id', item.product.id);
      }

      // 5. Celebration
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      // 6. Setup completed order for voucher
      const fullOrder: Order = {
        ...orderData,
        items: orderItems,
      };

      setCompletedOrder(fullOrder);
      clearCart();
      setIsCheckingOut(false);
      setIsCartOpen(false);
      setShowVoucher(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error durante el procesamiento del pago.');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <div
          onClick={() => setIsCartOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-800">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Carrito de Compras ({itemCount})
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckingOut(false);
                }}
                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="m-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Content: Cart Items or Checkout Form */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">Tu carrito está vacío</h3>
                  <p className="text-xs text-gray-500 max-w-xs">
                    Explora los productos de los proveedores en la tienda y agrégalos a tu carrito.
                  </p>
                </div>
              ) : isCheckingOut ? (
                /* Checkout Form */
                <form onSubmit={handleProcessOrder} className="space-y-4">
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-amber-800 dark:text-amber-400 font-medium block">Total a Pagar</span>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">${totalUsd.toFixed(2)} USD</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-amber-600 dark:text-amber-400 block font-medium">Equivalente BTC</span>
                      <p className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400">
                        {totalBtc.toFixed(8)} ₿
                      </p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Datos para el Voucher
                    </label>
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Nombre completo del cliente"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        required
                        placeholder="Correo Gmail / Email del cliente"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white"
                      />
                      <p className="text-[11px] text-gray-500 mt-1">
                        Se utilizará para generar y enviar el voucher a tu cuenta de Gmail.
                      </p>
                    </div>
                  </div>

                  {/* Wallet Connection via Reown AppKit / WalletConnect */}
                  <div className="space-y-2.5 pt-2 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Billetera Web3 / WalletConnect
                      </label>
                      <span className="text-[10px] font-mono text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        Reown AppKit
                      </span>
                    </div>

                    <div className="flex justify-center w-full py-1">
                      <button
                        type="button"
                        onClick={() => open()}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Wallet className="w-4 h-4" />
                        <span>{effectiveWallet ? `Conectado: ${effectiveWallet.slice(0, 6)}...${effectiveWallet.slice(-4)}` : 'Conectar con WalletConnect'}</span>
                      </button>
                    </div>

                    {effectiveWallet && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div className="truncate">
                            <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">Wallet Pagadora Autorizada</p>
                            <p className="text-xs font-mono text-emerald-700 dark:text-emerald-400 truncate">{effectiveWallet}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded shrink-0">
                          ON-CHAIN
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Payment summary note */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <p className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-white">
                      <Bitcoin className="w-4 h-4 text-amber-500" />
                      Pago Seguro en Red Bitcoin
                    </p>
                    <p>
                      Al confirmar, se descontará el stock automáticamente en Supabase y se generará tu voucher con link a Gmail y descarga en PDF.
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCheckingOut(false)}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={processingPayment}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-500/25 transition disabled:opacity-50"
                    >
                      {processingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Confirmando en Blockchain...</span>
                        </>
                      ) : (
                        <>
                          <Bitcoin className="w-4 h-4" />
                          <span>Pagar {totalBtc.toFixed(8)} BTC</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Item List */
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800"
                  >
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-mono font-medium">
                        ${Number(item.product.price_usd).toFixed(2)} USD / {Number(item.product.price_btc).toFixed(8)} ₿
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-semibold text-gray-800 dark:text-gray-200">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-30 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition"
                          title="Eliminar del carrito"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer with totals and action */}
            {cart.length > 0 && !isCheckingOut && (
              <div className="p-5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>${totalUsd.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between items-baseline font-bold text-gray-900 dark:text-white">
                    <span className="text-base">Total</span>
                    <div className="text-right">
                      <span className="text-lg">${totalUsd.toFixed(2)} USD</span>
                      <p className="text-xs font-mono font-medium text-amber-500">
                        {totalBtc.toFixed(8)} BTC
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={clearCart}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
                    title="Vaciar carrito"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleStartCheckout}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition"
                  >
                    <span>Comprar con Bitcoin</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Voucher Modal on successful purchase */}
      <VoucherModal
        order={completedOrder}
        isOpen={showVoucher}
        onClose={() => setShowVoucher(false)}
        title="¡Compra Completada con Éxito!"
      />
    </>
  );
};
