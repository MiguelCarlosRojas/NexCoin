import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SupplierProvider } from './context/SupplierContext';
import { WalletProvider } from './context/WalletContext';
import { CartProvider } from './context/CartContext';

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
