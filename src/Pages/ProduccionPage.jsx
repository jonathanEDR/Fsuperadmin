import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Importar componentes de Producción
import ProduccionIndex from '../components/Produccion/ProduccionIndex';
import GestionIngredientes from '../components/Produccion/Ingredientes/GestionIngredientes';
import FormularioIngrediente from '../components/Produccion/Ingredientes/FormularioIngrediente';
import AjusteInventario from '../components/Produccion/Ingredientes/AjusteInventario';
import MovimientosIngrediente from '../components/Produccion/Ingredientes/MovimientosIngrediente';
import GestionRecetas from '../components/Produccion/Recetas/GestionRecetas';
import FormularioReceta from '../components/Produccion/Recetas/FormularioReceta';
import VistaReceta from '../components/Produccion/Recetas/VistaReceta';
import GestionProduccion from '../components/Produccion/Produccion/GestionProduccion';
import NuevaProduccion from '../components/Produccion/Produccion/NuevaProduccion';
import DetalleProduccion from '../components/Produccion/Produccion/DetalleProduccion';
import GestionMovimientos from '../components/Produccion/Movimientos/GestionMovimientos';

const ProduccionPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Página principal del módulo */}
        <Route path="/" element={<ProduccionIndex />} />
        
        {/* Rutas de Ingredientes */}
        <Route path="/ingredientes" element={<GestionIngredientes />} />
        <Route path="/ingredientes/nuevo" element={<FormularioIngrediente />} />
        <Route path="/ingredientes/editar/:id" element={<FormularioIngrediente />} />
        <Route path="/ingredientes/ajuste/:id" element={<AjusteInventario />} />
        <Route path="/ingredientes/movimientos/:id" element={<MovimientosIngrediente />} />
        
        {/* Rutas de Recetas */}
        <Route path="/recetas" element={<GestionRecetas />} />
        <Route path="/recetas/nueva" element={<FormularioReceta />} />
        <Route path="/recetas/editar/:id" element={<FormularioReceta />} />
        <Route path="/recetas/ver/:id" element={<VistaReceta />} />
        
        {/* Rutas de Producción */}
        <Route path="/produccion" element={<GestionProduccion />} />
        <Route path="/produccion/nueva" element={<NuevaProduccion />} />
        <Route path="/produccion/detalle/:id" element={<DetalleProduccion />} />
        
        {/* Rutas de Movimientos */}
        <Route path="/movimientos" element={<GestionMovimientos />} />
        
        {/* Redirigir rutas no encontradas al índice */}
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </div>
  );
};

export default ProduccionPage;
