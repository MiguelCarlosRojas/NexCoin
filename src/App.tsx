import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SupplierProvider } from './context/SupplierContext';
import { WalletProvider } from './context/WalletContext';
import { CartProvider } from './context/CartContext';

// Dynamic Route Title Updater Component
const RouteTitleUpdater: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    const titleMap: Record<string, string> = {
      '/': 'NexCoin | Marketplace Web3 & Pagos Bitcoin',
      '/tienda': 'Catálogo de Productos | NexCoin Store',
      '/trabaja-con-nosotros': 'Trabaja con Nosotros | NexCoin Marketplace',
      '/nosotros': 'Sobre Nosotros | NexCoin Ecosistema',
      '/sobre-nosotros': 'Sobre Nosotros | NexCoin Ecosistema',
      '/nuestro-proposito': 'Nuestro Propósito | NexCoin',
      '/promociones': 'Promociones & Ofertas | NexCoin',
      '/ayuda': 'Centro de Ayuda | NexCoin',
      '/servicio-al-cliente': 'Servicio al Cliente | NexCoin',
      '/reclamos': 'Libro de Reclamaciones | NexCoin',
      '/libro-de-reclamaciones': 'Libro de Reclamaciones | NexCoin',
      '/terminos-y-condiciones': 'Términos y Condiciones | NexCoin',
      '/como-cuidamos-tu-privacidad': 'Aviso de Privacidad | NexCoin',
      '/privacidad': 'Política de Privacidad | NexCoin',
      '/accesibilidad': 'Declaración de Accesibilidad | NexCoin',
      '/legales-campanas': 'Legales de Campañas | NexCoin',
      '/politicas-generales': 'Políticas Generales | NexCoin',
      '/politica-cookies': 'Política de Cookies | NexCoin',
      '/proteccion-de-datos': 'Protección de Datos | NexCoin',
      '/proveedores/login': 'Iniciar Sesión | Portal Proveedores',
      '/login': 'Iniciar Sesión | Portal Proveedores',
      '/proveedores/logout': 'Sesión Finalizada | NexCoin',
      '/proveedores/sesion-cerrada': 'Sesión Finalizada | NexCoin',
      '/proveedores': 'Panel Principal | Portal Proveedores',
      '/proveedores/dashboard': 'Panel de Control | Portal Proveedores',
      '/proveedores/productos': 'Mis Productos & Inventario | Portal Proveedores',
      '/proveedores/preguntas': 'Preguntas de Clientes | Portal Proveedores',
      '/proveedores/calificaciones': 'Calificaciones & Reseñas | Portal Proveedores',
      '/proveedores/ventas': 'Ventas & Vouchers | Portal Proveedores',
      '/proveedores/perfil': 'Mi Perfil & Configuración | Portal Proveedores',
      '/proveedores/reportes/ventas': 'Reporte de Ventas | Portal Proveedores',
      '/proveedores/reportes/inventario': 'Reporte de Inventario | Portal Proveedores',
      '/proveedores/reportes/clientes': 'Reporte de Clientes | Portal Proveedores',
    };

    if (titleMap[path]) {
      document.title = titleMap[path];
    } else if (path.startsWith('/producto/')) {
      if (!document.title.includes(' | NexCoin Marketplace')) {
        document.title = 'Detalle de Producto | NexCoin';
      }
    } else if (path.startsWith('/proveedores/')) {
      document.title = 'Portal Proveedores | NexCoin';
    } else {
      document.title = 'NexCoin | Marketplace Web3 & Pagos Bitcoin';
    }
  }, [location]);

  return null;
};

// Store Components
import { StoreLanding } from './components/store/StoreLanding';
import { ProductDetailPage } from './components/store/ProductDetailPage';

// Dedicated Separate Pages (Each in its own page, completely separate)
import { TrabajaConNosotrosPage } from './components/store/pages/TrabajaConNosotrosPage';
import { SobreNosotrosPage } from './components/store/pages/SobreNosotrosPage';
import { NuestroPropositoPage } from './components/store/pages/NuestroPropositoPage';
import { PromocionesPage } from './components/store/pages/PromocionesPage';
import { AyudaPage } from './components/store/pages/AyudaPage';
import { ServicioClientePage } from './components/store/pages/ServicioClientePage';
import { ReclamosPage } from './components/store/pages/ReclamosPage';
import { LibroReclamacionesPage } from './components/store/pages/LibroReclamacionesPage';
import { TerminosCondicionesPage } from './components/store/pages/TerminosCondicionesPage';
import { PrivacidadPage } from './components/store/pages/PrivacidadPage';
import { AccesibilidadPage } from './components/store/pages/AccesibilidadPage';
import { LegalesCampanasPage } from './components/store/pages/LegalesCampanasPage';
import { PoliticasGeneralesPage } from './components/store/pages/PoliticasGeneralesPage';
import { PoliticaCookiesPage } from './components/store/pages/PoliticaCookiesPage';
import { ProteccionDatosPage } from './components/store/pages/ProteccionDatosPage';

// Supplier Portal Components
import { SupplierLogin } from './components/supplier/SupplierLogin';
import { SupplierLogout } from './components/supplier/SupplierLogout';
import { SupplierProtectedRoute } from './components/supplier/SupplierProtectedRoute';
import { SupplierDashboard } from './components/supplier/SupplierDashboard';
import { SupplierProducts } from './components/supplier/SupplierProducts';
import { SupplierQuestions } from './components/supplier/SupplierQuestions';
import { SupplierReviews } from './components/supplier/SupplierReviews';
import { SupplierOrders } from './components/supplier/SupplierOrders';
import { SupplierProfile } from './components/supplier/SupplierProfile';
import { SupplierSalesReport } from './components/supplier/reports/SupplierSalesReport';
import { SupplierInventoryReport } from './components/supplier/reports/SupplierInventoryReport';
import { SupplierCustomersReport } from './components/supplier/reports/SupplierCustomersReport';
import { Web3AppKitProvider } from './context/Web3AppKitProvider';
import { useSupplier } from './context/SupplierContext';

// Guest-only Route (Redirects authenticated suppliers away from login to dashboard)
const SupplierGuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supplier } = useSupplier();
  if (supplier) {
    return <Navigate to="/proveedores/dashboard" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Web3AppKitProvider>
      <SupplierProvider>
        <WalletProvider>
          <CartProvider>
            <Router>
              <RouteTitleUpdater />
              <Routes>
              {/* Store Landing Page (Default Home) */}
              <Route path="/" element={<StoreLanding />} />
              <Route path="/tienda" element={<StoreLanding />} />

              {/* Dedicated Product Detail Page with URL */}
              <Route path="/producto/:id" element={<ProductDetailPage />} />

              {/* Dedicated Separate Pages: Nosotros */}
              <Route path="/trabaja-con-nosotros" element={<TrabajaConNosotrosPage />} />
              <Route path="/nosotros" element={<SobreNosotrosPage />} />
              <Route path="/sobre-nosotros" element={<SobreNosotrosPage />} />
              <Route path="/nuestro-proposito" element={<NuestroPropositoPage />} />
              <Route path="/promociones" element={<PromocionesPage />} />

              {/* Dedicated Separate Pages: Servicio al cliente & Ayuda */}
              <Route path="/ayuda" element={<AyudaPage />} />
              <Route path="/servicio-al-cliente" element={<ServicioClientePage />} />
              <Route path="/reclamos" element={<ReclamosPage />} />
              <Route path="/libro-de-reclamaciones" element={<LibroReclamacionesPage />} />

              {/* Dedicated Separate Pages: Legales y Políticas */}
              <Route path="/terminos-y-condiciones" element={<TerminosCondicionesPage />} />
              <Route path="/como-cuidamos-tu-privacidad" element={<PrivacidadPage />} />
              <Route path="/privacidad" element={<PrivacidadPage />} />
              <Route path="/accesibilidad" element={<AccesibilidadPage />} />
              <Route path="/legales-campanas" element={<LegalesCampanasPage />} />
              <Route path="/politicas-generales" element={<PoliticasGeneralesPage />} />
              <Route path="/politica-cookies" element={<PoliticaCookiesPage />} />
              <Route path="/proteccion-de-datos" element={<ProteccionDatosPage />} />


              {/* Supplier Auth & Logout */}
              <Route
                path="/proveedores/login"
                element={
                  <SupplierGuestRoute>
                    <SupplierLogin />
                  </SupplierGuestRoute>
                }
              />
              <Route path="/login" element={<Navigate to="/proveedores/login" replace />} />
              <Route path="/logout" element={<Navigate to="/proveedores/logout" replace />} />
              <Route path="/proveedores/logout" element={<SupplierLogout />} />
              <Route path="/proveedores/sesion-cerrada" element={<SupplierLogout />} />

              {/* Supplier Portal Protected Routes */}
              <Route
                path="/proveedores"
                element={
                  <SupplierProtectedRoute>
                    <SupplierDashboard />
                  </SupplierProtectedRoute>
                }
              />
              <Route
                path="/proveedores/dashboard"
                element={
                  <SupplierProtectedRoute>
                    <SupplierDashboard />
                  </SupplierProtectedRoute>
                }
              />
              <Route
                path="/proveedores/productos"
                element={
                  <SupplierProtectedRoute>
                    <SupplierProducts />
                  </SupplierProtectedRoute>
                }
              />
              <Route
                path="/proveedores/productos/nuevo"
                element={<Navigate to="/proveedores/productos" replace />}
              />
              <Route
                path="/proveedores/productos/editar/:id"
                element={<Navigate to="/proveedores/productos" replace />}
              />
              <Route
                path="/proveedores/ventas"
                element={
                  <SupplierProtectedRoute>
                    <SupplierOrders />
                  </SupplierProtectedRoute>
                }
              />
              <Route
                path="/proveedores/preguntas"
                element={
                  <SupplierProtectedRoute>
                    <SupplierQuestions />
                  </SupplierProtectedRoute>
                }
              />
              <Route
                path="/proveedores/calificaciones"
                element={
                  <SupplierProtectedRoute>
                    <SupplierReviews />
                  </SupplierProtectedRoute>
                }
              />
              <Route
                path="/proveedores/perfil"
                element={
                  <SupplierProtectedRoute>
                    <SupplierProfile />
                  </SupplierProtectedRoute>
                }
              />

              {/* Supplier Reports in Separate Pages */}
              <Route
                path="/proveedores/reportes/ventas"
                element={
                  <SupplierProtectedRoute>
                    <SupplierSalesReport />
                  </SupplierProtectedRoute>
                }
              />
              <Route
                path="/proveedores/reportes/inventario"
                element={
                  <SupplierProtectedRoute>
                    <SupplierInventoryReport />
                  </SupplierProtectedRoute>
                }
              />
              <Route
                path="/proveedores/reportes/clientes"
                element={
                  <SupplierProtectedRoute>
                    <SupplierCustomersReport />
                  </SupplierProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </CartProvider>
      </WalletProvider>
    </SupplierProvider>
  </Web3AppKitProvider>
  );
};

export default App;
