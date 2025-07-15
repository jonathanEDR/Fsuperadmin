import React from 'react';

const InventarioTable = ({ productos, onVenta, onDevolucion, onAgregarStock }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full bg-white border border-gray-200">
      <thead>
        <tr>
          <th>Código</th>
          <th>Nombre</th>
          <th>Categoría</th>
          <th>Stock</th>
          <th>Vendidos</th>
          <th>Devueltos</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {productos.map((prod) => (
          <tr key={prod._id}>
            <td>{prod.catalogo?.codigoCatalogo || '-'}</td>
            <td>{prod.catalogo?.nombre || '-'}</td>
            <td>{prod.catalogo?.categoria || '-'}</td>
            <td>{prod.cantidad}</td>
            <td>{prod.cantidadVendida}</td>
            <td>{prod.cantidadDevuelta}</td>
            <td>
              <button onClick={() => onVenta(prod)} className="btn btn-xs btn-primary mr-1">Venta</button>
              <button onClick={() => onDevolucion(prod)} className="btn btn-xs btn-warning mr-1">Devolución</button>
              <button onClick={() => onAgregarStock(prod)} className="btn btn-xs btn-success">Agregar Stock</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default InventarioTable;
