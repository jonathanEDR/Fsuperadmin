import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '@clerk/clerk-react';
import ModalIngreso from './ModalIngreso';
import ModalEgreso from './ModalEgreso';
import EstadisticasRapidas from './EstadisticasRapidas';

function Caja() {
  const { getToken } = useAuth();  const [resumen, setResumen] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalIngresoOpen, setIsModalIngresoOpen] = useState(false);
  const [isModalEgresoOpen, setIsModalEgresoOpen] = useState(false);
  const [periodo, setPeriodo] = useState('month');

  const periodos = [
    { value: 'day', label: 'Hoy' },
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mes' }
  ];

  // Función para obtener el rango de fechas del período seleccionado
  const obtenerRangoFechas = () => {
    const ahora = new Date();
    let inicio, fin;

    switch (periodo) {
      case 'day':
        inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);
        break;
      case 'week':
        const diaSemana = ahora.getDay();
        const diasAtras = diaSemana === 0 ? 6 : diaSemana - 1; // Lunes como primer día
        inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - diasAtras);
        fin = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6, 23, 59, 59);
        break;
      case 'month':
        inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);
        break;
      default:
        return '';
    }

    const formatearFechaRango = (fecha) => {
      return fecha.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };

    return `${formatearFechaRango(inicio)} - ${formatearFechaRango(fin)}`;
  };
  // Obtener resumen de la caja
  const fetchResumen = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('No estás autorizado');

      const response = await api.get(`/api/caja/resumen?periodo=${periodo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResumen(response.data);
    } catch (err) {
      console.error('Error al cargar resumen:', err);
      setError('Error al cargar resumen: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [getToken, periodo]);

  // Obtener movimientos
  const fetchMovimientos = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await api.get('/api/caja/movimientos?limit=20', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMovimientos(response.data.movimientos || []);
    } catch (err) {
      console.error('Error al cargar movimientos:', err);
    }
  }, [getToken]);  useEffect(() => {
    fetchResumen();
    fetchMovimientos();
  }, [fetchResumen, fetchMovimientos]);
  // Función para actualizar datos después de registrar movimiento
  const handleMovimientoSuccess = useCallback(async () => {
    await fetchResumen();
    await fetchMovimientos();
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
      { value: 'pago_personal', label: 'Pago Personal' },
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

  // Formatear fecha
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !resumen) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-lg">Cargando caja...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 lg:mb-6 gap-3 lg:gap-4">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1 lg:mb-2">
            <h2 className="text-xl lg:text-2xl xl:text-3xl font-bold text-gray-800">💰 Control de Caja</h2>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-sm w-fit"
            >
              {periodos.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-gray-600 text-sm">Gestión centralizada de ingresos y egresos</p>
            <p className="text-xs text-gray-500 font-medium">
              📅 Período: {obtenerRangoFechas()}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Layout responsivo: Saldo Principal y Métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {/* Saldo Principal y Botones de Acción */}
        <div className="lg:col-span-7">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-4 lg:p-6 text-white h-full">
            <div className="text-center mb-4 lg:mb-6">
              <h3 className="text-base lg:text-lg font-medium opacity-90">Saldo Actual</h3>
              <p className={`text-3xl lg:text-4xl font-bold mb-2 ${
                resumen?.saldoActual >= 0 ? 'text-green-200' : 'text-red-200'
              }`}>
                {resumen ? formatearMonto(resumen.saldoActual) : 'S/. 0.00'}
              </p>
              <p className="text-sm opacity-75">
                Actualizado en tiempo real
              </p>
            </div>
            
            <div className="flex justify-center gap-2 sm:gap-4">
              <button
                onClick={() => setIsModalIngresoOpen(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                ➕ Registrar Ingreso
              </button>
              <button
                onClick={() => setIsModalEgresoOpen(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                ➖ Registrar Egreso
              </button>
            </div>
          </div>
        </div>

        {/* Métricas del Período - Ocupa el resto del espacio */}
        {resumen && (
          <div className="lg:col-span-5">
            <EstadisticasRapidas 
              resumen={resumen}
              periodos={periodos}
              periodo={periodo}
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
            <div className="text-4xl mb-4">📊</div>
            <p className="text-lg mb-2">No hay movimientos registrados</p>
            <p className="text-sm">Los movimientos aparecerán aquí una vez que los registres</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Tipo
                  </th>
                  <th className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Saldo
                  </th>
                  <th className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movimientos.map((mov, index) => (
                  <tr key={mov._id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-2 sm:px-3 lg:px-4 py-1.5 lg:py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      <div className="font-medium">{formatearFecha(mov.fecha)}</div>
                      {/* Mostrar tipo en móvil como parte de la fecha */}
                      <div className="md:hidden">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                          mov.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {mov.tipo === 'ingreso' ? '⬆️ Ingreso' : '⬇️ Egreso'}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 sm:px-3 lg:px-4 py-1.5 lg:py-2 whitespace-nowrap hidden md:table-cell">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        mov.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {mov.tipo === 'ingreso' ? '⬆️ Ingreso' : '⬇️ Egreso'}
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 lg:px-4 py-1.5 lg:py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      <div className="font-medium">
                        {categoriasDisponibles[mov.tipo + 's']?.find(c => c.value === mov.categoria)?.label || mov.categoria}
                      </div>
                    </td>
                    <td className="px-2 sm:px-3 lg:px-4 py-1.5 lg:py-2 text-xs sm:text-sm text-gray-900 max-w-xs">
                      <div className="truncate font-medium" title={mov.descripcion}>
                        {mov.descripcion}
                      </div>
                      {/* Mostrar saldo en móvil como parte de la descripción */}
                      <div className="lg:hidden mt-1">
                        <span className={`text-xs font-medium ${
                          mov.saldoActual >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Saldo: {formatearMonto(mov.saldoActual)}
                        </span>
                      </div>
                    </td>
                    <td className={`px-2 sm:px-3 lg:px-4 py-1.5 lg:py-2 whitespace-nowrap text-xs sm:text-sm font-bold ${
                      mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <div className="font-bold">
                        {mov.tipo === 'ingreso' ? '+' : '-'}{formatearMonto(mov.monto)}
                      </div>
                    </td>
                    <td className={`px-2 sm:px-3 lg:px-4 py-1.5 lg:py-2 whitespace-nowrap text-xs sm:text-sm font-medium hidden lg:table-cell ${
                      mov.saldoActual >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <div className="font-bold">
                        {formatearMonto(mov.saldoActual)}
                      </div>
                    </td>
                    <td className="px-2 sm:px-3 lg:px-4 py-1.5 lg:py-2 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <span className="text-xs font-medium">{mov.esAutomatico ? '🤖' : '✋'}</span>
                        <button
                          onClick={() => handleEliminarMovimiento(mov._id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded-md transition-colors duration-200"
                          title="Eliminar movimiento"
                          disabled={loading}
                        >
                          <span className="text-xs">🗑️</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
