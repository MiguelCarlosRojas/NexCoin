import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Product } from '../../types/store';
import { getProductById, fetchAllStoreProducts, BTC_PRICE_USD } from '../../data/productsData';
import { useCart } from '../../context/CartContext';
import { Blobatar } from '../ui/blobatar';
import { parseBlobatar } from '../../lib/blobatarHelper';
import { CartDrawer } from '../shared/CartDrawer';
import {
  Bitcoin,
  ShoppingBag,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Store,
  Truck,
  Zap,
  Tag,
  Star,
  Check,
  Share2,
  Copy,
  Mail,
  Plus,
  Minus,
  MessageCircle,
  Send,
  HelpCircle,
  Sparkles,
  Receipt
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart, itemCount, setIsCartOpen } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Purchase quantity
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Q&A state
  const [userQuestion, setUserQuestion] = useState('');
  const [questionsList, setQuestionsList] = useState([
    {
      q: '¿El producto viene con el sello y precinto criptográfico de fábrica intacto?',
      a: 'Sí, todos los dispositivos y artículos son enviados con sello holográfico de seguridad y verificación anti-manipulación.',
      date: 'Hace 3 días'
    },
    {
      q: '¿Cómo funciona la garantía respaldada en el contrato inteligente NexCoin.sol?',
      a: 'Al pagar con Bitcoin, se genera un hash inmutable. Si el producto presenta fallas dentro de los 12 meses, presentas tu voucher y el proveedor cubre cambio inmediato.',
      date: 'Hace 1 semana'
    },
    {
      q: '¿Hacen envíos a todas las regiones y provincias?',
      a: 'Sí, despachamos a todo el país mediante courier de alta seguridad con tracking on-chain en tiempo real.',
      date: 'Hace 2 semanas'
    }
  ]);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      window.scrollTo(0, 0);

      const [foundProduct, catalog] = await Promise.all([
        getProductById(id),
        fetchAllStoreProducts()
      ]);

      setProduct(foundProduct);
      setAllProducts(catalog);
      setActiveImageIndex(0);
      setQuantity(1);
      setLoading(false);
    }
    loadData();
  }, [id]);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) return product.images;
    const main = product.image_url || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&q=80&w=800';
    return [
      main,
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&q=80&w=800'
    ];
  }, [product]);

  // Recommendations
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return allProducts.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);
  }, [product, allProducts]);

  const viewedAlsoBought = useMemo(() => {
    if (!product) return [];
    return allProducts.filter((p) => p.id !== product.id).slice(0, 4);
  }, [product, allProducts]);

  const boughtAlsoBought = useMemo(() => {
    if (!product) return [];
    return allProducts.filter((p) => p.id !== product.id).reverse().slice(0, 4);
  }, [product, allProducts]);

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center animate-spin">
          <Bitcoin className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-xs font-mono text-slate-400">Cargando producto de la blockchain...</p>
      </div>
    );
  }

  const inStock = product.stock > 0;
  const isFreeShipping = product.free_shipping || product.shipping_type === 'free';
  const supplierName = product.suppliers?.company_name || 'Proveedor Verificado NexCoin';
  const supplierEmail = product.suppliers?.email || 'soporte@nexcoin.com';
  const supplierWallet = product.suppliers?.wallet_address || 'No registrada';

  const shareUrl = window.location.href;
  const shareText = `Mira ${product.name} en NexCoin Store, cómpralo con Bitcoin: ${shareUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2200);
  };

  const handleBuyNow = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    setIsCartOpen(true);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuestion.trim()) return;
    setQuestionsList([
      {
        q: userQuestion.trim(),
        a: 'Tu pregunta fue enviada al proveedor. La respuesta será publicada en breve.',
        date: 'Reciente'
      },
      ...questionsList
    ]);
    setUserQuestion('');
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      
      {/* Top Ticker Bar */}
      <div className="bg-[#04060c] border-b border-white/[0.06] text-[11px] font-mono text-slate-400 py-2 px-4 sm:px-8 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Red Bitcoin: Bloque Verificado</span>
          </div>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400">1 BTC = ${BTC_PRICE_USD.toLocaleString()} USD</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-slate-400">Smart Contract: NexCoin.sol v2.0</span>
          <Link
            to="/#consultar-voucher"
            className="text-slate-300 hover:text-amber-400 transition flex items-center gap-1"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-500" />
            <span>Consultar Voucher</span>
          </Link>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-[#060911]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              <Bitcoin className="w-6 h-6 text-black stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1 font-heading">
                Nex<span className="text-amber-500">Coin</span>
              </span>
              <span className="text-[10px] text-amber-400/90 font-bold uppercase tracking-widest block -mt-1 font-mono">
                Store Marketplace
              </span>
            </div>
          </Link>
        </div>

        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white bg-[#0e1424] hover:bg-[#161f38] border border-white/[0.08] hover:border-amber-500/30 rounded-xl transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Volver a la Tienda</span>
          </Link>
        </div>
      </header>

      {/* Breadcrumb Bar */}
      <div className="bg-[#04060c] border-b border-white/[0.06] py-3.5 px-4 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-slate-400 font-medium overflow-x-auto">
          <Link to="/" className="hover:text-amber-400 transition flex items-center gap-1 shrink-0">
            <Store className="w-3.5 h-3.5 text-slate-500" />
            <span>Tienda</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="text-slate-400 shrink-0">{product.category || 'General'}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="text-amber-400 font-bold truncate">{product.name}</span>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 lg:px-12 py-10 space-y-12">
        
        {/* TOP HERO PRODUCT SECTION (Images Carousel + Primary Purchase Details) */}
        <div className="bg-[#090d19] border border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* LEFT: Photo Carousel (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Main Photo View */}
              <div className="relative w-full h-80 sm:h-[480px] rounded-2xl overflow-hidden bg-black/50 border border-white/[0.08] group">
                <img
                  src={galleryImages[activeImageIndex]}
                  alt={`${product.name} - toma ${activeImageIndex + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Carousel Prev/Next Buttons */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/[0.1] transition shadow-lg"
                      aria-label="Foto anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex((prev) => (prev + 1) % galleryImages.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/[0.1] transition shadow-lg"
                      aria-label="Foto siguiente"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Top Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                  {product.discount_percent && product.discount_percent > 0 && (
                    <span className="px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-lg flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      -{product.discount_percent}% OFF
                    </span>
                  )}
                  {isFreeShipping && (
                    <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
                      <Truck className="w-3.5 h-3.5" />
                      Envío gratis a todo el país
                    </span>
                  )}
                </div>

                {/* Photo Counter */}
                <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/80 text-xs font-mono font-bold text-slate-300 border border-white/[0.1] backdrop-blur-sm pointer-events-none">
                  {activeImageIndex + 1} / {galleryImages.length}
                </div>
              </div>

              {/* Thumbnails Row */}
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                        activeImageIndex === idx
                          ? 'border-amber-400 scale-95 shadow-lg shadow-amber-500/30'
                          : 'border-white/[0.08] opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* "Lo que tienes que saber de este producto" Box */}
              <div className="p-6 rounded-2xl bg-[#0c1224] border border-white/[0.08] space-y-3 mt-6">
                <h3 className="text-sm font-black text-white font-heading uppercase tracking-wide flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Lo que tienes que saber de este producto</span>
                </h3>
                <ul className="text-xs sm:text-sm text-slate-300 space-y-2.5">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Liquidación directa en Bitcoin:</strong> Sin comisiones bancarias ni custodios de por medio.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Garantía oficial de 12 meses:</strong> Respaldada por el Smart Contract NexCoin.sol v2.0 con voucher criptográfico.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Empaque sellado de fábrica:</strong> Producto 100% original con sello de seguridad holográfico anti-manipulación.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Entrega certificada:</strong> Seguimiento en tiempo real con opción de exportar voucher a PDF y Gmail.</span>
                  </li>
                </ul>
              </div>

            </div>

            {/* RIGHT: Buy Details & Info (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Category, Rating, Stock */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                  {product.category || 'General'}
                </span>

                <div className="flex items-center gap-2 text-xs">
                  {product.rating && (
                    <div className="flex items-center gap-1 font-bold text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{product.rating.toFixed(1)}</span>
                      {product.reviews_count && (
                        <span className="text-slate-500 font-normal">({product.reviews_count} opiniones)</span>
                      )}
                    </div>
                  )}

                  <span className="text-slate-600">•</span>

                  <span className={`font-mono font-bold ${inStock ? 'text-emerald-400' : 'text-red-400'}`}>
                    {inStock ? `● ${product.stock} disponibles` : '● Agotado'}
                  </span>
                </div>
              </div>

              {/* Product Title */}
              <h1 className="text-2xl sm:text-3xl font-black text-white font-heading leading-tight">
                {product.name}
              </h1>

              {/* SKU & Brand */}
              <div className="flex items-center gap-4 text-xs text-slate-400 font-mono -mt-3">
                {product.sku && <span>SKU: {product.sku}</span>}
                <span>•</span>
                <span>Por: <strong className="text-slate-200">{supplierName}</strong></span>
              </div>

              {/* Price Box */}
              <div className="p-5 rounded-2xl bg-[#0e1424] border border-white/[0.08] space-y-1.5">
                <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Precio en Bitcoin
                </p>
                
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                    {product.price_btc.toFixed(6)} BTC
                  </span>
                  {product.original_price_usd && product.original_price_usd > product.price_usd && (
                    <span className="text-sm text-slate-500 line-through font-mono">
                      ${product.original_price_usd.toFixed(2)} USD
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-300 font-mono">
                  ≈ ${product.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                </p>
              </div>

              {/* Shipping Status Box ("Envío gratis a todo el país, o no") */}
              <div className="p-4 rounded-2xl bg-[#0b1020] border border-white/[0.08] space-y-2">
                <div className="flex items-center gap-2.5">
                  <Truck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      {isFreeShipping ? 'Envío gratis a todo el país' : 'Envío estándar con seguimiento'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {isFreeShipping
                        ? 'Llega sin costo adicional entre 24 a 48 horas a cualquier ciudad.'
                        : 'Tarifa calculada al momento del despacho. Llega en 2 a 4 días hábiles.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              {inStock && (
                <div className="flex items-center justify-between gap-4 pt-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                    Cantidad a comprar:
                  </span>
                  
                  <div className="flex items-center border border-white/[0.1] bg-[#070b14] rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="p-2.5 text-slate-400 hover:text-white hover:bg-white/[0.05] disabled:opacity-30 transition"
                      aria-label="Restar cantidad"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 text-sm font-mono font-bold text-white">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      disabled={quantity >= product.stock}
                      className="p-2.5 text-slate-400 hover:text-white hover:bg-white/[0.05] disabled:opacity-30 transition"
                      aria-label="Sumar cantidad"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Total Calculation */}
              {inStock && (
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
                  <span>Subtotal ({quantity} {quantity === 1 ? 'unidad' : 'unidades'}):</span>
                  <span className="text-amber-400 font-bold text-sm">
                    {(product.price_btc * quantity).toFixed(6)} BTC (~${(product.price_usd * quantity).toFixed(2)} USD)
                  </span>
                </div>
              )}

              {/* Action Buttons: "Comprar ahora" y "Agregar al carrito" */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={!inStock}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-amber-500/25 transition flex items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none active:scale-[0.99]"
                >
                  <Zap className="w-4 h-4 fill-black" />
                  <span>Comprar ahora con Bitcoin</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className="w-full py-3.5 bg-[#11192e] hover:bg-[#182442] border border-white/[0.1] hover:border-amber-500/40 text-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none active:scale-[0.99]"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span>{addedToast ? '¡Agregado al carrito de compras! ✓' : 'Agregar al carrito'}</span>
                </button>
              </div>

              {/* Provider Info Card */}
              <div className="p-5 rounded-2xl bg-[#0c1224] border border-white/[0.08] space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                    Vendido y Despachado por
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Proveedor Verificado
                  </span>
                </div>

                <div className="flex items-center gap-3.5">
                  {(() => {
                    const parsed = parseBlobatar(product.suppliers?.avatar_url, supplierName);
                    return (
                      <Blobatar
                        name={parsed.seed}
                        blobatar={{
                          expression: parsed.expression,
                          animate: parsed.animProp,
                        }}
                        className={`w-12 h-12 ${parsed.shapeClass} border ${parsed.borderClass} ${parsed.glowClass} shrink-0`}
                      />
                    );
                  })()}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate">{supplierName}</h4>
                    <p className="text-xs text-slate-400 truncate">{supplierEmail}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                      Billetera BTC: {supplierWallet}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                  <span>99.4% de calificaciones positivas</span>
                  <a
                    href={`mailto:${supplierEmail}?subject=Consulta sobre ${encodeURIComponent(product.name)}`}
                    className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Contactar</span>
                  </a>
                </div>
              </div>

              {/* Social Share Buttons */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Compartir producto:</span>
                </span>

                <div className="flex flex-wrap items-center gap-2.5">
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
                    title="WhatsApp"
                    aria-label="Compartir en WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>

                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-blue-600/10 hover:bg-blue-600/25 border border-blue-500/30 text-blue-400 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
                    title="Facebook"
                    aria-label="Compartir en Facebook"
                  >
                    <span className="font-bold text-base leading-none">f</span>
                  </a>

                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Descubre ${product.name} en @NexCoinMarket:`)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/[0.1] text-slate-200 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
                    title="X"
                    aria-label="Compartir en X"
                  >
                    <span className="font-mono font-black text-sm">𝕏</span>
                  </a>

                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(product.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-sky-500/10 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
                    title="Telegram"
                    aria-label="Compartir en Telegram"
                  >
                    <Send className="w-4 h-4" />
                  </a>

                  <a
                    href={`mailto:?subject=${encodeURIComponent(`Te recomiendo: ${product.name} en NexCoin`)}&body=${encodeURIComponent(shareText)}`}
                    className="w-10 h-10 rounded-xl bg-purple-600/10 hover:bg-purple-600/25 border border-purple-500/30 text-purple-400 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
                    title="Mail"
                    aria-label="Compartir por Mail"
                  >
                    <Mail className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm ${
                      copiedLink
                        ? 'bg-emerald-500 text-black border-emerald-400'
                        : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border-white/[0.1]'
                    }`}
                    title={copiedLink ? '¡Enlace copiado al portapapeles!' : 'Copiar link'}
                    aria-label="Copiar link"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-amber-400" />}
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* SECTION: CARACTERÍSTICAS DEL PRODUCTO */}
        <section className="bg-[#090d19] border border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
            Características del producto
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-[#060911] border border-white/[0.06] flex justify-between">
              <span className="text-slate-400">Marca / Fabricante</span>
              <span className="font-bold text-white">{supplierName}</span>
            </div>
            <div className="p-4 rounded-xl bg-[#060911] border border-white/[0.06] flex justify-between">
              <span className="text-slate-400">Categoría</span>
              <span className="font-bold text-white">{product.category || 'General'}</span>
            </div>
            <div className="p-4 rounded-xl bg-[#060911] border border-white/[0.06] flex justify-between">
              <span className="text-slate-400">Código de Referencia / SKU</span>
              <span className="font-bold text-amber-400 font-mono">{product.sku || 'NEX-PROD-2026'}</span>
            </div>
            <div className="p-4 rounded-xl bg-[#060911] border border-white/[0.06] flex justify-between">
              <span className="text-slate-400">Moneda de Pago Aceptada</span>
              <span className="font-bold text-white flex items-center gap-1">
                <Bitcoin className="w-3.5 h-3.5 text-amber-500" />
                Bitcoin (BTC on-chain)
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#060911] border border-white/[0.06] flex justify-between">
              <span className="text-slate-400">Condición del Ítem</span>
              <span className="font-bold text-emerald-400">Nuevo en Caja Sellada</span>
            </div>
            <div className="p-4 rounded-xl bg-[#060911] border border-white/[0.06] flex justify-between">
              <span className="text-slate-400">Garantía Smart Contract</span>
              <span className="font-bold text-white">12 Meses con NexCoin.sol</span>
            </div>
          </div>
        </section>

        {/* SECTION: DESCRIPCIÓN COMPLETA */}
        <section className="bg-[#090d19] border border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
            Descripción
          </h2>
          <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4">
            <p>{product.description}</p>
            <p>
              Este artículo forma parte del ecosistema oficial de productos de NexCoin. Cada unidad es inspeccionada rigurosamente antes del despacho para certificar su autenticidad física y criptográfica.
            </p>
            <p>
              Al completar tu compra con Bitcoin, nuestro contrato inteligente registrará la transferencia on-chain y expedirá tu comprobante inmutable con número de orden y hash de verificación para cualquier atención de garantía o reclamo.
            </p>
          </div>
        </section>

        {/* SECTION: PREGUNTAS Y RESPUESTAS */}
        <section className="bg-[#090d19] border border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          <h2 className="text-xl sm:text-2xl font-black text-white font-heading flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-400" />
            <span>Preguntas y respuestas</span>
          </h2>

          {/* Ask Input Form */}
          <form onSubmit={handleAddQuestion} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Escribe tu pregunta sobre este producto al proveedor..."
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                className="flex-1 bg-[#060911] border border-white/[0.1] rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition shrink-0"
              >
                Preguntar
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Tiempo estimado de respuesta del proveedor: menos de 2 horas.
            </p>
          </form>

          {/* Questions List */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Últimas preguntas realizadas
            </h4>

            {questionsList.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-[#060911] border border-white/[0.06] space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span className="text-amber-400 font-mono">P:</span>
                    {item.q}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">{item.date}</span>
                </div>
                <p className="text-xs text-slate-300 pl-4 border-l-2 border-amber-500/40 leading-relaxed">
                  <span className="text-emerald-400 font-mono font-bold mr-1.5">R:</span>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION: OPINIONES DEL PRODUCTO & CALIFICACIONES */}
        <section className="bg-[#090d19] border border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.08] pb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
                Opiniones del producto
              </h2>
              <p className="text-xs text-slate-400 mt-1">Calificaciones certificadas de compradores con Bitcoin.</p>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#060911] border border-white/[0.06]">
              <span className="text-4xl font-black text-amber-400 font-heading">
                {product.rating ? product.rating.toFixed(1) : '4.9'}
              </span>
              <div>
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Basado en {product.reviews_count || 120} calificaciones
                </p>
              </div>
            </div>
          </div>

          {/* Sample Reviews */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#060911] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-white">Excelente calidad y empaque blindado</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">18 Sep 2026</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Llegó en 24 horas a Lima. Pagué directamente desde mi wallet con WalletConnect y la firma se verificó al instante. Totalmente recomendado.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
                <Check className="w-3 h-3" />
                <span>Compra verificada on-chain</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#060911] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-white">100% original, proveedor muy atento</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">05 Sep 2026</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                El comprobante en PDF con el código de voucher me llegó también al Gmail. El producto está impecable y funcionando a la perfección.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
                <Check className="w-3 h-3" />
                <span>Compra verificada on-chain</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: PRODUCTOS RELACIONADOS */}
        {relatedProducts.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
              Productos relacionados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/producto/${rel.id}`}
                  className="group bg-[#090d19] border border-white/[0.08] hover:border-amber-500/40 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 block"
                >
                  <div className="w-full h-40 rounded-xl overflow-hidden bg-black/40 mb-3">
                    <img src={rel.image_url} alt={rel.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition line-clamp-2">{rel.name}</h4>
                  <p className="text-sm font-black text-amber-400 font-mono mt-2">{rel.price_btc.toFixed(6)} BTC</p>
                  <p className="text-[10px] text-slate-400 font-mono">≈ ${rel.price_usd.toFixed(2)} USD</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SECTION: QUIENES VIERON ESTE PRODUCTO TAMBIÉN COMPRARON */}
        {viewedAlsoBought.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
              Quienes vieron este producto también compraron
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {viewedAlsoBought.map((item) => (
                <Link
                  key={item.id}
                  to={`/producto/${item.id}`}
                  className="group bg-[#090d19] border border-white/[0.08] hover:border-amber-500/40 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 block"
                >
                  <div className="w-full h-40 rounded-xl overflow-hidden bg-black/40 mb-3">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition line-clamp-2">{item.name}</h4>
                  <p className="text-sm font-black text-amber-400 font-mono mt-2">{item.price_btc.toFixed(6)} BTC</p>
                  <p className="text-[10px] text-slate-400 font-mono">≈ ${item.price_usd.toFixed(2)} USD</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SECTION: QUIENES COMPRARON ESTE PRODUCTO TAMBIÉN COMPRARON */}
        {boughtAlsoBought.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
              Quienes compraron este producto también compraron
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {boughtAlsoBought.map((item) => (
                <Link
                  key={item.id}
                  to={`/producto/${item.id}`}
                  className="group bg-[#090d19] border border-white/[0.08] hover:border-amber-500/40 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 block"
                >
                  <div className="w-full h-40 rounded-xl overflow-hidden bg-black/40 mb-3">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition line-clamp-2">{item.name}</h4>
                  <p className="text-sm font-black text-amber-400 font-mono mt-2">{item.price_btc.toFixed(6)} BTC</p>
                  <p className="text-[10px] text-slate-400 font-mono">≈ ${item.price_usd.toFixed(2)} USD</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SECTION: PRODUCTOS MÁS BUSCADOS */}
        <section className="bg-[#090d19] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            Productos más buscados en NexCoin
          </h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              'Hardware Wallet Ledger Nano',
              'Billeteras frías Air-Gapped',
              'Placas de titanio 24 palabras',
              'Antminer S21 refrigeración líquida',
              'Nodo Bitcoin Plug & Play',
              'Polerón Crypto NFC',
              'Lámpara de Neón Bitcoin',
              'YubiKey FIDO2 USB-C',
              'Bolsas Faraday militares',
              'Anillo inteligente NFC Bitcoin',
              'Libro The Bitcoin Standard'
            ].map((tag, i) => (
              <Link
                key={i}
                to="/"
                className="px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-slate-300 hover:text-amber-400 transition"
              >
                {tag}
              </Link>
            ))}
          </div>
        </section>

      </main>

      {/* FLOATING CART BUTTON */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-black flex items-center justify-center shadow-2xl shadow-amber-500/35 border border-amber-300/40 hover:scale-110 active:scale-95 transition-all duration-300 group"
        title="Ver bolsa de compras"
        aria-label="Ver bolsa de compras"
      >
        <ShoppingBag className="w-6 h-6 text-black stroke-[2.2] group-hover:rotate-6 transition-transform" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[24px] h-6 px-1.5 bg-black text-amber-400 font-black text-xs font-mono rounded-full border-2 border-amber-400 flex items-center justify-center shadow-lg animate-bounce">
            {itemCount}
          </span>
        )}
      </button>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* FOOTER COMPLETO INSTITUCIONAL (Trabaja con nosotros, Términos y condiciones, Promociones, Cómo cuidamos tu privacidad, Accesibilidad, Ayuda) */}
      <footer className="border-t border-white/[0.08] bg-[#04060c] pt-14 pb-8 px-4 sm:px-8 lg:px-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center">
                <Bitcoin className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
              <span className="text-lg font-black tracking-tight text-white font-heading">
                Nex<span className="text-amber-500">Coin</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Plataforma de comercio electrónico descentralizado respaldada en la red Bitcoin con firmas de contrato inteligente `NexCoin.sol`.
            </p>
            <div className="pt-1">
              <span className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono font-bold">
                100% Non-Custodial P2P
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Nosotros
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link to="/trabaja-con-nosotros" className="hover:text-amber-400 transition block">
                  Trabaja con nosotros
                </Link>
              </li>
              <li>
                <Link to="/sobre-nosotros" className="hover:text-amber-400 transition block">
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link to="/nuestro-proposito" className="hover:text-amber-400 transition block">
                  Nuestro propósito
                </Link>
              </li>
              <li>
                <Link to="/promociones" className="hover:text-amber-400 transition block">
                  Promociones
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Servicio al cliente & Ayuda
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link to="/ayuda" className="hover:text-amber-400 transition block">
                  Ayuda
                </Link>
              </li>
              <li>
                <Link to="/servicio-al-cliente" className="hover:text-amber-400 transition block">
                  Servicio al cliente
                </Link>
              </li>
              <li>
                <Link to="/reclamos" className="hover:text-amber-400 transition block">
                  Reclamos
                </Link>
              </li>
              <li>
                <Link to="/libro-de-reclamaciones" className="hover:text-amber-400 transition font-bold text-amber-400 block">
                  Libro de reclamaciones
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Legales y Políticas
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link to="/terminos-y-condiciones" className="hover:text-amber-400 transition block">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link to="/como-cuidamos-tu-privacidad" className="hover:text-amber-400 transition block">
                  Cómo cuidamos tu privacidad
                </Link>
              </li>
              <li>
                <Link to="/accesibilidad" className="hover:text-amber-400 transition block">
                  Accesibilidad
                </Link>
              </li>
              <li>
                <Link to="/politica-cookies" className="hover:text-amber-400 transition block">
                  Política de cookies
                </Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© Todos los derechos reservados • NexCoin Technologies S.A.C.</p>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[10px]">
            <span>Bitcoin Network Verified</span>
            <span>•</span>
            <span>NexCoin.sol • On-Chain</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
