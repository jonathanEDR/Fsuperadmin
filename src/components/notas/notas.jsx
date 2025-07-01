import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Plus, Loader, User, Calendar, Trash2, Check, X, AlertTriangle, CheckCircle, Archive } from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import NoteCreationModal from './NoteCreationModal';
import TablaDeNotasAprobadas from './TablaDeNotasAprobadas';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

/**
 * Componente centralizado para gestión de notas para los 3 roles.
 * - user: ve y crea sus propias notas.
 * - admin: ve, crea y aprueba/rechaza notas de sus usuarios.
 * - super_admin: ve, crea y aprueba/rechaza todas las notas.
 */
export default function Notas() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const userRole = useRole();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [fechadenota, setFechadenota] = useState('');
  const [users, setUsers] = useState([]); // Solo para admin/super_admin
  const [selectedUser, setSelectedUser] = useState('');
  const [forbidden, setForbidden] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('activas'); // 'activas' o 'aprobadas'

  // Cargar notas según rol
  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      setError('');
      setForbidden(false);
      try {
        const token = await getToken();
        let url = `${BACKEND_URL}/api/notes`;
        if (userRole === 'super_admin') url = `${BACKEND_URL}/api/admin/notes/all`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 403) {
          setForbidden(true);
          setNotes([]);
          return;
        }
        const data = await res.json();
        setNotes(data.notes || data || []);
      } catch (err) {
        setError('Error al cargar notas');
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [userRole]);

  // Cargar usuarios solo para super_admin
  useEffect(() => {
    if (userRole !== 'super_admin') return;
    const fetchUsers = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 403) {
          setForbidden(true);
          setUsers([]);
          return;
        }
        const data = await res.json();
        setUsers(data.users || []);
      } catch {
        setUsers([]);
      }
    };
    fetchUsers();
  }, [userRole, getToken]);

  // Nueva función para crear nota desde el modal
  const handleCreateNoteFromModal = async (noteData) => {
    setLoading(true);
    setError('');
    setForbidden(false);
    try {
      const token = await getToken();
      const body = {
        ...noteData,
        ...(noteData.selectedUser && { targetUserId: noteData.selectedUser })
      };
      const res = await fetch(`${BACKEND_URL}/api/notes/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (!res.ok) throw new Error('Error al crear nota');
      const data = await res.json();
      setNotes(prev => [data.note || {}, ...prev]);
    } catch {
      setError('Error al crear nota');
    } finally {
      setLoading(false);
    }
  };

  // Aprobar/rechazar nota (solo admin/super_admin)
  const handleReview = async (noteId, status) => {
    setLoading(true);
    setError('');
    setForbidden(false);
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/notes/${noteId}/review`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (!res.ok) throw new Error('Error al actualizar nota');
      const data = await res.json();
      // Actualizar la nota en el estado local
      setNotes(notes => notes.map(n => 
        n._id === noteId ? data.note : n
      ));
      setSuccess(`Nota ${status === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`);
      setTimeout(() => setSuccess(''), 2000);
      
      // Si la nota fue aprobada, cambiar a la pestaña de aprobadas después de un breve delay
      if (status === 'approved') {
        setTimeout(() => {
          setActiveTab('aprobadas');
        }, 1500);
      }
    } catch {
      setError('Error al actualizar nota');
    } finally {
      setLoading(false);
    }
  };

  // Marcar nota como completada (solo el propietario de la nota)
  const handleComplete = async (noteId) => {
    if (!window.confirm('¿Marcar esta nota como completada? Quedará pendiente de revisión del administrador.')) return;
    setLoading(true);
    setError('');
    setForbidden(false);
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/notes/${noteId}/complete`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al completar nota');
      }
      const data = await res.json();
      setNotes(notes => notes.map(n => 
        n._id === noteId ? data.note : n
      ));
      setSuccess('Nota marcada como completada. Pendiente de revisión del administrador.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Error al completar nota');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar nota (solo admin/super_admin)
  const handleDelete = async (noteId) => {
    if (!window.confirm('¿Eliminar nota?')) return;
    setLoading(true);
    setError('');
    setForbidden(false);
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/notes/delete/${noteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (!res.ok) throw new Error('Error al eliminar nota');
      setNotes(notes => notes.filter(n => n._id !== noteId));
    } catch {
      setError('Error al eliminar nota');
    } finally {
      setLoading(false);
    }
  };

  // Renderizado condicional según permisos
  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-yellow-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-yellow-700 mb-2">No tienes permisos para ver esta sección</h2>
        <p className="text-gray-600">Contacta a un administrador si crees que esto es un error.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <NoteCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNoteCreated={handleCreateNoteFromModal}
      />
      <div className="bg-white shadow-xl rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Plus className="text-blue-600" size={24} />
            Crear Nueva Nota
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow"
          >
            <Plus size={20} /> Nueva Nota
          </button>
        </div>
      </div>

      {/* Pestañas */}
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('activas')}
            className={`flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'activas'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <User size={18} />
            Notas Activas
            {notes.filter(note => note.completionStatus !== 'approved').length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {notes.filter(note => note.completionStatus !== 'approved').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('aprobadas')}
            className={`flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'aprobadas'
                ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <CheckCircle size={18} />
            Notas Aprobadas
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'activas' ? (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <User className="text-blue-600" size={24} />
                Notas Activas
              </h2>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                  {success}
                </div>
              )}
              {loading ? (
                <div className="flex justify-center py-8"><Loader className="animate-spin" size={32} /></div>
              ) : notes.filter(note => note.completionStatus !== 'approved').length === 0 ? (
                <div className="text-gray-500 text-center py-8">No hay notas activas disponibles</div>
              ) : (
                <div className="space-y-4">
                  {notes.filter(note => note.completionStatus !== 'approved').map(note => (
              <div
                key={note._id}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-full">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {note.title}
                    </h3>
                    <div className="space-y-2">
                      {/* Información del propietario */}
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User size={14} />
                          <span className="font-medium">Propietario:</span>
                          <span>{note.user_info?.nombre_negocio || note.user_info?.email || 'Usuario desconocido'}</span>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          note.user_info?.role === 'super_admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : note.user_info?.role === 'admin'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {note.user_info?.role || 'user'}
                        </span>
                      </div>
                      {/* Información del creador */}
                      <div className={`flex items-center justify-between ${
                        note.creator_info?.role === 'super_admin'
                          ? 'bg-purple-50'
                          : note.creator_info?.role === 'admin'
                          ? 'bg-blue-50'
                          : 'bg-green-50'
                      } p-2 rounded-lg`}>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User size={14} className={
                            note.creator_info?.role === 'super_admin'
                              ? 'text-purple-500'
                              : note.creator_info?.role === 'admin'
                              ? 'text-blue-500'
                              : 'text-green-500'
                          } />
                          <span className="font-medium">Creado por:</span>
                          <span className={`font-medium ${
                            note.creator_info?.role === 'super_admin'
                              ? 'text-purple-600'
                              : note.creator_info?.role === 'admin'
                              ? 'text-blue-600'
                              : 'text-green-600'
                          }`} title={note.creator_info?.email || ''}>
                            {note.creator_info?.nombre_negocio || note.creator_info?.email || 'Usuario desconocido'}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full shrink-0 ${
                            note.creator_info?.role === 'super_admin'
                              ? 'bg-purple-100 text-purple-800'
                              : note.creator_info?.role === 'admin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {note.creator_info?.role === 'super_admin' 
                              ? 'Super Admin'
                              : note.creator_info?.role === 'admin'
                              ? 'Admin'
                              : 'Usuario'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 mt-4">
                      <p className="text-gray-600">{note.content}</p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-4">
                      <p className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                        Creado: {note.createdAt ? new Date(note.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : ''}
                      </p>
                      {note.fechadenota && (
                        <p className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                          Fecha nota: {new Date(note.fechadenota).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  {(['admin', 'super_admin'].includes(userRole)) && (
                    <button onClick={() => handleDelete(note._id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Eliminar nota"><Trash2 size={20} /></button>
                  )}
                </div>
                <div className="space-y-2 mt-4">
                  {/* Botón para completar nota (solo para el propietario y si no está completada) */}
                  {user && note.userId === user.id && !note.isCompleted && (
                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => handleComplete(note._id)} 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm shadow transition-colors"
                        disabled={loading}
                      >
                        <CheckCircle size={16} />
                        Marcar como Completada
                      </button>
                    </div>
                  )}
                  {/* Botones de revisión para admins */}
                  {(['admin', 'super_admin'].includes(userRole) && note.isCompleted && note.completionStatus === 'pending') && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleReview(note._id, 'approved')} className="flex-1 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-1 justify-center"><Check size={16}/>Aprobar</button>
                      <button onClick={() => handleReview(note._id, 'rejected')} className="flex-1 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1 justify-center"><X size={16}/>Rechazar</button>
                    </div>
                  )}
                  {note.isCompleted && (
                    <div className={`text-xs px-3 py-1 rounded-full inline-block ${
                      note.completionStatus === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : note.completionStatus === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {note.completionStatus === 'approved'
                        ? 'Aprobada'
                        : note.completionStatus === 'rejected'
                        ? 'Rechazada'
                        : 'Pendiente de Revisión'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
            </>
          ) : (
            <TablaDeNotasAprobadas />
          )}
        </div>
      </div>
    </div>
  );
}
