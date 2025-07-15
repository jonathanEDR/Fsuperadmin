import React, { useState } from 'react';

const NuevoProductoCatalogoForm = ({ onSubmit }) => {
  const [form, setForm] = useState({ codigoCatalogo: '', nombre: '', descripcion: '', categoria: '' });
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
      <h3 className="font-bold mb-2">Nuevo Producto en Catálogo</h3>
      <div className="mb-2">
        <label>Código:</label>
        <input type="text" value={form.codigoCatalogo} onChange={e => setForm(f => ({ ...f, codigoCatalogo: e.target.value }))} className="input input-bordered w-full" required />
      </div>
      <div className="mb-2">
        <label>Nombre:</label>
        <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className="input input-bordered w-full" required />
      </div>
      <div className="mb-2">
        <label>Descripción:</label>
        <input type="text" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} className="input input-bordered w-full" />
      </div>
      <div className="mb-2">
        <label>Categoría:</label>
        <input type="text" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className="input input-bordered w-full" />
      </div>
      <button type="submit" className="btn btn-primary">Crear</button>
    </form>
  );
};

export default NuevoProductoCatalogoForm;
