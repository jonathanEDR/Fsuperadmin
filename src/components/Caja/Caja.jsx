import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '@clerk/clerk-react';
import ModalIngreso from './ModalIngreso';
import ModalEgreso from './ModalEgreso';
import EstadisticasRapidas from './EstadisticasRapidas';
import DateRangePicker from '../common/DateRangePicker';
import { getLocalDateString } from '../../utils/dateUtils';
import { formatearFecha as formatearFechaUtil } from '../../utils/fechaHoraUtils';
import CatalogoGastoList from '../gasto/CatalogoGastoList';
import { Loader2, Wallet, ClipboardList, Calendar, ChevronRight, BarChart3, ArrowUp, ArrowDown, Bot, Hand, Trash2, FileText, Plus, Minus } from 'lucide-react';

function Caja({ userRole }) {
  const { getToken } = useAuth();
  
  const [resumen, setResumen] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalIngresoOpen, setIsModalIngresoOpen] = useState(false);
  const [isModalEgresoOpen, setIsModalEgresoOpen] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [vistaActual, setVistaActual] = useState('caja'); // 'caja' | 'catalogo'
  
  // Estados para rango de fechas personalizado usando dateUtils centralizado
  const [fechaInicio, setFechaInicio] = useState(() => {
    // Por defecto: primer día del mes actual (usando fecha local de Perú)
    const today = getLocalDateString(); // YYYY-MM-DD en zona horaria local
    const [year, month] = today.split('-');
    return `${year}-${month}-01`;
  });
  
  const [fechaFin, setFechaFin] = useState(() => {
    // Por defecto: día actual (usando fecha local de Perú)
    return getLocalDateString();
  });
  
  // Estados para paginación
  const [currentLimit, setCurrentLimit] = useState(20);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Obtener resumen de la caja
  const fetchResumen = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('No estás autorizado');

      // Usar fechas personalizadas en lugar de período
      const response = await api.get(`/api/caja/resumen?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResumen(response.data);
    } catch (err) {
      console.error('Error al cargar resumen:', err);
      setError('Error al cargar resumen: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [getToken, fechaInicio, fechaFin]);

  // Obtener movimientos
  const fetchMovimientos = useCallback(async (limit = currentLimit, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const token = await getToken();
      if (!token) return;

      // Incluir fechas en la consulta de movimientos
      const response = await api.get(`/api/caja/movimientos?limit=${limit}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newMovimientos = response.data.movimientos || [];
      const pagination = response.data.pagination;
      
      if (append) {
        setMovimientos(newMovimientos);
      } else {
        setMovimientos(newMovimientos);
      }
      
      // Verificar si hay más datos disponibles
      setHasMoreData(pagination && pagination.currentPage < pagination.totalPages);
      
    } catch (err) {
      console.error('Error al cargar movimientos:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [getToken, currentLimit, fechaInicio, fechaFin]);

  // Función para cargar más registros
  const handleLoadMore = useCallback(async () => {
    let newLimit;
    if (currentLimit === 20) {
      newLimit = 50;
    } else if (currentLimit === 50) {
      newLimit = 100;
    } else {
      newLimit = currentLimit + 50; // Incrementar de 50 en 50 después de 100
    }
    
    setCurrentLimit(newLimit);
    await fetchMovimientos(newLimit, false);
  }, [currentLimit, fetchMovimientos]);  useEffect(() => {
    fetchResumen();
    fetchMovimientos();
  }, [fetchResumen, fetchMovimientos]);
  // Función para actualizar datos después de registrar movimiento
  const handleMovimientoSuccess = useCallback(async () => {
    // Resetear el límite y recargar desde el principio
    setCurrentLimit(20);
    setHasMoreData(true);
    await fetchResumen();
    await fetchMovimientos(20, false);
  }, [fetchResumen, fetchMovimientos]);

  // Función para eliminar movimiento
  const handleEliminarMovimiento = async (movimientoId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este movimiento? Esta acción eliminará tanto el movimiento de caja como el registro relacionado y no se puede deshacer.')) {
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      if (!token) throw new Error('No estás autorizado');

      const response = await api.delete(`/api/caja/movimiento/${movimientoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Movimiento eliminado:', response.data);
      
      // Mostrar mensaje de éxito
      if (response.data.eliminadoTambien) {
        alert(`Movimiento eliminado exitosamente. También se eliminó el registro de: ${response.data.eliminadoTambien}`);
      } else {
        alert('Movimiento eliminado exitosamente');
      }

      // Actualizar datos
      await handleMovimientoSuccess();
    } catch (err) {
      console.error('Error al eliminar movimiento:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error al eliminar movimiento';
      alert('Error: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Categorías para mostrar nombres legibles
  const categoriasDisponibles = {
    ingresos: [
      { value: 'venta_directa', label: 'Venta Directa' },
      { value: 'cobro', label: 'Cobro de Cliente' },
      { value: 'devolucion_proveedor', label: 'Devolución de Proveedor' },
      { value: 'prestamo_recibido', label: 'Préstamo Recibido' },
      { value: 'ingreso_extra', label: 'Ingreso Extra' }
    ],
    egresos: [
      // Pagos al personal por departamento
      { value: 'pago_personal', label: 'Pago Personal' },
      { value: 'pago_personal_finanzas', label: 'Pago Personal (Finanzas)' },
      { value: 'pago_personal_produccion', label: 'Pago Personal (Producción)' },
      { value: 'pago_personal_ventas', label: 'Pago Personal (Ventas)' },
      { value: 'pago_personal_admin', label: 'Pago Personal (Admin)' },
      // Materia prima por departamento
      { value: 'materia_prima', label: 'Materia Prima' },
      { value: 'materia_prima_finanzas', label: 'Materia Prima (Finanzas)' },
      { value: 'materia_prima_produccion', label: 'Materia Prima (Producción)' },
      { value: 'materia_prima_ventas', label: 'Materia Prima (Ventas)' },
      { value: 'materia_prima_admin', label: 'Materia Prima (Admin)' },
      // Otros por departamento
      { value: 'otros', label: 'Otros Gastos' },
      { value: 'otros_finanzas', label: 'Otros (Finanzas)' },
      { value: 'otros_produccion', label: 'Otros (Producción)' },
      { value: 'otros_ventas', label: 'Otros (Ventas)' },
      { value: 'otros_admin', label: 'Otros (Admin)' },
      // Categorías generales
      { value: 'pago_proveedor', label: 'Pago a Proveedor' },
      { value: 'gasto_operativo', label: 'Gasto Operativo' },
      { value: 'servicio_basico', label: 'Servicio Básico' },
      { value: 'alquiler', label: 'Alquiler' },
      { value: 'transporte', label: 'Transporte' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'impuestos', label: 'Impuestos' },
      { value: 'egreso_extra', label: 'Egreso Extra' }
    ]
  };

  // Formatear monto
  const formatearMonto = (monto) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(monto);
  };

  // Formatear fecha - Usando utilidad robusta con timezone de Perú
  const formatearFecha = (fecha) => {
    return formatearFechaUtil(fecha);
  };

  if (loading && !resumen) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
          <span className="ml-4 text-lg">Cargando caja...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6">
      {/* Header con Navegación */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 lg:mb-6 gap-3 lg:gap-4">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1 lg:mb-2">
            <h2 className="text-base sm:text-lg lg:text-2xl xl:text-3xl font-bold text-gray-800 flex items-center gap-2">
              {vistaActual === 'caja' ? <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" /> : <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />}
              {vistaActual === 'caja' ? 'Control de Caja' : 'Catálogo de Gastos'}
            </h2>
          </div>

          {/* Pestañas de Navegación */}
          <div className="flex gap-1 sm:gap-2 mb-4">
            <button
              onClick={() => setVistaActual('caja')}
              className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 flex items-center gap-1 sm:gap-2 ${
                vistaActual === 'caja'
                  ? 'text-blue-700 bg-blue-50 border border-blue-200'
                  : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Wallet size={16} />
              <span>Caja</span>
            </button>
            <button
              onClick={() => setVistaActual('catalogo')}
              className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 flex items-center gap-1 sm:gap-2 ${
                vistaActual === 'catalogo'
                  ? 'text-blue-700 bg-blue-50 border border-blue-200'
                  : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <ClipboardList size={16} />
              <span className="hidden xs:inline">Catálogo de</span>
              <span>Gastos</span>
            </button>
          </div>
          
          {/* Filtro de Rango de Fechas - Colapsable (solo en vista caja) */}
          {vistaActual === 'caja' && (
            <div className="mb-4">
              <button
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors mb-2"
              >
                <span className={`transform transition-transform duration-200 ${isFilterExpanded ? 'rotate-90' : ''}`}>
                  <ChevronRight size={14} />
                </span>
                <span className="flex items-center gap-1"><Calendar size={14} /> Filtrar por fechas</span>
                {!isFilterExpanded && (
                  <span className="hidden sm:inline text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[180px]">
                    {fechaInicio} → {fechaFin}
                  </span>
                )}
              </button>
              
              {isFilterExpanded && (
                <div className="animate-fadeIn">
                  <DateRangePicker
                    fechaInicio={fechaInicio}
                    fechaFin={fechaFin}
                    onFechaInicioChange={setFechaInicio}
                    onFechaFinChange={setFechaFin}
                    label="Período"
                    className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm"
                  />
                </div>
              )}
            </div>
          )}
          
          {vistaActual === 'caja' && (
            <div className="flex flex-col gap-0.5">
              <p className="text-gray-600 text-sm">Gestión centralizada de ingresos y egresos</p>
            </div>
          )}
        </div>
      </div>

      {/* Vista del Catálogo de Gastos */}
      {vistaActual === 'catalogo' && (
        <CatalogoGastoList />
      )}

      {/* Vista de Caja */}
      {vistaActual === 'caja' && (
        <>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {/* Layout responsivo: Saldo Principal y Métricas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {/* Saldo Principal y Botones de Acción */}
            <div className="lg:col-span-7">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-3 sm:p-4 lg:p-6 text-white h-full">
                <div className="text-center mb-3 sm:mb-4 lg:mb-6">
                  <h3 className="text-sm sm:text-base lg:text-lg font-medium opacity-90">Saldo Actual</h3>
                  <p className={`text-xl sm:text-2xl lg:text-4xl font-bold mb-1 sm:mb-2 ${
                    resumen?.saldoActual >= 0 ? 'text-green-200' : 'text-red-200'
                  }`}>
                {resumen ? formatearMonto(resumen.saldoActual) : 'S/. 0.00'}
              </p>
              <p className="text-xs sm:text-sm opacity-75">
                Actualizado en tiempo real
              </p>
            </div>
            
            <div className="flex justify-center gap-2 sm:gap-4">
              <button
                onClick={() => setIsModalIngresoOpen(true)}
                className="text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 text-sm sm:text-base flex items-center justify-center"
                title="Registrar Ingreso"
              >
                <Plus size={16} />
                <span className="hidden sm:inline ml-2">Registrar Ingreso</span>
              </button>
              <button
                onClick={() => setIsModalEgresoOpen(true)}
                className="text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 text-sm sm:text-base flex items-center justify-center"
                title="Registrar Egreso"
              >
                <Minus size={16} />
                <span className="hidden sm:inline ml-2">Registrar Egreso</span>
              </button>
            </div>
          </div>
        </div>

        {/* Métricas del Período - Ocupa el resto del espacio */}
        {resumen && (
          <div className="lg:col-span-5">
            <EstadisticasRapidas 
              resumen={resumen}
              fechaInicio={fechaInicio}
              fechaFin={fechaFin}
              formatearMonto={formatearMonto}
            />
          </div>
        )}
      </div>

      {/* Lista de Movimientos - Responsiva */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-base lg:text-lg font-semibold text-gray-800">
              Movimientos Recientes
            </h3>
            <span className="text-xs lg:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {movimientos.length} registros
            </span>
          </div>
        </div>
        
        {movimientos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="mb-4"><BarChart3 size={40} className="text-gray-300 mx-auto" /></div>
            <p className="text-lg mb-2">No hay movimientos registrados</p>
            <p className="text-sm">Los movimientos aparecerán aquí una vez que los registres</p>
          </div>
        ) : (
          <>
            {/* Vista de Tarjetas Móviles */}
            <div className="block lg:hidden divide-y divide-gray-200">
              {movimientos.map((mov) => (
                <div key={mov._id} className="p-4 hover:bg-gray-50 transition-colors">
                  {/* Encabezado: Tipo + Fecha + Acciones */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        mov.tipo === 'ingreso' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {mov.tipo === 'ingreso' ? <><ArrowUp size={12} className="inline" /> Ingreso</> : <><ArrowDown size={12} className="inline" /> Egreso</>}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatearFecha(mov.fecha)}
                      </span>
                    </div>
                    {/* Botón eliminar según rol */}
                    {(userRole === 'super_admin' || userRole === 'admin') && (
                      <div className="flex items-center gap-1">
                        {userRole === 'super_admin' && (
                          <span className="text-xs" title={mov.esAutomatico ? 'Automático' : 'Manual'}>
                            {mov.esAutomatico ? <Bot size={12} /> : <Hand size={12} />}
                          </span>
                        )}
                        <button
                          onClick={() => handleEliminarMovimiento(mov._id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded-xl transition-colors duration-200"
                          title="Eliminar movimiento"
                          disabled={loading}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Categoría */}
                  <div className="mb-1">
                    <span className="text-xs text-gray-500">Categoría:</span>
                    <span className="ml-1 text-sm font-medium text-gray-900">
                      {categoriasDisponibles[mov.tipo + 's']?.find(c => c.value === mov.categoria)?.label || mov.categoria}
                    </span>
                  </div>

                  {/* Descripción */}
                  {mov.descripcion && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {mov.descripcion}
                    </p>
                  )}

                  {/* Monto y Saldo */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <div>
                      <span className="text-xs text-gray-500">Monto:</span>
                      <span className={`ml-1 text-base font-bold ${
                        mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {mov.tipo === 'ingreso' ? '+' : '-'}{formatearMonto(mov.monto)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500">Saldo:</span>
                      <span className={`ml-1 text-sm font-semibold ${
                        mov.saldoActual >= 0 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {formatearMonto(mov.saldoActual)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Vista de Tabla Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saldo
                    </th>
                    {/* Solo mostrar columna Origen para super_admin */}
                    {userRole === 'super_admin' && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Origen
                      </th>
                    )}
                    {/* Para admin, mostrar columna de acciones */}
                    {userRole === 'admin' && (
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movimientos.map((mov, index) => (
                    <tr key={mov._id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{formatearFecha(mov.fecha)}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          mov.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {mov.tipo === 'ingreso' ? <><ArrowUp size={12} className="inline" /> Ingreso</> : <><ArrowDown size={12} className="inline" /> Egreso</>}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">
                          {categoriasDisponibles[mov.tipo + 's']?.find(c => c.value === mov.categoria)?.label || mov.categoria}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 max-w-xs">
                        <div className="truncate font-medium" title={mov.descripcion}>
                          {mov.descripcion}
                        </div>
                      </td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm font-bold ${
                        mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {mov.tipo === 'ingreso' ? '+' : '-'}{formatearMonto(mov.monto)}
                      </td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm font-bold ${
                        mov.saldoActual >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatearMonto(mov.saldoActual)}
                      </td>
                      {/* Solo mostrar columna Origen para super_admin */}
                      {userRole === 'super_admin' && (
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium">{mov.esAutomatico ? <Bot size={12} /> : <Hand size={12} />}</span>
                            <button
                              onClick={() => handleEliminarMovimiento(mov._id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded-xl transition-colors duration-200"
                              title="Eliminar movimiento"
                              disabled={loading}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                      {/* Para admin, mostrar botón de eliminar */}
                      {userRole === 'admin' && (
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleEliminarMovimiento(mov._id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded-xl transition-colors duration-200"
                              title="Eliminar movimiento"
                              disabled={loading}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {/* Botón Ver más - Solo visible para super_admin */}
        {movimientos.length > 0 && hasMoreData && userRole === 'super_admin' && (
          <div className="px-4 lg:px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-xl text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-4 w-4" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <FileText size={16} className="mr-1" /> Ver más registros 
                    <span className="ml-2 text-xs bg-blue-100 px-2 py-1 rounded-full">
                      {currentLimit === 20 ? '→ 50' : currentLimit === 50 ? '→ 100' : `→ ${currentLimit + 50}`}
                    </span>
                  </>
                )}
              </button>
              <div className="mt-2 text-xs text-gray-500">
                Mostrando {movimientos.length} registros • Límite actual: {currentLimit}
              </div>
            </div>
          </div>
        )}
      </div>
        </>
      )}

      {/* Modales */}
      <ModalIngreso 
        isOpen={isModalIngresoOpen}
        onClose={() => setIsModalIngresoOpen(false)}
        onSuccess={handleMovimientoSuccess}
      />
      
      <ModalEgreso 
        isOpen={isModalEgresoOpen}
        onClose={() => setIsModalEgresoOpen(false)}
        onSuccess={handleMovimientoSuccess}
      />
    </div>
  );
}

export default Caja;
