import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Calendar, User, Package, DollarSign, FileText } from 'lucide-react';

const ReservasCompletadas = () => {
  const { getToken } = useAuth();
  const [reservasCompletadas, setReservasCompletadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReservasCompletadas();
  }, []);

  const fetchReservasCompletadas = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      const response = await fetch(`${backendUrl}/api/reservas/completadas`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar reservas completadas');
      }
      const data = await response.json();
      setReservasCompletadas(data);
    } catch (error) {
      console.error('Error fetching reservas completadas:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearMoneda = (monto) => {
    return `S/ ${monto.toFixed(2)}`;
  };

  const renderHistorialCantidad = (producto) => {
    const { cantidadInicial, incrementos, decrementos, cantidad } = producto;
    
    const historialElementos = [];
    historialElementos.push(
      <span key="inicial" className="text-blue-600 font-medium">
        {cantidadInicial}
      </span>
    );

    incrementos.forEach((inc, index) => {
      historialElementos.push(
        <span key={`inc-${index}`} className="text-green-600">
          {' + '}{inc.cantidad}
        </span>
      );
    });

    decrementos.forEach((dec, index) => {
      historialElementos.push(
        <span key={`dec-${index}`} className="text-red-600">
          {' - '}{dec.cantidad}
        </span>
      );
    });

    historialElementos.push(
      <span key="total" className="text-gray-700 font-medium">
        {' = '}{cantidad}
      </span>
    );

    return historialElementos;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Cargando reservas completadas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
          <button 
            onClick={fetchReservasCompletadas}
            className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Reservas Completadas
              </h2>
              <p className="text-sm text-gray-500">
                Historial de reservas finalizadas
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
              {reservasCompletadas.length} completadas
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {reservasCompletadas.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay reservas completadas
            </h3>
            <p className="text-gray-500">
              Las reservas completadas aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reservasCompletadas.map((reserva) => (
              <div
                key={reserva._id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        {reserva.nombreColaborador}
                      </span>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                      Completada
                    </span>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Completada: {formatearFecha(reserva.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Productos:</span>
                  </div>
                  
                  <div className="space-y-3">
                    {reserva.productos.map((producto, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white rounded border"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-1">
                            {producto.productoNombre}
                          </div>
                          <div className="text-sm text-gray-600">
                            Cantidad: {renderHistorialCantidad(producto)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {formatearMoneda(producto.subtotal)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatearMoneda(producto.precioUnitario)} c/u
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Reservado: {formatearFecha(reserva.fechaReserva)}</span>
                    </div>
                    {reserva.notas && (
                      <div className="flex items-center space-x-1">
                        <FileText className="h-4 w-4" />
                        <span>Notas: {reserva.notas}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-lg font-semibold text-green-600">
                      {formatearMoneda(reserva.montoTotal)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservasCompletadas;
