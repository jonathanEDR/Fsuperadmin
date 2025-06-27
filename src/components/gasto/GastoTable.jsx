import React from 'react';

export default function GastoTable({ gastos, onEdit, onDelete }) {
  // Tabla simple de gastos con acciones editar/eliminar
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2">Fecha</th>
            <th className="px-4 py-2">Descripción</th>
            <th className="px-4 py-2">Categoría</th>
            <th className="px-4 py-2">Tipo</th>
            <th className="px-4 py-2">Costo Unidad</th>
            <th className="px-4 py-2">Cantidad</th>
            <th className="px-4 py-2">Total</th>
            <th className="px-4 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {gastos.map(gasto => (
            <tr key={gasto._id}>
              <td className="px-4 py-2">{gasto.fechaGasto ? new Date(gasto.fechaGasto).toLocaleString('es-PE') : ''}</td>
              <td className="px-4 py-2">{gasto.descripcion}</td>
              <td className="px-4 py-2">{gasto.gasto}</td>
              <td className="px-4 py-2">{gasto.tipoDeGasto}</td>
              <td className="px-4 py-2">S/. {parseFloat(gasto.costoUnidad).toFixed(2)}</td>
              <td className="px-4 py-2">{gasto.cantidad}</td>
              <td className="px-4 py-2 font-bold text-green-700">S/. {(parseFloat(gasto.costoUnidad) * parseFloat(gasto.cantidad)).toFixed(2)}</td>
              <td className="px-4 py-2">
                <button onClick={() => onEdit(gasto)} className="mr-2 text-blue-600 hover:underline">Editar</button>
                <button onClick={() => onDelete(gasto._id)} className="text-red-600 hover:underline">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
