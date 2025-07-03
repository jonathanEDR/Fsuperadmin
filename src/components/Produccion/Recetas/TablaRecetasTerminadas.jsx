import React from 'react';

const TablaRecetasTerminadas = ({ recetas }) => {
  // Filtrar recetas con disponible 0
  const terminadas = recetas.filter(receta => {
    const disponible = (receta.inventario?.cantidadProducida || 0) - (receta.inventario?.cantidadUtilizada || 0);
    return disponible <= 0;
  });

  if (terminadas.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Recetas Terminadas</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rendimiento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producido</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilizado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disponible</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {terminadas.map(receta => {
              const disponible = (receta.inventario?.cantidadProducida || 0) - (receta.inventario?.cantidadUtilizada || 0);
              // Cálculo de costos
              let costoTotal = 0;
              let precioUnitario = 0;
              if (receta.ingredientes && receta.ingredientes.length > 0 && receta.rendimiento?.cantidad > 0) {
                for (const item of receta.ingredientes) {
                  if (item.ingrediente && typeof item.ingrediente.precioUnitario === 'number' && item.ingrediente.precioUnitario > 0) {
                    costoTotal += (Number(item.cantidad) || 0) * (Number(item.ingrediente.precioUnitario) || 0);
                  }
                }
                precioUnitario = costoTotal / Number(receta.rendimiento.cantidad);
              }
              return (
                <tr key={receta._id} className="bg-red-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{receta.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{receta.descripcion}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{receta.rendimiento?.cantidad} {receta.rendimiento?.unidadMedida}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{receta.inventario?.cantidadProducida || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{receta.inventario?.cantidadUtilizada || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">{disponible}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">S/.{costoTotal.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">S/.{precioUnitario.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablaRecetasTerminadas;
