import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { fetchSupplierQuestions, fetchSupplierReviews } from '../../lib/qaAndReviewsService';
import {
  Bell,
  AlertTriangle,
  Ban,
  MessageSquare,
  Star,
  ShoppingBag,
  Check,
  CheckCheck,
  ExternalLink,
  X
} from 'lucide-react';

export type NotificationType = 'low_stock' | 'out_of_stock' | 'question' | 'review' | 'sale';

export interface SupplierNotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  link: string;
  metadata?: {
    stock?: number;
    productId?: string;
    productName?: string;
    orderNumber?: string;
    rating?: number;
  };
}

interface SupplierNotificationsDropdownProps {
  supplierId: string;
}

export const SupplierNotificationsDropdown: React.FC<SupplierNotificationsDropdownProps> = ({ supplierId }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SupplierNotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`nexcoin_read_notifs_${supplierId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync readIds with localStorage whenever changed
  const markAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(`nexcoin_read_notifs_${supplierId}`, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const combined = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(combined);
    try {
      localStorage.setItem(`nexcoin_read_notifs_${supplierId}`, JSON.stringify(combined));
    } catch (err) {
      console.error(err);
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Load supplier specific notifications
  const loadNotifications = async () => {
    if (!supplierId) return;
    setLoading(true);

    try {
      const notifs: SupplierNotificationItem[] = [];

      // 1. Fetch supplier's products for Low Stock and Out of Stock
      const { data: products } = await supabase
        .from('products')
        .select('id, name, stock, status')
        .eq('supplier_id', supplierId);

      if (products && products.length > 0) {
        products.forEach((p) => {
          if (p.stock === 0) {
            notifs.push({
              id: `stock-out-${p.id}`,
              type: 'out_of_stock',
              title: 'Producto Agotado',
              description: `"${p.name}" tiene 0 unidades en inventario. Requiere reposición.`,
              timestamp: 'Atención requerida',
              link: `/proveedores/productos?filtro=desactivados&q=${encodeURIComponent(p.name)}`,
              metadata: { stock: 0, productId: p.id, productName: p.name },
            });
          } else if (p.stock > 0 && p.stock <= 5) {
            notifs.push({
              id: `stock-low-${p.id}-${p.stock}`,
              type: 'low_stock',
              title: 'Por Agotarse',
              description: `"${p.name}" tiene stock crítico: ¡solo quedan ${p.stock} unidades!`,
              timestamp: 'Stock bajo',
              link: `/proveedores/productos?filtro=activos&q=${encodeURIComponent(p.name)}`,
              metadata: { stock: p.stock, productId: p.id, productName: p.name },
            });
          }
        });
      }

      // 2. Fetch questions for this supplier
      const questions = await fetchSupplierQuestions(supplierId);
      questions.forEach((q) => {
        if (!q.answer) {
          notifs.push({
            id: `question-${q.id}`,
            type: 'question',
            title: 'Pregunta de Cliente',
            description: `${q.user_name} preguntó sobre "${q.product_name || 'tu producto'}": "${q.question}"`,
            timestamp: new Date(q.created_at).toLocaleDateString(),
            link: `/proveedores/preguntas?filtro=pendientes&q=${encodeURIComponent(q.user_name || '')}`,
            metadata: { productName: q.product_name },
          });
        }
      });

      // 3. Fetch reviews for this supplier
      const reviews = await fetchSupplierReviews(supplierId);
      reviews.slice(0, 10).forEach((r) => {
        notifs.push({
          id: `review-${r.id}`,
          type: 'review',
          title: `Reseña de Cliente (${r.rating}★)`,
          description: `${r.user_name} calificó "${r.product_name}": "${r.comment.substring(0, 70)}${r.comment.length > 70 ? '...' : ''}"`,
          timestamp: new Date(r.created_at).toLocaleDateString(),
          link: `/proveedores/calificaciones?filtro=todas`,
          metadata: { rating: r.rating, productName: r.product_name },
        });
      });

      // 4. Fetch orders / sales for this supplier
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('*, orders(*)')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (orderItems && orderItems.length > 0) {
        const seenOrderIds = new Set<string>();
        orderItems.forEach((item: any) => {
          if (item.orders && !seenOrderIds.has(item.orders.id)) {
            seenOrderIds.add(item.orders.id);
            const ord = item.orders;
            notifs.push({
              id: `sale-${ord.id}`,
              type: 'sale',
              title: 'Nueva Venta en Bitcoin',
              description: `Orden #${ord.order_number} de ${ord.customer_name} por $${Number(ord.total_usd).toFixed(2)} USD (${Number(ord.total_btc).toFixed(6)} BTC)`,
              timestamp: new Date(ord.created_at).toLocaleDateString(),
              link: `/proveedores/ventas?q=${encodeURIComponent(ord.voucher_code || ord.order_number)}`,
              metadata: { orderNumber: ord.order_number },
            });
          }
        });
      }

      setNotifications(notifs);
    } catch (err) {
      console.warn('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [supplierId]);

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    return n.type === activeFilter;
  });

  const getCategoryConfig = (type: NotificationType) => {
    switch (type) {
      case 'low_stock':
        return {
          label: 'Por Agotarse',
          icon: AlertTriangle,
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          iconClass: 'text-amber-400',
        };
      case 'out_of_stock':
        return {
          label: 'Agotados',
          icon: Ban,
          badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          iconClass: 'text-rose-400',
        };
      case 'question':
        return {
          label: 'Preguntas',
          icon: MessageSquare,
          badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
          iconClass: 'text-sky-400',
        };
      case 'review':
        return {
          label: 'Reseñas',
          icon: Star,
          badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
          iconClass: 'text-yellow-400',
        };
      case 'sale':
        return {
          label: 'Ventas',
          icon: ShoppingBag,
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          iconClass: 'text-emerald-400',
        };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        className="relative p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/[0.08] transition shadow-sm"
        title="Notificaciones de mi cuenta de Proveedor"
      >
        <Bell className="w-5 h-5 text-slate-300 group-hover:text-amber-400 transition" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-[10px] font-black text-slate-950 shadow-lg shadow-amber-500/50 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 sm:right-auto sm:left-auto lg:right-0 mt-3 w-80 sm:w-96 max-w-[calc(100vw-24px)] bg-[#0a0f1d] border border-white/[0.12] rounded-2xl shadow-2xl shadow-black/80 z-50 overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-[#0e1628] border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Centro de Notificaciones</h4>
                <p className="text-[10px] text-slate-400">
                  {unreadCount === 0 ? 'Sin pendientes nuevos' : `${unreadCount} pendientes sin leer`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition"
                  title="Marcar todas como leídas"
                >
                  Leídas todas
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="p-2.5 bg-[#060911]/90 border-b border-white/[0.06] flex items-center gap-1.5 overflow-x-auto lateral-scrollbar text-[10px]">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition ${
                activeFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('low_stock')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition flex items-center gap-1 ${
                activeFilter === 'low_stock'
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-white/[0.05]'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Por Agotarse</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('out_of_stock')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition flex items-center gap-1 ${
                activeFilter === 'out_of_stock'
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-rose-300 hover:bg-white/[0.05]'
              }`}
            >
              <Ban className="w-3 h-3 text-rose-400" />
              <span>Agotados</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('question')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition flex items-center gap-1 ${
                activeFilter === 'question'
                  ? 'bg-sky-500/30 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-sky-300 hover:bg-white/[0.05]'
              }`}
            >
              <MessageSquare className="w-3 h-3 text-sky-400" />
              <span>Preguntas</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('review')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition flex items-center gap-1 ${
                activeFilter === 'review'
                  ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/40'
                  : 'text-slate-400 hover:text-yellow-300 hover:bg-white/[0.05]'
              }`}
            >
              <Star className="w-3 h-3 text-yellow-400" />
              <span>Reseñas</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('sale')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition flex items-center gap-1 ${
                activeFilter === 'sale'
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-white/[0.05]'
              }`}
            >
              <ShoppingBag className="w-3 h-3 text-emerald-400" />
              <span>Ventas</span>
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto lateral-scrollbar divide-y divide-white/[0.05] p-2 space-y-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Cargando notificaciones del proveedor...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-900 border border-white/[0.08] flex items-center justify-center text-slate-500">
                  <CheckCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-xs font-semibold text-slate-300">Todo al día</p>
                <p className="text-[11px] text-slate-500 max-w-[200px] mx-auto">
                  No hay notificaciones en esta categoría para tu cuenta.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isRead = readIds.includes(notif.id);
                const conf = getCategoryConfig(notif.type);
                const Icon = conf.icon;

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      markAsRead(notif.id);
                      setIsOpen(false);
                      navigate(notif.link);
                    }}
                    className={`p-3 rounded-xl transition cursor-pointer flex items-start gap-3 group relative ${
                      isRead ? 'opacity-65 hover:opacity-95 hover:bg-white/[0.03]' : 'bg-slate-900/60 hover:bg-slate-900 border border-white/[0.06]'
                    }`}
                  >
                    {/* Category Icon */}
                    <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${conf.badgeClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 justify-between">
                        <span className="text-[11px] font-bold text-white group-hover:text-amber-400 transition truncate">
                          {notif.title}
                        </span>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.description}
                      </p>

                      {notif.metadata?.stock !== undefined && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
                            Stock actual: {notif.metadata.stock} uds.
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/[0.04]">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {notif.timestamp}
                        </span>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {/* Mark as read button */}
                          {!isRead && (
                            <button
                              type="button"
                              onClick={(e) => markAsRead(notif.id, e)}
                              className="p-1 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition"
                              title="Marcar como leída"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* View in list button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notif.id);
                              setIsOpen(false);
                              navigate(notif.link);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition"
                            title="Ver en el listado"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
