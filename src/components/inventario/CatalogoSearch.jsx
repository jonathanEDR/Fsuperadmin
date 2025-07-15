import React from 'react';

const CatalogoSearch = ({ value, onChange, onBuscar }) => (
  <form onSubmit={e => { e.preventDefault(); onBuscar(); }} className="mb-4 flex gap-2">
    <input
      type="text"
      placeholder="Buscar por nombre, código o categoría"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="input input-bordered w-full max-w-xs"
    />
    <button type="submit" className="btn btn-secondary">Buscar</button>
  </form>
);

export default CatalogoSearch;
