import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, Calendar, Search, AlertCircle } from 'lucide-react';
import { api } from '../../services';

/**
 * VentasSelectionList Component
 * 
 * A component for selecting ventas (sales) in the context of cobros (payments).
 * Provides search functionality and displays a list of available ventas for selection.
 *
 * @component
 * @param {Object} props
 * @param {Function} props.onVentaSelect - Callback function when a venta is selected
 * @param {Array} props.selectedVentas - Array of currently selected ventas
 * @param {Function} props.onError - Callback function for error handling
 *
 * @example
 * return (
 *   <VentasSelectionList
 *     onVentaSelect={(venta) => handleVentaSelection(venta)}
 *     selectedVentas={currentlySelectedVentas}
 *     onError={(error) => handleError(error)}
 *   />
 * )
 */
const VentasSelectionList = ({ onVentaSelect, selectedVentas = [], onError }) => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVentas, setFilteredVentas] = useState([]);

  // Cargar ventas pendientes
  useEffect(() => {
    const loadVentas = async () => {
      try {
        setLoading(true);
        console.log('Iniciando carga de ventas pendientes...');
        
        const response = await api.get('/api/cobros/ventas-pendientes');
        console.log('Respuesta del servidor:', response.data);
        
        let ventasData = [];
        if (response.data && response.data.ventas) {
          ventasData = response.data.ventas;
        } else if (Array.isArray(response.data)) {
          ventasData = response.data;
        } else {
          throw new Error('No se encontraron ventas pendientes');
        }

        console.log('📊 Datos de ventas recibidos del servidor:', ventasData);

        // Validar y procesar cada venta
        const ventasProcesadas = ventasData.map((venta, index) => {
          console.log(`🔍 Venta ${index + 1} - Datos originales:`, {
            _id: venta._id,
            montoTotal: venta.montoTotal,
            montoTotalNeto: venta.montoTotalNeto,
            cantidadPagada: venta.cantidadPagada,
            productos: venta.productos?.map(p => ({
              cantidad: p.cantidad,
              precioUnitario: p.precioUnitario,
              subtotal: p.cantidad * p.precioUnitario
            }))
          });

          if (!venta._id || (!venta.montoTotal && !venta.montoTotalNeto)) {
            console.warn('Venta con datos incompletos:', venta);
            return null;
          }

          // El backend ya envía el montoPendiente calculado correctamente
          // Solo necesitamos usar esos valores directamente
          const montoTotal = parseFloat(venta.montoTotal || 0);
          const montoTotalNeto = parseFloat(venta.montoTotalNeto || venta.montoTotal || 0);
          const cantidadPagada = parseFloat(venta.cantidadPagada || 0);
          const montoPendiente = parseFloat(venta.montoPendiente || 0); // Usar el valor del backend

          // Calcular también desde productos para verificar consistencia
          const totalDesdeProductos = venta.productos?.reduce((sum, producto) => {
            return sum + (parseFloat(producto.cantidad || 0) * parseFloat(producto.precioUnitario || 0));
          }, 0) || 0;

          console.log(`Procesando venta ${venta._id}:`, {
            montoTotalOriginal: venta.montoTotal,
            montoTotalNetoOriginal: venta.montoTotalNeto,
            montoPendienteBackend: venta.montoPendiente,
            montoTotalParseado: montoTotal,
            montoTotalNeto: montoTotalNeto,
            cantidadPagada: cantidadPagada,
            montoPendienteFinal: montoPendiente,
            totalDesdeProductos: totalDesdeProductos,
            diferencia: Math.abs(montoTotal - totalDesdeProductos)
          });

          return {
            ...venta,
            cantidadPagada,
            montoTotal: montoTotal, // Usar montoTotal original para el display
            montoPendiente: montoPendiente, // Usar montoPendiente del backend
            estadoPago: venta.estadoPago || 'Pendiente',
            productos: Array.isArray(venta.productos) ? venta.productos : []
          };
        }).filter(Boolean);

        console.log('Ventas procesadas:', ventasProcesadas);
        setVentas(ventasProcesadas);
        setFilteredVentas(ventasProcesadas);
      } catch (error) {
        console.error('Error al cargar ventas:', error);
        onError?.(error.message || 'Error al cargar las ventas pendientes');
      } finally {
        setLoading(false);
      }
    };

    loadVentas();
  }, [onError]);

  // Filtrar ventas basado en búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVentas(ventas);
      return;
    }

    const filtered = ventas.filter(venta => {
      const searchLower = searchTerm.toLowerCase();
      return (
        venta._id.toLowerCase().includes(searchLower) ||
        format(new Date(venta.fechadeVenta), 'PPP', { locale: es }).toLowerCase().includes(searchLower) ||
        venta.montoTotal.toString().includes(searchLower)
      );
    });

    setFilteredVentas(filtered);
  }, [searchTerm, ventas]);

  // Manejar la selección de una venta
  const handleVentaClick = (venta) => {
    console.log('Seleccionando venta:', venta);
    // Asegurarse de que todos los valores numéricos sean números
    const ventaDetails = {
      _id: venta._id,
      montoTotal: parseFloat(venta.montoTotal),
      cantidadPagada: parseFloat(venta.cantidadPagada || 0),
      montoPendiente: parseFloat(venta.montoPendiente),
      fechadeVenta: venta.fechadeVenta,
      productos: venta.productos,
      estadoPago: venta.estadoPago
    };
    console.log('Enviando detalles de venta:', ventaDetails);
    onVentaSelect(venta._id, ventaDetails);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          placeholder="Buscar por ID, fecha o monto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Información del total seleccionado */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-50 rounded-lg">
        <span>Ventas seleccionadas: {selectedVentas.length}</span>
        <span className="font-semibold">
          Total a cobrar: S/. {
            selectedVentas.reduce((total, ventaId) => {
              const venta = ventas.find(v => v._id === ventaId);
              return total + (venta ? parseFloat(venta.montoPendiente) : 0);
            }, 0).toFixed(2)
          }
        </span>
      </div>

      {/* Lista de ventas */}
      <div className="space-y-2">
        {filteredVentas.map(venta => (
          <div
            key={venta._id}
            onClick={() => handleVentaClick(venta)}
            className={`cursor-pointer border rounded-lg p-4 ${
              selectedVentas.includes(venta._id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  selectedVentas.includes(venta._id)
                    ? 'bg-blue-500 text-white'
                    : 'border border-gray-300'
                }`}>
                  {selectedVentas.includes(venta._id) && <Check className="w-4 h-4" />}
                </div>
                <span className="text-sm text-gray-500">ID: {venta._id}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold">Total: S/. {venta.montoTotal.toFixed(2)}</span>
                <br />
                <span className="text-red-500">
                  Pendiente: S/. {venta.montoPendiente.toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-1" />
              {format(new Date(venta.fechadeVenta), 'PPP', { locale: es })}
            </div>

            {venta.productos && venta.productos.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {venta.productos.map((prod, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{prod.cantidad}x {prod.productoId?.nombre || 'Producto'}</span>
                    <span>S/. {(prod.precioUnitario * prod.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {filteredVentas.length === 0 && (
          <div className="flex items-center justify-center p-8 text-gray-500">
            <AlertCircle className="w-5 h-5 mr-2" />
            No se encontraron ventas pendientes
          </div>
        )}
      </div>
    </div>
  );
};

export default VentasSelectionList;
