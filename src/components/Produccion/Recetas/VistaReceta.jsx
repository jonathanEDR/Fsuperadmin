import React, { useState, useEffect } from 'react';
import { recetaService } from '../../../services/recetaService';

const VistaReceta = ({ receta, onCerrar, onEditar }) => {
  const [costoCalculado, setCostoCalculado] = useState(null);
  const [disponibilidad, setDisponibilidad] = useState(null);
  const [cantidadConsulta, setCantidadConsulta] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    consultarInformacion();
  }, [cantidadConsulta]);

  const consultarInformacion = async () => {
    setLoading(true);
    try {
      const [costoResponse, disponibilidadResponse] = await Promise.all([
        recetaService.calcularCosto(receta._id, cantidadConsulta),
        recetaService.verificarDisponibilidad(receta._id, cantidadConsulta)
      ]);

      setCostoCalculado(costoResponse.data);
      setDisponibilidad(disponibilidadResponse.data);
    } catch (error) {
      console.error('Error al consultar información:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoriaColor = (categoria) => {
    const colores = {
      producto_terminado: 'bg-green-100 text-green-800',
      producto_intermedio: 'bg-yellow-100 text-yellow-800',
      preparado: 'bg-blue-100 text-blue-800'
    };
    return colores[categoria] || 'bg-gray-100 text-gray-800';
  };

  const getCategoriaLabel = (categoria) => {
    const labels = {
      producto_terminado: 'Producto Terminado',
      producto_intermedio: 'Producto Intermedio',
      preparado: 'Preparado'
    };
    return labels[categoria] || categoria;
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {receta.nombre}
              </h3>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoriaColor(receta.categoria)}`}>
                  {getCategoriaLabel(receta.categoria)}
                </span>
                <span className={`px-2 py-1 rounded text-sm ${
                  receta.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {receta.activo ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={onEditar}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Editar
              </button>
              <button
                onClick={onCerrar}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Descripción */}
              {receta.descripcion && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Descripción</h4>
                  <p className="text-gray-600">{receta.descripcion}</p>
                </div>
              )}

              {/* Ingredientes */}
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h4 className="font-medium text-gray-700">Ingredientes</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Ingrediente
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Cantidad
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Unidad
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Disponible
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Precio Unit. (S/)
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Subtotal (S/)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {receta.ingredientes?.map((item, index) => {
                        const disponible = item.ingrediente.cantidad - item.ingrediente.procesado;
                        const subtotal = item.cantidad * item.ingrediente.precioUnitario;
                        const cantidadNecesaria = item.cantidad * cantidadConsulta;
                        const suficiente = disponible >= cantidadNecesaria;

                        return (
                          <tr key={index} className={!suficiente ? 'bg-red-50' : ''}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {item.ingrediente.nombre}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {item.cantidad}
                              {cantidadConsulta > 1 && (
                                <span className="text-gray-500 ml-1">
                                  ({cantidadNecesaria} total)
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {item.unidadMedida}
                            </td>
                            <td className={`px-4 py-2 text-sm ${suficiente ? 'text-green-600' : 'text-red-600'}`}>
                              {disponible}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              S/.{item.ingrediente.precioUnitario?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              S/.{subtotal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Disponibilidad */}
              {disponibilidad && !disponibilidad.disponible && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">
                    ⚠️ Ingredientes Insuficientes
                  </h4>
                  <div className="space-y-2">
                    {disponibilidad.faltantes.map((faltante, index) => (
                      <div key={index} className="text-sm text-red-700">
                        <strong>{faltante.ingrediente}:</strong> 
                        <span className="ml-1">
                          Requiere {faltante.requerido}, disponible {faltante.disponible}, 
                          falta {faltante.faltante}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {disponibilidad && disponibilidad.disponible && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800">
                    ✅ Todos los ingredientes están disponibles
                  </h4>
                </div>
              )}
            </div>

            {/* Panel Lateral */}
            <div className="space-y-6">
              {/* Información Básica */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-3">Información</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rendimiento:</span>
                    <span className="font-medium">
                      {receta.rendimiento?.cantidad} {receta.rendimiento?.unidadMedida}
                    </span>
                  </div>
                  {receta.tiempoPreparacion > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tiempo:</span>
                      <span className="font-medium">{receta.tiempoPreparacion} min</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ingredientes:</span>
                    <span className="font-medium">{receta.ingredientes?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Creada:</span>
                    <span className="font-medium text-xs">
                      {formatearFecha(receta.createdAt)}
                    </span>
                  </div>
                  {receta.updatedAt !== receta.createdAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Actualizada:</span>
                      <span className="font-medium text-xs">
                        {formatearFecha(receta.updatedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Calculadora de Costos */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3">Calculadora de Costos</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Cantidad a producir
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={cantidadConsulta}
                      onChange={(e) => setCantidadConsulta(parseInt(e.target.value) || 1)}
                      className="w-full p-2 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {loading ? (
                    <div className="text-center py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : costoCalculado && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Costo unitario:</span>
                        <span className="font-bold">S/.{costoCalculado.costoUnitario.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Cantidad:</span>
                        <span className="font-medium">{costoCalculado.cantidad}</span>
                      </div>
                      <div className="border-t border-blue-200 pt-2">
                        <div className="flex justify-between text-lg">
                          <span className="text-blue-800 font-medium">Costo total:</span>
                          <span className="font-bold text-blue-800">
                            S/.{costoCalculado.costoTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Estado de Disponibilidad */}
              <div className={`p-4 rounded-lg ${
                disponibilidad?.disponible 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  disponibilidad?.disponible ? 'text-green-800' : 'text-red-800'
                }`}>
                  Estado de Producción
                </h4>
                <p className={`text-sm ${
                  disponibilidad?.disponible ? 'text-green-700' : 'text-red-700'
                }`}>
                  {disponibilidad?.disponible 
                    ? `✅ Se pueden producir ${cantidadConsulta} unidad${cantidadConsulta > 1 ? 'es' : ''}`
                    : `❌ No se puede producir con ingredientes actuales`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Botón Cerrar */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onCerrar}
              className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VistaReceta;
