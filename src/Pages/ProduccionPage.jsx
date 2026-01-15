import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuickPermissions } from '../hooks/useProduccionPermissions';

// Importar componentes de Producción
import ProduccionIndex from '../components/Produccion/AccesosRapidosProduccion';
import CatalogoProduccion from '../components/Produccion/Catalogo/CatalogoProduccion';
import GestionIngredientes from '../components/Produccion/Ingredientes/GestionIngredientes';
import FormularioIngredienteMejorado from '../components/Produccion/Ingredientes/FormularioIngredienteMejorado';
import AjusteInventario from '../components/Produccion/Ingredientes/AjusteInventario';
import MovimientosIngrediente from '../components/Produccion/Ingredientes/MovimientosIngrediente';
import GestionMateriales from '../components/Produccion/Materiales/GestionMateriales';
import FormularioMaterialMejorado from '../components/Produccion/Materiales/FormularioMaterialMejorado';
import AjusteMaterial from '../components/Produccion/Materiales/AjusteMaterial';
import MovimientosMaterial from '../components/Produccion/Materiales/MovimientosMaterial';
import GestionRecetas from '../components/Produccion/Recetas/GestionRecetas';
import FormularioReceta from '../components/Produccion/Recetas/FormularioReceta';
import VistaReceta from '../components/Produccion/Recetas/VistaReceta';
import GestionProduccion from '../components/Produccion/Produccion/GestionProduccion';
import NuevaProduccion from '../components/Produccion/Produccion/NuevaProduccion';
import GestionResiduos from '../components/Produccion/Residuos/GestionResiduos';
import GestionMovimientos from '../components/Produccion/Movimientos/GestionMovimientos';
import GraficosProduccionPage from '../components/Produccion/Graficos/GraficosProduccionPage';

// Componente para rutas protegidas por permisos
const ProtectedRoute = ({ children, hasPermission, redirectTo = "/produccion" }) => {
  if (!hasPermission) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
};

// Componente de acceso denegado
const AccesoDenegado = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
    <div className="text-6xl mb-4">🔒</div>
    <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Restringido</h2>
    <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta sección.</p>
    <a 
      href="/produccion" 
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
    >
      Volver al inicio
    </a>
  </div>
);

const ProduccionPage = () => {
  // Obtener permisos del usuario actual
  const { 
    canManageIngredientes, 
    canManageMateriales, 
    canManageRecetas,
    canAdjustInventory
  } = useQuickPermissions();

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Página principal del módulo - acceso para todos */}
        <Route path="/" element={<ProduccionIndex />} />
        
        {/* Rutas del Catálogo - acceso para todos */}
        <Route path="/catalogo" element={<CatalogoProduccion />} />
        
        {/* Rutas de Ingredientes */}
        <Route path="/ingredientes" element={<GestionIngredientes />} />
        {/* Solo super_admin puede crear/editar ingredientes */}
        <Route 
          path="/ingredientes/nuevo" 
          element={
            <ProtectedRoute hasPermission={canManageIngredientes}>
              <FormularioIngredienteMejorado />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ingredientes/editar/:id" 
          element={
            <ProtectedRoute hasPermission={canManageIngredientes}>
              <FormularioIngredienteMejorado />
            </ProtectedRoute>
          } 
        />
        {/* Admin o superior puede ajustar inventario */}
        <Route 
          path="/ingredientes/ajuste/:id" 
          element={
            <ProtectedRoute hasPermission={canAdjustInventory}>
              <AjusteInventario />
            </ProtectedRoute>
          } 
        />
        <Route path="/ingredientes/movimientos/:id" element={<MovimientosIngrediente />} />
        
        {/* Rutas de Materiales */}
        <Route path="/materiales" element={<GestionMateriales />} />
        {/* Solo super_admin puede crear/editar materiales */}
        <Route 
          path="/materiales/nuevo" 
          element={
            <ProtectedRoute hasPermission={canManageMateriales}>
              <FormularioMaterialMejorado />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/materiales/editar/:id" 
          element={
            <ProtectedRoute hasPermission={canManageMateriales}>
              <FormularioMaterialMejorado />
            </ProtectedRoute>
          } 
        />
        {/* Admin o superior puede ajustar inventario */}
        <Route 
          path="/materiales/ajuste/:id" 
          element={
            <ProtectedRoute hasPermission={canAdjustInventory}>
              <AjusteMaterial />
            </ProtectedRoute>
          } 
        />
        <Route path="/materiales/movimientos/:id" element={<MovimientosMaterial />} />
        
        {/* Rutas de Recetas */}
        <Route path="/recetas" element={<GestionRecetas />} />
        {/* Admin o superior puede crear/editar recetas */}
        <Route 
          path="/recetas/nueva" 
          element={
            <ProtectedRoute hasPermission={canManageRecetas}>
              <FormularioReceta />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/recetas/editar/:id" 
          element={
            <ProtectedRoute hasPermission={canManageRecetas}>
              <FormularioReceta />
            </ProtectedRoute>
          } 
        />
        <Route path="/recetas/ver/:id" element={<VistaReceta />} />
        
        {/* Rutas de Producción - acceso para todos */}
        <Route path="/produccion" element={<GestionProduccion />} />
        <Route path="/produccion/nueva" element={<NuevaProduccion />} />
        
        {/* Rutas de Gráficos - acceso para todos */}
        <Route path="/graficos" element={<GraficosProduccionPage />} />
        
        {/* Rutas de Residuos - acceso para todos */}
        <Route path="/residuos" element={<GestionResiduos />} />
        
        {/* Rutas de Movimientos - acceso para todos (acciones controladas en componente) */}
        <Route path="/movimientos" element={<GestionMovimientos />} />
        
        {/* Ruta de acceso denegado */}
        <Route path="/acceso-denegado" element={<AccesoDenegado />} />
        
        {/* Redirigir rutas no encontradas al índice */}
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </div>
  );
};

export default ProduccionPage;
