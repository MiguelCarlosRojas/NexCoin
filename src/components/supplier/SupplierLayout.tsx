import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSupplier } from '../../context/SupplierContext';
import { Blobatar } from '../ui/blobatar';
import { parseBlobatar } from '../../lib/blobatarHelper';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart3,
  Boxes,
  Users,
  User,
  Store,
  LogOut,
  Menu as MenuIcon,
  X,
  Bitcoin,
  ChevronDown,
  MessageSquare,
  Star
} from 'lucide-react';

interface SupplierLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const SupplierLayout: React.FC<SupplierLayoutProps> = ({ children, title, subtitle }) => {
  const { supplier, logout } = useSupplier();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/proveedores/logout');
  };

  const navItems = [
    { name: 'Dashboard', path: '/proveedores/dashboard', icon: LayoutDashboard },
    { name: 'Mis Productos', path: '/proveedores/productos', icon: Package },
    { name: 'Preguntas de Clientes', path: '/proveedores/preguntas', icon: MessageSquare },
    { name: 'Calificaciones & Reseñas', path: '/proveedores/calificaciones', icon: Star },
    { name: 'Ventas & Vouchers', path: '/proveedores/ventas', icon: ShoppingBag },
    { name: 'Mi Perfil & Icono', path: '/proveedores/perfil', icon: User },
  ];

  const reportItems = [
    { name: 'Reporte de Ventas', path: '/proveedores/reportes/ventas', icon: BarChart3 },
    { name: 'Reporte de Inventario', path: '/proveedores/reportes/inventario', icon: Boxes },
    { name: 'Reporte de Clientes', path: '/proveedores/reportes/clientes', icon: Users },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex font-sans w-full relative">
      
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Lateral Navigation Sidebar with dedicated lateral scrollbar */}
      <aside
        className={`fixed lg:sticky top-0 inset-y-0 left-0 z-50 w-72 min-w-[18rem] max-w-[18rem] shrink-0 bg-[#0a0f1d] border-r border-white/[0.08] flex flex-col justify-between transition-transform duration-300 ease-in-out h-screen lateral-scrollbar overflow-y-auto ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Sidebar Header / Brand */}
          <div className="h-20 px-6 border-b border-white/[0.08] flex items-center justify-between sticky top-0 bg-[#0a0f1d]/95 backdrop-blur z-10">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Bitcoin className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white flex items-center gap-1">
                  Nex<span className="text-amber-500">Coin</span>
                </span>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block -mt-1">
                  Portal Proveedores
                </span>
              </div>
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Supplier Info Badge */}
          {supplier && (() => {
            const parsed = parseBlobatar(supplier.avatar_url, supplier.company_name || 'NexCoin');
            return (
              <Link
                to="/proveedores/perfil"
                className="mx-4 my-4 p-3.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-2xl flex items-center gap-3 transition group"
                title="Personalizar mi perfil e icono Blobatar"
              >
                <Blobatar
                  name={parsed.seed}
                  blobatar={{
                    expression: parsed.expression,
                    animate: parsed.animProp,
                  }}
                  className={`w-10 h-10 ${parsed.shapeClass} border ${parsed.borderClass} ${parsed.glowClass} group-hover:scale-105 transition shrink-0`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white group-hover:text-amber-400 transition truncate">{supplier.company_name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{supplier.email}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Proveedor Verificado
                  </span>
                </div>
              </Link>
            );
          })()}

          {/* Nav Items */}
          <nav className="px-4 space-y-1.5 mt-2">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Gestión Principal
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    active
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Reports Accordion */}
            <div className="pt-3">
              <button
                type="button"
                onClick={() => setReportsOpen(!reportsOpen)}
                className="w-full flex items-center justify-between px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 hover:text-white transition"
              >
                <span>Reportes Analíticos</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${reportsOpen ? 'rotate-180' : ''}`} />
              </button>

              {reportsOpen && (
                <div className="space-y-1 mt-1 pl-1">
                  {reportItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                          active
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <Store className="w-4 h-4 text-amber-400" />
            <span>Ir a la Tienda</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#060911] w-full overflow-x-hidden">
        
        {/* Top Navbar */}
        <header className="h-16 sm:h-20 bg-[#0a0f1d]/85 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-10 lg:px-12 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 shrink-0"
              aria-label="Abrir menú"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-2xl font-black text-white tracking-tight font-heading truncate">{title}</h1>
              {subtitle && <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate hidden sm:block">{subtitle}</p>}
            </div>
          </div>
        </header>

        {/* Content (Full-width edge-to-edge container) */}
        <main className="p-3.5 sm:p-8 lg:p-12 flex-1 w-full max-w-full">
          {children}
        </main>

      </div>

    </div>
  );
};
