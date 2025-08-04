import React from 'react';
import { residuoService } from '../../../services/residuoService';

const TablaResiduos = ({ 
  residuos, 
  loading, 
  onEliminar, 
  filtros, 
  totalPaginas, 
  onCambiarPagina 
}) => {

  const puedeEliminar = (fechaResiduo) => {
    const hoy = new Date();
    const fecha = new Date(fechaResiduo);
    return hoy.toDateString() === fecha.toDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Cargando residuos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cantidad
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Motivo
              </th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Costo Estimado
              </th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Operador
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {residuos.map((residuo) => (
              <tr key={residuo._id} className="hover:bg-gray-50">
                <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {residuoService.formatearFecha(residuo.fecha)}
                  </div>
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${residuoService.obtenerColorTipo(residuo.tipoProducto)}`}>
                    {residuoService.obtenerEtiquetaTipo(residuo.tipoProducto)}
                  </span>
                </td>
                <td className="px-3 md:px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {residuo.productoNombre}
                  </div>
                  {residuo.observaciones && (
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {residuo.observaciones}
                    </div>
                  )}
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {residuo.cantidadPerdida} {residuo.unidadMedida}
                  </div>
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${residuoService.obtenerColorMotivo(residuo.motivo)}`}>
                    {residuoService.obtenerEtiquetaMotivo(residuo.motivo)}
                  </span>
                </td>
                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {residuoService.formatearMoneda(residuo.costoEstimado)}
                </td>
                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {residuo.operador}
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {/* Botón Ver Detalle */}
                    <button
                      onClick={() => {
                        alert(`
📋 DETALLE DEL RESIDUO

🗓️ Fecha: ${residuoService.formatearFecha(residuo.fecha)}
📦 Tipo: ${residuoService.obtenerEtiquetaTipo(residuo.tipoProducto)}
🏷️ Producto: ${residuo.productoNombre}
⚖️ Cantidad: ${residuo.cantidadPerdida} ${residuo.unidadMedida}
❓ Motivo: ${residuoService.obtenerEtiquetaMotivo(residuo.motivo)}
💰 Costo: ${residuoService.formatearMoneda(residuo.costoEstimado)}
👤 Operador: ${residuo.operador}
📝 Observaciones: ${residuo.observaciones || 'Sin observaciones'}
                        `);
                      }}
                      title="Ver detalle"
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      👁️
                    </button>

                    {/* Botón Eliminar - Solo si es del día actual */}
                    {puedeEliminar(residuo.fecha) && (
                      <button
                        onClick={() => onEliminar(residuo._id)}
                        title="Eliminar residuo (solo del día actual)"
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Estado vacío */}
      {residuos.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🗑️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay residuos registrados
          </h3>
          <p className="text-gray-500 mb-4">
            No se encontraron residuos con los filtros seleccionados
          </p>
        </div>
      )}

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onCambiarPagina(Math.max(1, filtros.pagina - 1))}
              disabled={filtros.pagina === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => onCambiarPagina(Math.min(totalPaginas, filtros.pagina + 1))}
              disabled={filtros.pagina === totalPaginas}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Página <span className="font-medium">{filtros.pagina}</span> de{' '}
                <span className="font-medium">{totalPaginas}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => onCambiarPagina(Math.max(1, filtros.pagina - 1))}
                  disabled={filtros.pagina === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  ←
                </button>
                
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let pageNum;
                  if (totalPaginas <= 5) {
                    pageNum = i + 1;
                  } else if (filtros.pagina <= 3) {
                    pageNum = i + 1;
                  } else if (filtros.pagina >= totalPaginas - 2) {
                    pageNum = totalPaginas - 4 + i;
                  } else {
                    pageNum = filtros.pagina - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onCambiarPagina(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        filtros.pagina === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => onCambiarPagina(Math.min(totalPaginas, filtros.pagina + 1))}
                  disabled={filtros.pagina === totalPaginas}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  →
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablaResiduos;
