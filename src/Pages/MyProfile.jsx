import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Shield, Mail, Building2, User, DollarSign, TrendingUp, Calendar, Eye } from 'lucide-react';
import { gestionPersonalService } from '../services';

const MyProfile = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nombre_negocio: '',
    email: ''
  });
  
  // Estados para gestión personal
  const [registros, setRegistros] = useState([]);
  const [loadingRegistros, setLoadingRegistros] = useState(false);
  const [mostrarTodosRegistros, setMostrarTodosRegistros] = useState(false);
  const [registrosMostrados, setRegistrosMostrados] = useState(10);
  const fetchProfile = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/auth/my-profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setEditForm({
          nombre_negocio: data.user.nombre_negocio || '',
          email: data.user.email || ''
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar el perfil');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMisRegistros = async () => {
    try {
      setLoadingRegistros(true);
      const data = await gestionPersonalService.obtenerMisRegistros();
      setRegistros(data);
    } catch (error) {
      console.error('Error al obtener mis registros:', error);
    } finally {
      setLoadingRegistros(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      nombre_negocio: profile.nombre_negocio || '',
      email: profile.email || ''
    });
  };
  const handleSave = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/auth/update-my-profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(result.user);
        setIsEditing(false);
        setError('success:' + result.message);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el perfil');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  // Funciones helper para gestión personal
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearMoneda = (cantidad) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(cantidad);
  };

  const calcularTotales = () => {
    const totales = {
      gastos: 0,
      pagosDiarios: 0,
      faltantes: 0,
      adelantos: 0
    };

    registros.forEach(registro => {
      totales.gastos += registro.monto || 0;
      totales.pagosDiarios += registro.pagodiario || 0;
      totales.faltantes += registro.faltante || 0;
      totales.adelantos += registro.adelanto || 0;
    });

    return totales;
  };

  const obtenerRegistrosRecientes = () => {
    const registrosOrdenados = [...registros].sort((a, b) => new Date(b.fechaDeGestion) - new Date(a.fechaDeGestion));
    return mostrarTodosRegistros ? registrosOrdenados : registrosOrdenados.slice(0, 5);
  };

  const cargarMasRegistros = () => {
    setRegistrosMostrados(prev => prev + 10);
  };
  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMisRegistros();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <User className="text-blue-600" />
          Mi Perfil
        </h2>

        {error && (
          <div className={`px-4 py-3 rounded mb-4 ${
            error.startsWith('success:')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {error.startsWith('success:') ? error.replace('success:', '') : error}
          </div>
        )}

        {profile && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {profile.nombre_negocio?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {isEditing ? (
                    <input
                      type="text"
                      className="border border-gray-300 rounded px-3 py-1"
                      value={editForm.nombre_negocio}
                      onChange={(e) => setEditForm({ ...editForm, nombre_negocio: e.target.value })}
                      placeholder="Nombre del negocio"
                    />
                  ) : (
                    profile.nombre_negocio
                  )}
                </h3>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={16} />
                  {isEditing ? (
                    <input
                      type="email"
                      className="border border-gray-300 rounded px-3 py-1"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="Email"
                    />
                  ) : (
                    profile.email
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Shield size={16} />
                  <span className="font-semibold">Rol</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                  profile.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {profile.role === 'super_admin' ? 'Super Administrador' :
                   profile.role === 'admin' ? 'Administrador' : 'Usuario'}
                </span>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Building2 size={16} />
                  <span className="font-semibold">Estado de la cuenta</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {profile.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </div>            </div>

            {/* Sección de Gestión Personal */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="text-green-600" size={20} />
                <h3 className="text-xl font-semibold text-gray-800">Mi Gestión Personal</h3>
              </div>

              {loadingRegistros ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando registros...</p>
                </div>
              ) : registros.length > 0 ? (
                <>
                  {/* Resumen financiero */}
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg mb-4">
                    <h4 className="text-lg font-medium mb-3 text-gray-800">Resumen Financiero</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                      {(() => {
                        const totales = calcularTotales();
                        const totalAPagar = totales.pagosDiarios - (totales.faltantes + totales.adelantos);
                        return (
                          <>
                            <div>
                              <p className="text-xs text-gray-600">Gastos</p>
                              <p className="text-sm font-bold text-red-600">{formatearMoneda(totales.gastos)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Pagos Recibidos</p>
                              <p className="text-sm font-bold text-green-600">{formatearMoneda(totales.pagosDiarios)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Faltantes</p>
                              <p className="text-sm font-bold text-orange-600">{formatearMoneda(totales.faltantes)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Adelantos</p>
                              <p className="text-sm font-bold text-blue-600">{formatearMoneda(totales.adelantos)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Total a Pagar</p>
                              <p className={`text-sm font-bold ${totalAPagar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatearMoneda(totalAPagar)}
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Registros recientes */}
                  <div className="bg-white border rounded-lg">
                    <div className="px-4 py-3 bg-gray-50 border-b">
                      <div className="flex justify-between items-center">
                        <h4 className="text-md font-medium text-gray-800">
                          Registros Recientes ({registros.length} total)
                        </h4>
                        <button
                          onClick={() => setMostrarTodosRegistros(!mostrarTodosRegistros)}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Eye size={14} />
                          {mostrarTodosRegistros ? 'Ver menos' : 'Ver todos'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                      {obtenerRegistrosRecientes().map((registro) => (
                        <div key={registro._id} className="p-3 hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-gray-800 font-medium text-sm">{registro.descripcion || 'Sin descripción'}</p>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-3">
                              {formatearFecha(registro.fechaDeGestion)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            {registro.monto && registro.monto > 0 && (
                              <div>
                                <span className="text-gray-600">Gasto:</span>
                                <span className="block text-red-600 font-bold">
                                  {formatearMoneda(registro.monto)}
                                </span>
                              </div>
                            )}
                            {registro.pagodiario && registro.pagodiario > 0 && (
                              <div>
                                <span className="text-gray-600">Pago Diario:</span>
                                <span className="block text-green-600 font-bold">
                                  {formatearMoneda(registro.pagodiario)}
                                </span>
                              </div>
                            )}
                            {registro.faltante && registro.faltante > 0 && (
                              <div>
                                <span className="text-gray-600">Faltante:</span>
                                <span className="block text-orange-600 font-bold">
                                  {formatearMoneda(registro.faltante)}
                                </span>
                              </div>
                            )}
                            {registro.adelanto && registro.adelanto > 0 && (
                              <div>
                                <span className="text-gray-600">Adelanto:</span>
                                <span className="block text-blue-600 font-bold">
                                  {formatearMoneda(registro.adelanto)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No tienes registros de gestión personal aún</p>
                  <p className="text-sm text-gray-500 mt-1">Los registros aparecerán aquí cuando se creen</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Guardar cambios
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Editar perfil
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
