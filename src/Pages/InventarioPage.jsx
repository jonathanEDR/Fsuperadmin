import React, { useState } from 'react';
import useInventario from '../hooks/useInventario';
import useCatalogo from '../hooks/useCatalogo';
import InventarioTable from '../components/inventario/InventarioTable';
import InventarioForm from '../components/inventario/InventarioForm';
import CatalogoSearch from '../components/inventario/CatalogoSearch';
import NuevoProductoCatalogoForm from '../components/inventario/NuevoProductoCatalogoForm';
import * as inventarioService from '../services/inventarioService';
import * as catalogoService from '../services/catalogoService';

const InventarioPage = () => {
  const { productos, loading, error, fetchInventario } = useInventario();
  const { catalogo, fetchCatalogo } = useCatalogo();
  const [modal, setModal] = useState(null); // { tipo, producto }
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleAccion = (tipo, producto) => setModal({ tipo, producto });
  const cerrarModal = () => setModal(null);

  const handleSubmitAccion = async (cantidad) => {
    try {
      if (modal.tipo === 'venta') {
        await inventarioService.registrarVenta(modal.producto._id, cantidad);
        setMensaje('Venta registrada');
      } else if (modal.tipo === 'devolucion') {
        await inventarioService.registrarDevolucion(modal.producto._id, cantidad);
        setMensaje('Devolución registrada');
      } else {
        await inventarioService.agregarStock(modal.producto.catalogo.codigoCatalogo, cantidad);
        setMensaje('Stock agregado');
      }
      fetchInventario();
    } catch (e) {
      setMensaje(e.message || 'Error');
    }
    cerrarModal();
  };

  const handleNuevoProducto = async (form) => {
    try {
      await catalogoService.crearProductoCatalogo(form);
      setMensaje('Producto creado en catálogo');
      fetchCatalogo();
    } catch (e) {
      setMensaje(e.message || 'Error');
    }
    cerrarModal();
  };

  // Filtro de productos por búsqueda
  const productosFiltrados = productos.filter(p => {
    const c = p.catalogo || {};
    return (
      c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.codigoCatalogo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.categoria?.toLowerCase().includes(busqueda.toLowerCase())
    );
  });

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Inventario de Productos</h2>
      <CatalogoSearch value={busqueda} onChange={setBusqueda} onBuscar={() => {}} />
      <button className="btn btn-primary mb-4" onClick={() => setModal({ tipo: 'nuevo' })}>Nuevo Producto en Catálogo</button>
      {mensaje && <div className="alert alert-info mb-2">{mensaje}</div>}
      {loading ? <div>Cargando...</div> :
        <InventarioTable
          productos={productosFiltrados}
          onVenta={p => handleAccion('venta', p)}
          onDevolucion={p => handleAccion('devolucion', p)}
          onAgregarStock={p => handleAccion('stock', p)}
        />
      }
      {/* Modal simple */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[300px] relative">
            <button className="absolute top-2 right-2 btn btn-xs" onClick={cerrarModal}>✕</button>
            {modal.tipo === 'nuevo' ? (
              <NuevoProductoCatalogoForm onSubmit={handleNuevoProducto} />
            ) : (
              <InventarioForm
                tipo={modal.tipo}
                producto={modal.producto}
                onSubmit={handleSubmitAccion}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InventarioPage;
