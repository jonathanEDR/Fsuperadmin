import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Building2, MapPin } from 'lucide-react';
import { getSucursalesActivas, getAllSucursales, createSucursal, updateSucursal, deleteSucursal } from '../../services/sucursalService';
import { useToast } from '../../hooks/useToast';

const SucursalModal = ({ isOpen, onClose, userRole }) => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    ubicacion: '',
    descripcion: ''
  });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadSucursales();
    }
  }, [isOpen]);

  const loadSucursales = async () => {
    try {
      setLoading(true);
      // Admin y super_admin ven todas, users solo las activas
      const response = (userRole === 'admin' || userRole === 'super_admin') 
        ? await getAllSucursales() 
        : await getSucursalesActivas();
      setSucursales(response.sucursales || []);
    } catch (error) {
      showError('Error al cargar sucursales');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim() || !formData.ubicacion.trim()) {
      showError('Nombre y ubicación son requeridos');
      return;
    }

    try {
      setLoading(true);
      
      if (editingId) {
        await updateSucursal(editingId, formData);
        showSuccess('Sucursal actualizada exitosamente');
      } else {
        await createSucursal(formData);
        showSuccess('Sucursal creada exitosamente');
      }
      
      resetForm();
      await loadSucursales();
    } catch (error) {
      showError(error.response?.data?.error || 'Error al guardar sucursal');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sucursal) => {
    setEditingId(sucursal._id);
    setFormData({
      nombre: sucursal.nombre,
      ubicacion: sucursal.ubicacion,
      descripcion: sucursal.descripcion || ''
    });
  };

  const handleDelete = async (sucursalId) => {
    if (!window.confirm('¿Estás seguro de desactivar esta sucursal?')) return;

    try {
      setLoading(true);
      await deleteSucursal(sucursalId);
      showSuccess('Sucursal desactivada exitosamente');
      await loadSucursales();
    } catch (error) {
      showError('Error al desactivar sucursal');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', ubicacion: '', descripcion: '' });
    setEditingId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Building2 className="text-blue-600" size={24} />
            Gestión de Sucursales
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Sede Central"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Av. Principal 123, Lima"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Información adicional sobre la sucursal..."
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                <Plus size={18} />
                {editingId ? 'Actualizar' : 'Agregar'} Sucursal
              </button>
              
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {/* List */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">Sucursales Registradas</h3>
            
            {loading && sucursales.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : sucursales.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No hay sucursales registradas</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sucursales.map((sucursal) => (
                  <div
                    key={sucursal._id}
                    className={`border rounded-lg p-4 ${
                      !sucursal.activo ? 'bg-gray-100 opacity-60' : 'bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                          <Building2 size={16} className="text-blue-600" />
                          {sucursal.nombre}
                          {!sucursal.activo && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                              Inactiva
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <MapPin size={14} />
                          {sucursal.ubicacion}
                        </p>
                        {sucursal.descripcion && (
                          <p className="text-xs text-gray-500 mt-2">{sucursal.descripcion}</p>
                        )}
                      </div>
                      
                      {sucursal.activo && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(sucursal)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          
                          {(userRole === 'admin' || userRole === 'super_admin') && (
                            <button
                              onClick={() => handleDelete(sucursal._id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Desactivar"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SucursalModal;
