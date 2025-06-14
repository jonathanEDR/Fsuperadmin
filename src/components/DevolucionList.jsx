import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api from '../services/api';

function DevolucionList({ 
  devoluciones = [], 
  onDevolucionDeleted,
  formatearFechaHora,
  devolucionesLimit,
  onLoadMore
}) {
  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Historial de Devoluciones</h3>
      <table className="min-w-full table-auto border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Colaborador</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Fecha</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Producto</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Cantidad</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Monto</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Motivo</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {devoluciones.length ? (
            devoluciones.slice(0, devolucionesLimit).map((devolucion) => (
              <tr key={devolucion._id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-600 border-b">
                  {devolucion.ventaId?.colaboradorId?.nombre || 'N/A'}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600 border-b">
                  {formatearFechaHora(devolucion.fechaDevolucion)}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600 border-b">
                  {devolucion.productoId?.nombre || 'N/A'}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600 border-b">
                  {devolucion.cantidadDevuelta}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600 border-b">
                  S/ {devolucion.montoDevolucion?.toFixed(2)}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600 border-b">
                  {devolucion.motivo}
                </td>
                <td className="px-4 py-2 text-sm text-gray-600 border-b">
                  <button
                    onClick={() => onDevolucionDeleted(devolucion._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="px-4 py-2 text-center text-gray-600">
                No hay devoluciones registradas
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {devolucionesLimit < devoluciones.length && (
        <div className="flex justify-center mt-4">
          <button
            onClick={onLoadMore}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Ver más
          </button>
        </div>
      )}
    </div>
  );
}

export default DevolucionList;
