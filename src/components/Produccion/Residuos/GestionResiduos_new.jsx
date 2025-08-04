import React, { useState, useEffect } from 'react';
import { residuoService } from '../../../services/residuoService';
import FormularioResiduo from './FormularioResiduo';
import TablaResiduos from './TablaResiduos';
import BreadcrumbProduccion from '../BreadcrumbProduccion';

const GestionResiduos = () => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [residuos, setResiduos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    tipoProducto: '',
    motivo: '',
    pagina: 1,
    limite: 10
  });

  useEffect(() => {
    cargarResiduos();
  }, [filtros]);

  const cargarResiduos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await residuoService.obtenerResiduos(filtros);
      setResiduos(data.residuos || []);
      setTotalPaginas(data.totalPaginas || 1);
    } catch (error) {
      console.error('Error al cargar residuos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const manejarResiduoRegistrado = () => {
    setMostrarFormulario(false);
    cargarResiduos();
  };

  const manejarEliminarResiduo = async (residuoId) => {
    if (!window.confirm('¿Estás seguro de eliminar este residuo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await residuoService.eliminarResiduo(residuoId);
      cargarResiduos(); // Recargar la lista
    } catch (error) {
      console.error('Error al eliminar residuo:', error);
      alert('Error al eliminar el residuo: ' + error.message);
    }
  };

  const manejarCambiarPagina = (nuevaPagina) => {
    setFiltros(prev => ({ ...prev, pagina: nuevaPagina }));
  };

  const manejarCambiarFiltro = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor,
      pagina: 1 // Resetear a primera página cuando cambian los filtros
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: '',
      fechaFin: '',
      tipoProducto: '',
      motivo: '',
      pagina: 1,
      limite: 10
    });
  };

  if (loading && residuos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando gestión de residuos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <BreadcrumbProduccion 
              pagina="residuos"
              titulo="Gestión de Residuos y Malogrados"
            />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Formulario modal */}
        {mostrarFormulario && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <FormularioResiduo 
                onCerrar={() => setMostrarFormulario(false)}
                onResiduoRegistrado={manejarResiduoRegistrado}
              />
            </div>
          </div>
        )}

        {/* Título y acciones */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🗑️ Gestión de Residuos</h1>
            <p className="mt-1 text-sm text-gray-500">
              Registro y control de productos dañados, vencidos o malogrados
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setMostrarFormulario(true)}
              className="w-full sm:w-auto inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <span className="mr-2">📝</span>
              Registrar Residuo
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error al cargar datos
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => cargarResiduos()}
                    className="bg-red-100 px-2 py-1 rounded text-red-800 hover:bg-red-200 text-sm"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🔍 Filtros</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Fecha Inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => manejarCambiarFiltro('fechaInicio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Fecha Fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => manejarCambiarFiltro('fechaFin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tipo de Producto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Producto
              </label>
              <select
                value={filtros.tipoProducto}
                onChange={(e) => manejarCambiarFiltro('tipoProducto', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los tipos</option>
                <option value="ingrediente">Ingrediente</option>
                <option value="material">Material</option>
                <option value="receta">Receta</option>
                <option value="produccion">Producción</option>
              </select>
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo
              </label>
              <select
                value={filtros.motivo}
                onChange={(e) => manejarCambiarFiltro('motivo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los motivos</option>
                <option value="vencido">Vencido/Caducado</option>
                <option value="dañado">Dañado/Defectuoso</option>
                <option value="merma">Merma</option>
                <option value="error_proceso">Error en Proceso</option>
                <option value="otros">Otros</option>
              </select>
            </div>
          </div>

          {/* Botones de filtro */}
          <div className="mt-4 flex space-x-2">
            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Tabla de residuos */}
        <TablaResiduos
          residuos={residuos}
          loading={loading}
          onEliminar={manejarEliminarResiduo}
          filtros={filtros}
          totalPaginas={totalPaginas}
          onCambiarPagina={manejarCambiarPagina}
        />
      </div>
    </div>
  );
};

export default GestionResiduos;
