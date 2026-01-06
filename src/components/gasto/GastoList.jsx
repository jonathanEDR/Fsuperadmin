import React, { useState, useMemo } from 'react';
import useGastos from './useGastos';
import GastoForm from './GastoForm';
import GastoDashboard from './GastoDashboard';
import GastoCategoriaView from './GastoCategoriaView';
import CatalogoGastoList from './CatalogoGastoList';
import { getLocalDateString } from '../../utils/dateUtils';

export default function GastoList() {
  const {
    gastos,
    loading,
    error,
    isSubmitting,
    addGasto,
    updateGasto,
    deleteGasto,
    setError
  } = useGastos();

  // Estado para navegacion
  const [vistaActual, setVistaActual] = useState('dashboard'); // 'dashboard' | 'categoria' | 'catalogo'
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');

  // Estados para filtro de fechas
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(() => {
    // Por defecto: primer día del mes actual
    const today = getLocalDateString();
    const [year, month] = today.split('-');
    return `${year}-${month}-01`;
  });
  const [fechaFin, setFechaFin] = useState(() => {
    return getLocalDateString();
  });

  // Filtrar gastos por rango de fechas
  const gastosFiltrados = useMemo(() => {
    if (!fechaInicio && !fechaFin) return gastos;
    
    return gastos.filter(gasto => {
      const fechaGasto = new Date(gasto.fechaGasto);
      const inicio = fechaInicio ? new Date(fechaInicio + 'T00:00:00') : null;
      const fin = fechaFin ? new Date(fechaFin + 'T23:59:59') : null;
      
      if (inicio && fechaGasto < inicio) return false;
      if (fin && fechaGasto > fin) return false;
      return true;
    });
  }, [gastos, fechaInicio, fechaFin]);

  // Estado para el formulario
  const initialGasto = {
    _id: null,
    catalogoGastoId: null,
    descripcion: '',
    costoUnidad: '',
    cantidad: '',
    tipoDeGasto: '',
    gasto: '',
    unidadMedida: 'unidad',
    fechaGasto: new Date().toISOString().slice(0, 16),
  };
  const [showForm, setShowForm] = useState(false);
  const [gastoActual, setGastoActual] = useState(initialGasto);

  // Handlers para formulario
  const handleFormChange = (field, value) => {
    setGastoActual(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (gastoActual._id) {
      await updateGasto(gastoActual);
    } else {
      await addGasto(gastoActual);
    }
    setShowForm(false);
    setGastoActual(initialGasto);
  };

  const handleAgregarGasto = (categoria = '') => {
    setGastoActual({
      ...initialGasto,
      gasto: categoria,
      fechaGasto: new Date().toISOString().slice(0, 16)
    });
    setShowForm(true);
  };

  const handleEditarGasto = (gasto) => {
    // Formatear fecha para el input datetime-local
    let fechaFormateada = '';
    if (gasto.fechaGasto) {
      const fecha = new Date(gasto.fechaGasto);
      fechaFormateada = fecha.toISOString().slice(0, 16);
    }

    setGastoActual({
      ...gasto,
      costoUnidad: gasto.costoUnidad?.toString() || '',
      cantidad: gasto.cantidad?.toString() || '',
      catalogoGastoId: gasto.catalogoGastoId || null,
      unidadMedida: gasto.unidadMedida || 'unidad',
      fechaGasto: fechaFormateada
    });
    setShowForm(true);
  };

  const handleEliminarGasto = async (id) => {
    if (window.confirm('¿Estas seguro de eliminar este gasto?')) {
      await deleteGasto(id);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setGastoActual(initialGasto);
  };

  // Navegacion
  const handleSelectCategoria = (categoria) => {
    setCategoriaSeleccionada(categoria);
    setVistaActual('categoria');
  };

  const handleVolverDashboard = () => {
    setCategoriaSeleccionada('');
    setVistaActual('dashboard');
  };

  const handleAdministrarCatalogo = () => {
    setVistaActual('catalogo');
  };

  // Loading
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando gastos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Filtro de Fechas - Solo visible en dashboard y categoria */}
      {(vistaActual === 'dashboard' || vistaActual === 'categoria') && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Header colapsable */}
          <button
            type="button"
            onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-filter text-blue-600"></i>
              </div>
              <div className="text-left">
                <span className="font-semibold text-gray-800">Filtrar por Fechas</span>
                <p className="text-xs text-gray-500">
                  {fechaInicio} → {fechaFin} • {gastosFiltrados.length} de {gastos.length} gastos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${filtrosAbiertos ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {/* Contenido colapsable */}
          <div className={`transition-all duration-300 ease-in-out ${filtrosAbiertos ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="p-4 pt-0 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => {
                      const today = getLocalDateString();
                      const [year, month] = today.split('-');
                      setFechaInicio(`${year}-${month}-01`);
                      setFechaFin(today);
                    }}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  >
                    Este Mes
                  </button>
                  <button
                    onClick={() => {
                      setFechaInicio('');
                      setFechaFin('');
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    Ver Todo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista de Catalogo */}
      {vistaActual === 'catalogo' && (
        <div>
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleVolverDashboard}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <i className="fas fa-arrow-left text-gray-600"></i>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Catalogo de Gastos</h1>
          </div>
          <CatalogoGastoList />
        </div>
      )}

      {/* Vista Dashboard */}
      {vistaActual === 'dashboard' && (
        <GastoDashboard
          gastos={gastosFiltrados}
          onSelectCategoria={handleSelectCategoria}
          onAgregarGasto={() => handleAgregarGasto()}
          onAdministrarCatalogo={handleAdministrarCatalogo}
        />
      )}

      {/* Vista por Categoria */}
      {vistaActual === 'categoria' && (
        <GastoCategoriaView
          categoria={categoriaSeleccionada}
          gastos={gastosFiltrados}
          onVolver={handleVolverDashboard}
          onAgregarGasto={handleAgregarGasto}
          onEditarGasto={handleEditarGasto}
          onEliminarGasto={handleEliminarGasto}
        />
      )}

      {/* Modal del formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800">
                  {gastoActual._id ? 'Editar Gasto' : 'Nuevo Gasto'}
                </h3>
                <button
                  onClick={handleCancelForm}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <i className="fas fa-times text-gray-500"></i>
                </button>
              </div>
            </div>
            <div className="p-6">
              <GastoForm
                gasto={gastoActual}
                onChange={handleFormChange}
                onSubmit={handleFormSubmit}
                onCancel={handleCancelForm}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
