import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { useUser } from '@clerk/clerk-react';
import { useAuthCleanup } from './hooks/useAuthCleanup';

// Importar componentes
import Home from './Pages/Home';
import { Login, Signup as Register } from './components/auth';
import SinAcceso from './components/auth/SinAcceso';
import Dashboard from './Pages/Dashboard';
import RoleBasedRedirect from './components/auth/RoleBasedRedirect';
import { SuperAdminDashboard, AdminDashboardLayout } from './components/layout';
import AdminDashboard from './components/layout/dashboards/AdminDashboard';
import PagosRealizadosPage from './Pages/PagosRealizadosPage';
import BienvenidaPage from './Pages/BienvenidaPage';
import UsuariosPage from './Pages/UsuariosPage';
import ProductosPage from './Pages/ProductosPage';
import CategoriasPage from './Pages/CategoriasPage';
import VentasPage from './Pages/VentasPage';
import CobrosPage from './Pages/CobrosPage';
import DevolucionesPage from './Pages/DevolucionesPage';
import PersonalPage from './Pages/PersonalPage';
import NotasPage from './Pages/NotasPage';
import PerfilPage from './Pages/PerfilPage';
import UserDashboardLayout from './components/layout/dashboards/UserDashboardLayout';
import CajaPage from './Pages/CajaPage';
import ProduccionPage from './Pages/ProduccionPage';
import CatalogoPage from './Pages/CatalogoPage';

// Importar páginas del módulo de finanzas
import FinanzasPage from './Pages/FinanzasPage';
import { MovimientosCajaFinanzas } from './components/Finanzas/MovimientoCaja';
import CuentasBancariasPage from './Pages/CuentasBancariasPage';
import PrestamosPage from './Pages/PrestamosPage';
import GarantiasPage from './Pages/GarantiasPage';
import PagosFinanciamientoPage from './Pages/PagosFinanciamientoPage';

// Componente para proteger rutas que requieren autenticación
function ProtectedRoute({ children }) {
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <Navigate to="/login" replace />
      </SignedOut>
    </>
  );
}

// Componente para rutas que solo usuarios no autenticados pueden ver
function PublicRoute({ children }) {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
            {/* Rutas públicas */}
            <Route 
              path="/" 
              element={
                <PublicRoute>
                  <Home />
                </PublicRoute>
              } 
            />
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            
            {/* Ruta para usuarios dados de baja */}
            <Route 
              path="/sin-acceso" 
              element={
                <ProtectedRoute>
                  <SinAcceso />
                </ProtectedRoute>
              } 
            />
            
            {/* Rutas protegidas */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              } 
            />
            {/* AdminDashboard como layout persistente */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<BienvenidaPage />} />
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="notas" element={<NotasPage />} />
              <Route path="productos" element={<ProductosPage />} />
              <Route path="caja" element={<CajaPage />} />
              <Route path="categorias" element={<CategoriasPage />} />
              <Route path="ventas" element={<VentasPage />} />
              <Route path="cobros" element={<CobrosPage />} />
              <Route path="devoluciones" element={<DevolucionesPage />} />
              <Route path="catalogo" element={<CatalogoPage />} />
              <Route path="pagos-realizados" element={<PagosRealizadosPage />} />
              <Route path="personal" element={<PersonalPage />} />
              <Route path="perfil" element={<PerfilPage />} />
              <Route path="produccion/*" element={<ProduccionPage />} />
              {/* Módulo de Finanzas - ELIMINADO del Admin */}
            </Route>
            
            {/* SuperAdminDashboard como layout persistente */}
            <Route 
              path="/super-admin"
              element={
                <ProtectedRoute>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<BienvenidaPage />} />
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="usuarios" element={<UsuariosPage />} />
              <Route path="productos" element={<ProductosPage />} />
              <Route path="ventas" element={<VentasPage />} />
              <Route path="cobros" element={<CobrosPage />} />
              <Route path="devoluciones" element={<DevolucionesPage />} />
              <Route path="catalogo" element={<CatalogoPage />} />
              <Route path="pagos-realizados" element={<PagosRealizadosPage />} />
              <Route path="personal" element={<PersonalPage />} />
              <Route path="notas" element={<NotasPage />} />
              <Route path="perfil" element={<PerfilPage />} />
              <Route path="caja" element={<CajaPage />} />
              <Route path="produccion/*" element={<ProduccionPage />} />
              {/* Rutas del módulo de finanzas - SOLO PARA SUPER ADMIN */}
              <Route path="finanzas" element={<FinanzasPage />} />
              <Route path="finanzas/movimientos-caja" element={<MovimientosCajaFinanzas />} />
              <Route path="finanzas/cuentas-bancarias" element={<CuentasBancariasPage />} />
              <Route path="finanzas/prestamos" element={<PrestamosPage />} />
              <Route path="finanzas/garantias" element={<GarantiasPage />} />
              <Route path="finanzas/pagos-financiamiento" element={<PagosFinanciamientoPage />} />
            </Route>
            
            {/* UserDashboard como layout persistente */}
            <Route 
              path="/user" 
              element={
                <ProtectedRoute>
                  <UserDashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<NotasPage />} />
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="notas" element={<NotasPage />} />
              <Route path="ventas" element={<VentasPage />} />
              <Route path="catalogo" element={<CatalogoPage />} />
              <Route path="perfil" element={<PerfilPage />} />
            </Route>
            
            {/* Ruta por defecto - redirige a home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
  );
}

export default App;