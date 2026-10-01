import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Product } from '../../types/store';
import { getProductById, fetchAllStoreProducts, BTC_PRICE_USD, isFreeShippingProduct } from '../../data/productsData';
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
  Send,
  HelpCircle,
  Sparkles,
  Receipt,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  X
} from 'lucide-react';
import {
  fetchProductQuestions,
  submitProductQuestion,
  ProductQuestion,
  fetchProductReviews,
  submitProductReview,
  ProductReview
} from '../../lib/qaAndReviewsService';
import { 
  FaWhatsapp, 
  FaFacebookF, 
  FaXTwitter, 
  FaTelegram, 
  FaLinkedinIn 
} from 'react-icons/fa6';

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
  const [questionsList, setQuestionsList] = useState<ProductQuestion[]>([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [questionSuccess, setQuestionSuccess] = useState(false);

  // Reviews & Rating state
  const [reviewsList, setReviewsList] = useState<ProductReview[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewVoucherCode, setReviewVoucherCode] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      window.scrollTo(0, 0);

      const [foundProduct, catalog, questions, reviews] = await Promise.all([
        getProductById(id),
        fetchAllStoreProducts(),
        fetchProductQuestions(id),
        fetchProductReviews(id)
      ]);

      setProduct(foundProduct);
      if (foundProduct?.name) {
        document.title = `${foundProduct.name} | NovaSats Marketplace`;
      }
      setAllProducts(catalog);
      setQuestionsList(questions);
      setReviewsList(reviews);
      setActiveImageIndex(0);
      setQuantity(1);
      setLoading(false);
    }
    loadData();
  }, [id]);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) return product.images;
    if (product.image_url) return [product.image_url];
    return [];
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

  const averageRating = useMemo(() => {
    if (reviewsList.length === 0) {
      return product?.rating !== undefined && product?.rating !== null ? Number(product.rating) : 0.0;
    }
    const sum = reviewsList.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / reviewsList.length).toFixed(1));
  }, [reviewsList, product]);

  const totalReviewsCount = reviewsList.length > 0 ? reviewsList.length : (product?.reviews_count || 0);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product!);
    }
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2200);
  };

  const handleBuyNow = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product!);
    }
    setIsCartOpen(true);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !userQuestion.trim()) return;

    setIsSubmittingQuestion(true);
    try {
      const created = await submitProductQuestion({
        productId: product.id,
        supplierId: product.supplier_id,
        productName: product.name,
        userName: userName.trim() || 'Comprador Web3',
        userEmail: userEmail.trim(),
        question: userQuestion.trim(),
      });

      setQuestionsList((prev) => [created, ...prev]);
      setUserQuestion('');
      setUserName('');
      setUserEmail('');
      setQuestionSuccess(true);
      setTimeout(() => setQuestionSuccess(false), 4000);
    } catch (err) {
      console.error('Error submitting question:', err);
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !reviewComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      const created = await submitProductReview({
        productId: product.id,
        supplierId: product.supplier_id,
        userName: reviewerName.trim() || 'Comprador Bitcoin',
        userEmail: reviewerEmail.trim(),
        rating: reviewRating,
        comment: reviewComment.trim(),
        voucherCode: reviewVoucherCode.trim() || undefined,
        verifiedPurchase: Boolean(reviewVoucherCode.trim()),
      });

      setReviewsList((prev) => [created, ...prev]);

      // Dynamically update product local rating
      const allRatings = [created.rating, ...reviewsList.map((r) => r.rating)];
      const avg = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
      setProduct((prev) => prev ? { ...prev, rating: Number(avg.toFixed(1)), reviews_count: allRatings.length } : prev);

      setReviewComment('');
      setReviewVoucherCode('');
      setReviewerName('');
      setReviewerEmail('');
      setReviewSuccess(true);
      setTimeout(() => {
        setReviewSuccess(false);
        setShowReviewModal(false);
      }, 1500);
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

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
  const isFreeShipping = isFreeShippingProduct(product);
  const supplierName = product.suppliers?.company_name || 'Proveedor Verificado NovaSats';
  const supplierEmail = product.suppliers?.email || 'soporte@novasats.com';
  const supplierWallet = product.suppliers?.wallet_address || 'No registrada';

  const shareUrl = window.location.href;
  const shareText = `Mira ${product.name} en NovaSats Store, cómpralo con Bitcoin: ${shareUrl}`;

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
          <span className="hidden md:inline text-slate-400">Smart Contract: NovaSats.sol v2.0</span>
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
                    <span><strong>Garantía oficial de 12 meses:</strong> Respaldada por el Smart Contract NovaSats.sol v2.0 con voucher criptográfico.</span>
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
                  <div className="flex items-center gap-1 font-bold">
                    {averageRating > 0 ? (
                      <>
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-amber-400">{averageRating.toFixed(1)}</span>
                        <span className="text-slate-500 font-normal">
                          ({totalReviewsCount} {totalReviewsCount === 1 ? 'opinión' : 'opiniones'})
                        </span>
                      </>
                    ) : (
                      <>
                        <Star className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-slate-400">0.0</span>
                        <span className="text-slate-500 font-normal">(0 opiniones)</span>
                      </>
                    )}
                  </div>

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
                  {/* WhatsApp */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
                    title="Compartir en WhatsApp"
                    aria-label="Compartir en WhatsApp"
                  >
                    <FaWhatsapp className="w-5 h-5" />
                  </a>

                  {/* Facebook */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/30 text-[#1877F2] flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
                    title="Compartir en Facebook"
                    aria-label="Compartir en Facebook"
                  >
                    <FaFacebookF className="w-4 h-4" />
                  </a>

                  {/* X (Twitter) */}
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Descubre ${product.name} en @NovaSatsMarket:`)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
                    title="Compartir en X (Twitter)"
                    aria-label="Compartir en X (Twitter)"
                  >
                    <FaXTwitter className="w-4 h-4" />
                  </a>

                  {/* Telegram */}
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(product.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-[#229ED9]/15 hover:bg-[#229ED9]/25 border border-[#229ED9]/30 text-[#229ED9] flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
                    title="Compartir en Telegram"
                    aria-label="Compartir en Telegram"
                  >
                    <FaTelegram className="w-5 h-5" />
                  </a>

                  {/* LinkedIn */}
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-[#0A66C2]/15 hover:bg-[#0A66C2]/25 border border-[#0A66C2]/30 text-[#0A66C2] flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
                    title="Compartir en LinkedIn"
                    aria-label="Compartir en LinkedIn"
                  >
                    <FaLinkedinIn className="w-4 h-4" />
                  </a>

                  {/* Email */}
                  <a
                    href={`mailto:?subject=${encodeURIComponent(`Te recomiendo: ${product.name}`)}&body=${encodeURIComponent(shareText)}`}
                    className="w-10 h-10 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-400 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
                    title="Compartir por Correo Electrónico"
                    aria-label="Compartir por Correo Electrónico"
                  >
                    <Mail className="w-4 h-4" />
                  </a>

                  {/* Copy Link */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm ${
                      copiedLink
                        ? 'bg-emerald-500 text-black border-emerald-400'
                        : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border-white/[0.1]'
                    }`}
                    title={copiedLink ? '¡Enlace copiado al portapapeles!' : 'Copiar enlace directo'}
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
              <span className="font-bold text-white">12 Meses con NovaSats.sol</span>
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
              Este artículo forma parte del ecosistema oficial de productos de NovaSats. Cada unidad es inspeccionada rigurosamente antes del despacho para certificar su autenticidad física y criptográfica.
            </p>
            <p>
              Al completar tu compra con Bitcoin, nuestro contrato inteligente registrará la transferencia on-chain y expedirá tu comprobante inmutable con número de orden y hash de verificación para cualquier atención de garantía o reclamo.
            </p>
          </div>
        </section>

        {/* SECTION: PREGUNTAS Y RESPUESTAS */}
        <section className="bg-[#090d19] border border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-heading flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-amber-400" />
                <span>Preguntas y respuestas</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                ¿Tienes dudas sobre el producto, compatibilidad o envío? Pregúntale directamente al proveedor.
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold self-start sm:self-auto">
              {questionsList.length} pregunta(s)
            </span>
          </div>

          {/* Ask Input Form */}
          <form onSubmit={handleAddQuestion} className="space-y-3 bg-[#060911] border border-white/[0.06] rounded-2xl p-4 sm:p-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Escribe tu pregunta sobre este producto
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ej: ¿El producto incluye cable de conexión y garantía oficial del fabricante?"
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  className="flex-1 bg-[#090d19] border border-white/[0.1] rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={isSubmittingQuestion || !userQuestion.trim()}
                  className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition shrink-0 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingQuestion ? 'Enviando...' : 'Preguntar'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Tu nombre o alias (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Satoshi Lover, Carlos R."
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-[#090d19] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Tu correo electrónico (opcional, para avisarte cuando respondan)
                </label>
                <input
                  type="email"
                  placeholder="comprador@ejemplo.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-[#090d19] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {questionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>¡Tu pregunta fue enviada al proveedor! Cuando responda desde su panel aparecerá aquí con la insignia oficial.</span>
              </div>
            )}
          </form>

          {/* Questions List */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Preguntas de compradores ({questionsList.length})
            </h4>

            {questionsList.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#060911] border border-white/[0.06] text-center space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Aún no hay preguntas para este producto.</p>
                <p className="text-[11px] text-slate-500">¿Tienes dudas sobre el envío, garantía o especificaciones? ¡Escribe la primera pregunta arriba!</p>
              </div>
            ) : (
              questionsList.map((item) => (
                <div key={item.id} className="p-5 rounded-2xl bg-[#060911] border border-white/[0.06] space-y-3">
                  {/* User Question */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-slate-300">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-white">{item.user_name || 'Comprador Web3'}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Reciente'}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200 pl-8 leading-relaxed font-medium">
                      <span className="text-amber-400 font-bold mr-1.5">P:</span>
                      {item.question}
                    </p>
                  </div>

                  {/* Supplier Answer or Pending Badge */}
                  {item.answer ? (
                    <div className="ml-6 sm:ml-8 p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-[#0a1814] border border-emerald-500/30 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Respuesta oficial del Proveedor ({supplierName})</span>
                        </div>
                        {item.answered_at && (
                          <span className="text-[10px] text-emerald-500/80 font-mono">
                            {new Date(item.answered_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed pl-1">
                        {item.answer}
                      </p>
                    </div>
                  ) : (
                    <div className="ml-6 sm:ml-8 flex items-center gap-2 text-[11px] font-mono text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg w-fit">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      <span>Pendiente de respuesta por el proveedor</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* SECTION: OPINIONES DEL PRODUCTO & CALIFICACIONES */}
        <section className="bg-[#090d19] border border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.08] pb-6">
            <div>
              <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase font-bold">
                Transparencia & Confianza On-Chain
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white font-heading mt-0.5">
                Opiniones y Calificación del Proveedor
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Calificaciones de compradores de {supplierName} verificadas en Bitcoin blockchain.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-3.5 px-4 py-2.5 rounded-2xl bg-[#060911] border border-white/[0.08] shadow-inner">
                <span className="text-3xl font-black text-amber-400 font-heading leading-none">
                  {averageRating.toFixed(1)}
                </span>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= Math.round(averageRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {totalReviewsCount ? `${totalReviewsCount} calificaciones` : 'Sin opiniones aún'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="px-5 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-2 hover:shadow-lg active:scale-95 whitespace-nowrap"
              >
                <Star className="w-4 h-4 fill-slate-950" />
                <span>Calificar Producto</span>
              </button>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviewsList.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#060911] border border-white/[0.06] text-center space-y-3">
                <Star className="w-8 h-8 text-amber-400/50 mx-auto" />
                <h4 className="text-sm font-bold text-white">Aún no hay calificaciones registradas</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  ¿Adquiriste este producto o contrataste con {supplierName}? Comparte tu experiencia con la comunidad crypto.
                </p>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="mt-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-xl transition"
                >
                  Escribir la primera reseña
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviewsList.map((review) => (
                  <div key={review.id} className="p-5 rounded-2xl bg-[#060911] border border-white/[0.06] space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                            {review.user_name ? review.user_name.substring(0, 2).toUpperCase() : 'US'}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">{review.user_name || 'Comprador Bitcoin'}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {review.created_at ? new Date(review.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Reciente'}
                            </span>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Verified Badge if voucher present */}
                      {(review.verified_purchase || review.voucher_code) && (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md w-fit">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Compra Verificada On-Chain {review.voucher_code ? `(Voucher #${review.voucher_code})` : ''}</span>
                        </div>
                      )}

                      {/* Review Comment */}
                      <p className="text-xs text-slate-300 leading-relaxed pt-1">
                        "{review.comment}"
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/[0.04] text-[10px] font-mono text-slate-500 flex items-center justify-between">
                      <span>Proveedor: {supplierName}</span>
                      <span className="text-emerald-500/80">Calificación verificada</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* REVIEW SUBMISSION MODAL */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-[#090d19] border border-white/[0.1] rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white font-heading">
                    Calificar Producto y Proveedor
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {product.name} • {supplierName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Interactive Star Rating */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    ¿Cómo calificarías este producto y la atención del proveedor?
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#060911] border border-white/[0.08]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setReviewRating(star)}
                          className="p-1 transition hover:scale-125 focus:outline-none"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= (hoverRating || reviewRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-amber-400 font-mono">
                      {reviewRating === 5 && '★★★★★ Excelente'}
                      {reviewRating === 4 && '★★★★☆ Muy bueno'}
                      {reviewRating === 3 && '★★★☆☆ Bueno'}
                      {reviewRating === 2 && '★★☆☆☆ Regular'}
                      {reviewRating === 1 && '★☆☆☆☆ Insuficiente'}
                    </span>
                  </div>
                </div>

                {/* Name / Alias */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Nombre o Alias del comprador
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Daniel V., Satoshi Fan"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full bg-[#060911] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Código de Voucher / Orden (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: VCH-2026-XXXX"
                      value={reviewVoucherCode}
                      onChange={(e) => setReviewVoucherCode(e.target.value)}
                      className="w-full bg-[#060911] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Tu opinión sobre el producto y servicio del proveedor
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe los puntos fuertes del producto, el estado en que llegó el paquete, la velocidad de despacho y la comunicación con el proveedor..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-[#060911] border border-white/[0.08] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {reviewSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>¡Calificación registrada con éxito en la plataforma!</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-white/[0.1] text-xs font-bold text-slate-300 hover:text-white hover:bg-white/[0.05] transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview || !reviewComment.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    {isSubmittingReview ? 'Publicando...' : 'Publicar Calificación'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
            Productos más buscados en NovaSats
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
              Plataforma de comercio electrónico descentralizado respaldada en la red Bitcoin con firmas de contrato inteligente `NovaSats.sol`.
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
          <p>© Todos los derechos reservados • NovaSats Technologies S.A.C.</p>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[10px]">
            <span>Bitcoin Network Verified</span>
            <span>•</span>
            <span>NovaSats.sol • On-Chain</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
