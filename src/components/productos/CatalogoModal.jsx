import React, { useEffect, useState } from 'react';
import { Edit2, Plus, Trash2, X, BookOpen, Loader2, AlertCircle, Save } from 'lucide-react';
import catalogoService from '../../services/catalogoService';
import { useAuth } from '@clerk/clerk-react';

function CatalogoModal({ open, onClose }) {
  const { getToken } = useAuth();
  const [catalogo, setCatalogo] = useState([]);
  const [form, setForm] = useState({ codigoproducto: '', nombre: '', descripcion: '', activo: true });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) fetchCatalogo();
  }, [open]);

  const fetchCatalogo = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await catalogoService.getCatalogo(token);
      setCatalogo(data);
    } catch (err) {
      setError('Error al cargar catálogo');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      if (!form.codigoproducto || !form.nombre) {
        setError('Código y nombre son requeridos');
        return;
      }
      const token = await getToken();
      if (isEditing) {
        await catalogoService.editCatalogoProducto(editId, form, token);
      } else {
        await catalogoService.addCatalogoProducto(form, token);
      }
      setForm({ codigoproducto: '', nombre: '', descripcion: '', activo: true });
      setIsEditing(false);
      setEditId(null);
      fetchCatalogo();
    } catch (err) {
      setError('Error al guardar producto');
    }
  };

  const handleToggleActivo = async (producto) => {
    setError(null);
    try {
      const token = await getToken();
      await catalogoService.setCatalogoEstado(producto._id, !producto.activo, token);
      fetchCatalogo();
    } catch (err) {
      setError('Error al cambiar estado');
    }
  };

  const handleEdit = (producto) => {
    setForm({
      codigoproducto: producto.codigoproducto,
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      activo: producto.activo
    });
    setIsEditing(true);
    setEditId(producto._id);
  };

  const handleDelete = async (id) => {
    setError(null);
    setLoading(true);
    try {
      const token = await getToken();
      await catalogoService.deleteCatalogoProducto(id, token);
      fetchCatalogo();
    } catch (err) {
      setError('Error al eliminar producto');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({ codigoproducto: '', nombre: '', descripcion: '', activo: true });
    setIsEditing(false);
    setEditId(null);
    setError(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-xl border border-orange-100">
              <BookOpen size={20} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Catálogo de Productos</h2>
              <p className="text-xs text-gray-500">{catalogo.length} productos registrados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Formulario */}
          <div className="bg-gray-50/60 rounded-2xl border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {isEditing ? 'Editar producto del catálogo' : 'Agregar nuevo producto'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Código *</label>
                <input
                  type="text"
                  name="codigoproducto"
                  value={form.codigoproducto}
                  onChange={handleChange}
                  placeholder="Ej: 1001"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Nombre del producto"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                <input
                  type="text"
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Descripción opcional"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex flex-col justify-end gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-xs font-medium text-gray-600">Activo</label>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, activo: !prev.activo }))}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.activo ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transform transition-transform ${form.activo ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    {isEditing ? <Save size={14} /> : <Plus size={14} />}
                    {isEditing ? 'Guardar' : 'Agregar'}
                  </button>
                  {isEditing && (
                    <button
                      onClick={handleCancel}
                      className="px-3 py-2 text-sm font-medium rounded-xl border text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={28} className="animate-spin text-blue-500" />
              </div>
            ) : catalogo.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No hay productos en el catálogo</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50/60">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Descripción</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Activo</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {catalogo.map((producto, idx) => (
                    <tr key={producto._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                      <td className="py-3 px-4 font-mono text-xs text-gray-600">{producto.codigoproducto}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{producto.nombre}</td>
                      <td className="py-3 px-4 text-gray-500 hidden md:table-cell">{producto.descripcion || 'Sin descripción'}</td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActivo(producto)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${producto.activo ? 'bg-blue-500' : 'bg-gray-300'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transform transition-transform ${producto.activo ? 'translate-x-4' : 'translate-x-1'}`} />
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(producto)}
                            title="Editar"
                            className="p-1.5 rounded-lg text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(producto._id)}
                            title="Eliminar"
                            className="p-1.5 rounded-lg text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50/50 border-t border-gray-100 px-6 py-3 flex justify-end rounded-b-2xl flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-xl border text-gray-600 bg-white border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default CatalogoModal;