import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useSupplier } from './SupplierContext';
import { fetchSupplierQuestions, fetchSupplierReviews } from '../lib/qaAndReviewsService';

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

interface SupplierNotificationsContextType {
  notifications: SupplierNotificationItem[];
  notificationsByCategory: Record<NotificationType, SupplierNotificationItem[]>;
  unreadCounts: Record<NotificationType, number>;
  totalUnreadCount: number;
  activeCategory: NotificationType;
  setActiveCategory: (cat: NotificationType) => void;
  markAsRead: (id: string, e?: React.MouseEvent) => void;
  markCategoryAsRead: (type: NotificationType) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => Promise<void>;
  loading: boolean;
}

const SupplierNotificationsContext = createContext<SupplierNotificationsContextType | undefined>(undefined);

export const SupplierNotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supplier } = useSupplier();
  const [notifications, setNotifications] = useState<SupplierNotificationItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<NotificationType>('low_stock');
  const [loading, setLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Supplier-isolated read IDs in localStorage
  const [readIds, setReadIds] = useState<string[]>(() => {
    if (!supplier?.id) return [];
    try {
      const stored = localStorage.getItem(`novasats_read_notifs_${supplier.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Reload readIds whenever supplier changes
  useEffect(() => {
    if (!supplier?.id) {
      setReadIds([]);
      setNotifications([]);
      setHasInitialized(false);
      return;
    }
    try {
      const stored = localStorage.getItem(`novasats_read_notifs_${supplier.id}`);
      setReadIds(stored ? JSON.parse(stored) : []);
    } catch {
      setReadIds([]);
    }
  }, [supplier?.id]);

  // Fetch logic with optional quiet background update
  const fetchAllNotifications = useCallback(async (isQuiet = false) => {
    if (!supplier?.id) return;
    if (!isQuiet && !hasInitialized) {
      setLoading(true);
    }

    try {
      const notifs: SupplierNotificationItem[] = [];

      // 1. Fetch supplier's products for Low Stock and Out of Stock
      const { data: products } = await supabase
        .from('products')
        .select('id, name, stock, status')
        .eq('supplier_id', supplier.id);

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

      // 2. Fetch unanswered questions for this supplier
      const questions = await fetchSupplierQuestions(supplier.id);
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
      const reviews = await fetchSupplierReviews(supplier.id);
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
        .eq('supplier_id', supplier.id)
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
      setHasInitialized(true);
    } catch (err) {
      console.warn('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [supplier?.id, hasInitialized]);

  // Initial load only ONCE per session/supplier
  useEffect(() => {
    if (supplier?.id && !hasInitialized) {
      fetchAllNotifications(false);
    }
  }, [supplier?.id, hasInitialized, fetchAllNotifications]);

  // WebSocket / Supabase Realtime Subscription for instant updates without reloads
  useEffect(() => {
    if (!supplier?.id) return;

    const channelName = `supplier-notifs-realtime-${supplier.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products', filter: `supplier_id=eq.${supplier.id}` },
        () => {
          fetchAllNotifications(true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_questions', filter: `supplier_id=eq.${supplier.id}` },
        () => {
          fetchAllNotifications(true);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'product_reviews', filter: `supplier_id=eq.${supplier.id}` },
        () => {
          fetchAllNotifications(true);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_items', filter: `supplier_id=eq.${supplier.id}` },
        () => {
          fetchAllNotifications(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supplier?.id, fetchAllNotifications]);

  // Actions
  const markAsRead = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!supplier?.id) return;
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(`novasats_read_notifs_${supplier.id}`, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  }, [supplier?.id]);

  const markCategoryAsRead = useCallback((type: NotificationType) => {
    if (!supplier?.id) return;
    const catIds = notifications.filter((n) => n.type === type).map((n) => n.id);
    setReadIds((prev) => {
      const next = Array.from(new Set([...prev, ...catIds]));
      try {
        localStorage.setItem(`novasats_read_notifs_${supplier.id}`, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  }, [supplier?.id, notifications]);

  const markAllAsRead = useCallback(() => {
    if (!supplier?.id) return;
    const allIds = notifications.map((n) => n.id);
    const combined = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(combined);
    try {
      localStorage.setItem(`novasats_read_notifs_${supplier.id}`, JSON.stringify(combined));
    } catch (err) {
      console.error(err);
    }
  }, [supplier?.id, notifications, readIds]);

  // Group notifications strictly by category
  const notificationsByCategory = useMemo(() => {
    const map: Record<NotificationType, SupplierNotificationItem[]> = {
      low_stock: [],
      out_of_stock: [],
      question: [],
      review: [],
      sale: [],
    };
    notifications.forEach((item) => {
      if (map[item.type]) {
        map[item.type].push(item);
      }
    });
    return map;
  }, [notifications]);

  // Unread counts per category
  const unreadCounts = useMemo(() => {
    const counts: Record<NotificationType, number> = {
      low_stock: 0,
      out_of_stock: 0,
      question: 0,
      review: 0,
      sale: 0,
    };
    notifications.forEach((n) => {
      if (!readIds.includes(n.id) && counts[n.type] !== undefined) {
        counts[n.type]++;
      }
    });
    return counts;
  }, [notifications, readIds]);

  const totalUnreadCount = useMemo(() => {
    return notifications.filter((n) => !readIds.includes(n.id)).length;
  }, [notifications, readIds]);

  const value = {
    notifications,
    notificationsByCategory,
    unreadCounts,
    totalUnreadCount,
    activeCategory,
    setActiveCategory,
    markAsRead,
    markCategoryAsRead,
    markAllAsRead,
    refreshNotifications: () => fetchAllNotifications(true),
    loading,
  };

  return (
    <SupplierNotificationsContext.Provider value={value}>
      {children}
    </SupplierNotificationsContext.Provider>
  );
};

export const useSupplierNotifications = () => {
  const context = useContext(SupplierNotificationsContext);
  if (!context) {
    throw new Error('useSupplierNotifications must be used within a SupplierNotificationsProvider');
  }
  return context;
};
