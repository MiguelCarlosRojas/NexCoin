import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useSupplierNotifications,
  NotificationType
} from '../../context/SupplierNotificationsContext';
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
  X,
  Radio
} from 'lucide-react';

interface SupplierNotificationsDropdownProps {
  supplierId?: string;
}

export const SupplierNotificationsDropdown: React.FC<SupplierNotificationsDropdownProps> = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notificationsByCategory,
    unreadCounts,
    totalUnreadCount,
    activeCategory,
    setActiveCategory,
    markAsRead,
    markCategoryAsRead,
    markAllAsRead,
    loading
  } = useSupplierNotifications();

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

  const categoryConfigs: Record<
    NotificationType,
    {
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      colorClass: string;
      badgeClass: string;
      desc: string;
    }
  > = {
    low_stock: {
      label: 'Por Agotarse',
      icon: AlertTriangle,
      colorClass: 'text-amber-400',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      desc: 'Productos con stock crítico (1 a 5 unidades restantes)',
    },
    out_of_stock: {
      label: 'Agotados',
      icon: Ban,
      colorClass: 'text-rose-400',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      desc: 'Productos con 0 unidades que requieren reabastecimiento',
    },
    question: {
      label: 'Preguntas',
      icon: MessageSquare,
      colorClass: 'text-sky-400',
      badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      desc: 'Preguntas realizadas por compradores pendientes de respuesta',
    },
    review: {
      label: 'Reseñas',
      icon: Star,
      colorClass: 'text-yellow-400',
      badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      desc: 'Nuevas opiniones y valoraciones dejadas en tus productos',
    },
    sale: {
      label: 'Ventas',
      icon: ShoppingBag,
      colorClass: 'text-emerald-400',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      desc: 'Órdenes de compra y vouchers liquidados en Bitcoin',
    },
  };

  const currentConf = categoryConfigs[activeCategory];
  const currentItems = notificationsByCategory[activeCategory] || [];
  const currentUnread = unreadCounts[activeCategory] || 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/[0.08] transition shadow-sm active:scale-95"
        title="Centro de Notificaciones en Tiempo Real (WebSocket)"
      >
        <Bell className="w-5 h-5 text-slate-300 hover:text-amber-400 transition" />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-[10px] font-black text-slate-950 shadow-lg shadow-amber-500/50 animate-pulse">
            {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel (Separated by categories) */}
      {isOpen && (
        <div className="absolute right-0 sm:right-auto sm:left-auto lg:right-0 mt-3 w-80 sm:w-[440px] max-w-[calc(100vw-24px)] bg-[#0a0f1d] border border-white/[0.12] rounded-2xl shadow-2xl shadow-black/90 z-50 overflow-hidden flex flex-col max-h-[85vh]">
          
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 via-[#0e1628] to-slate-900 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>Notificaciones</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Radio className="w-2.5 h-2.5 animate-pulse" />
                    En Vivo
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  {totalUnreadCount === 0 ? 'Sin alertas nuevas' : `${totalUnreadCount} sin leer`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {totalUnreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition"
                  title="Marcar todas como leídas"
                >
                  Leer todas
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

          {/* Categorías Separadas (Pestañas Independientes) */}
          <div className="p-2 bg-[#060911] border-b border-white/[0.08] grid grid-cols-5 gap-1 text-[10px]">
            {(Object.keys(categoryConfigs) as NotificationType[]).map((catKey) => {
              const conf = categoryConfigs[catKey];
              const Icon = conf.icon;
              const unread = unreadCounts[catKey];
              const isSelected = activeCategory === catKey;

              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setActiveCategory(catKey)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition relative ${
                    isSelected
                      ? 'bg-white/[0.1] text-white shadow-sm border border-white/[0.15]'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                  title={conf.desc}
                >
                  <Icon className={`w-3.5 h-3.5 mb-0.5 ${conf.colorClass}`} />
                  <span className="truncate max-w-full font-bold text-[9px]">{conf.label}</span>
                  {unread > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center shadow">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Category Banner / Separator info */}
          <div className="px-4 py-2 bg-slate-950/60 border-b border-white/[0.04] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`p-1 rounded-lg border ${currentConf.badgeClass}`}>
                <currentConf.icon className="w-3.5 h-3.5" />
              </span>
              <div>
                <span className="font-bold text-white text-xs">{currentConf.label}</span>
                <span className="text-[10px] text-slate-400 ml-1.5">
                  ({currentItems.length} {currentItems.length === 1 ? 'registro' : 'registros'})
                </span>
              </div>
            </div>

            {currentUnread > 0 && (
              <button
                type="button"
                onClick={() => markCategoryAsRead(activeCategory)}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-bold hover:underline"
              >
                Marcar categoría leída
              </button>
            )}
          </div>

          {/* Listado específico de la categoría seleccionada */}
          <div className="flex-1 overflow-y-auto lateral-scrollbar divide-y divide-white/[0.05] p-2 space-y-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Cargando notificaciones...
              </div>
            ) : currentItems.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-900 border border-white/[0.08] flex items-center justify-center text-slate-500">
                  <CheckCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-xs font-semibold text-slate-300">
                  Sin novedades en {currentConf.label}
                </p>
                <p className="text-[11px] text-slate-500 max-w-[240px] mx-auto">
                  {currentConf.desc}
                </p>
              </div>
            ) : (
              currentItems.map((notif) => {
                const isRead = unreadCounts[notif.type] === 0 || false; // tracked dynamically
                const Icon = currentConf.icon;

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      markAsRead(notif.id);
                      setIsOpen(false);
                      navigate(notif.link);
                    }}
                    className="p-3 rounded-xl transition cursor-pointer flex items-start gap-3 bg-slate-900/60 hover:bg-slate-900 border border-white/[0.06] group relative"
                  >
                    {/* Category Icon */}
                    <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${currentConf.badgeClass}`}>
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
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            notif.metadata.stock === 0
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {notif.metadata.stock === 0 ? 'Sin existencias (0 uds.)' : `Stock: ${notif.metadata.stock} unidades`}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/[0.04]">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {notif.timestamp}
                        </span>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {/* Mark as read button */}
                          <button
                            type="button"
                            onClick={(e) => markAsRead(notif.id, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition"
                            title="Marcar como leída"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>

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
