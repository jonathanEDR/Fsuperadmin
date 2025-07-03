import React from 'react';

const TablaIngredientesFinalizados = ({ ingredientes }) => {
  // Filtrar ingredientes con cantidad 0
  const finalizados = ingredientes.filter(ing => (ing.cantidad - (ing.procesado || 0)) <= 0);

  if (finalizados.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Ingredientes Terminados</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingrediente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procesado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disponible</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {finalizados.map(ingrediente => (
              <tr key={ingrediente._id} className="bg-red-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ingrediente.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ingrediente.unidadMedida}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ingrediente.cantidad}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ingrediente.procesado}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">{ingrediente.cantidad - (ingrediente.procesado || 0)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">S/.{ingrediente.precioUnitario?.toFixed(2) || '0.00'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablaIngredientesFinalizados;
