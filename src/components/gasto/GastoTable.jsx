import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

export default function GastoTable({ gastos, onEdit, onDelete }) {
  // Tabla simple de gastos con acciones editar/eliminar
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Unidad</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {gastos.map(gasto => (
            <tr key={gasto._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm text-gray-800">{gasto.fechaGasto ? new Date(gasto.fechaGasto).toLocaleString('es-PE') : ''}</td>
              <td className="px-4 py-3 text-sm font-medium text-gray-800">{gasto.descripcion}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{gasto.gasto}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{gasto.tipoDeGasto}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-600">S/. {parseFloat(gasto.costoUnidad).toFixed(2)}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-600">{gasto.cantidad}</td>
              <td className="px-4 py-3 text-sm text-right font-bold text-green-700">S/. {(parseFloat(gasto.costoUnidad) * parseFloat(gasto.cantidad)).toFixed(2)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-center gap-2">
                  <button onClick={() => onEdit(gasto)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Editar">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => onDelete(gasto._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
