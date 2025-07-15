import React, { useState } from 'react';

const InventarioForm = ({ onSubmit, producto, tipo }) => {
  const [cantidad, setCantidad] = useState(1);
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(cantidad); }}>
      <h3 className="font-bold mb-2">{tipo === 'venta' ? 'Registrar Venta' : tipo === 'devolucion' ? 'Registrar Devolución' : 'Agregar Stock'}</h3>
      <div className="mb-2">
        <label>Cantidad:</label>
        <input type="number" min={1} value={cantidad} onChange={e => setCantidad(Number(e.target.value))} className="input input-bordered w-full" />
      </div>
      <button type="submit" className="btn btn-primary">Confirmar</button>
    </form>
  );
};

export default InventarioForm;
