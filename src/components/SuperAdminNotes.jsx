import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { FileText, Trash2, Search, ChevronLeft, ChevronRight, User, Plus, Calendar } from 'lucide-react';

const SuperAdminNotes = forwardRef((props, ref) => {
  const { getToken } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [users, setUsers] = useState([]);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    fechadenota: new Date().toISOString().split('T')[0],
    userId: '',  // Este será el targetUserId en el backend
  });
  const [stats, setStats] = useState({
    total: 0,
    byUser: {},
    thisMonth: 0
  });  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
        // Usar la ruta específica para super admin que retorna todas las notas
      const response = await fetch(
        `/api/admin/notes/all?page=${currentPage}&search=${searchTerm}&sortBy=${sortBy}&order=${sortOrder}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar notas');
      }

      const data = await response.json();
      console.log('Notas recibidas:', data);
      
      // Validar y procesar las notas
      if (!data.notes || !Array.isArray(data.notes)) {
        console.error('Invalid notes data received:', data);
        throw new Error('Formato de datos inválido');
      }
      
      // Filtrar notas: excluir las aprobadas y procesar la información
      const filteredNotes = data.notes
        .filter(note => note.completionStatus !== 'approved')
        .map(note => ({
          ...note,
          creator_info: note.creator_info || {
            nombre_negocio: 'Usuario Eliminado',
            email: 'No disponible',
            role: 'unknown',
            id: note.creatorId
          },
          user_info: note.user_info || {
            nombre_negocio: 'Usuario Eliminado',
            email: 'No disponible',
            role: 'unknown'
          }
        }));
      
      setNotes(filteredNotes);
      
      // Actualizar la paginación
      const totalItems = filteredNotes.length;
      const itemsPerPage = 10;
      const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);
      setTotalPages(calculatedTotalPages || 1);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setError(error.message || 'Error al cargar las notas');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };  const fetchUsers = async () => {
    try {
      const token = await getToken();
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al cargar usuarios');

      const data = await response.json();
      console.log('Respuesta de usuarios:', data);

      if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        setUsers([]);
        console.error('La respuesta no contiene un array de usuarios:', data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error al cargar los usuarios');
      setUsers([]);
    }
  };
  const fetchApprovedNotes = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:5000/api/notes/approved?page=${currentPage}&search=${searchTerm}&sortBy=${sortBy}&order=${sortOrder}&date=${dateFilter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al cargar notas aprobadas');

      const data = await response.json();
      setApprovedNotes(data.notes || []);
    } catch (error) {
      console.error('Error fetching approved notes:', error);
      setError('Error al cargar las notas aprobadas');
    }
  };

  // Exponer fetchNotes al componente padre
  useImperativeHandle(ref, () => ({
    fetchNotes
  }));

  useEffect(() => {
    fetchNotes();
    fetchUsers();
    fetchApprovedNotes();
  }, [currentPage, searchTerm, sortBy, sortOrder]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchNotes();
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta nota?')) return;
    
    try {      const token = await getToken();      const response = await fetch(`/api/notes/delete/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error al eliminar la nota');

      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      setError('Error al eliminar la nota');
    }
  };  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!newNote.userId) {
      setError('Por favor selecciona un usuario');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      const response = await fetch('http://localhost:5000/api/notes/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newNote.title,
          content: newNote.content,
          fechadenota: newNote.fechadenota,
          targetUserId: newNote.userId // Asegúrate de que este sea el clerk_id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la nota');
      }

      const result = await response.json();
      
      if (!result.note) {
        throw new Error('La respuesta del servidor no incluye la nota creada');
      }

      // Actualización optimista con la nota completa del servidor
      const noteWithInfo = {
        ...result.note,
        user_info: result.user_info,
        creator_info: result.creator_info
      };
      
      setNotes(prevNotes => [noteWithInfo, ...prevNotes]);
      
      // Limpiar el formulario
      setNewNote({
        title: '',
        content: '',
        fechadenota: new Date().toISOString().split('T')[0],
        userId: ''
      });
      
      setSuccess('Nota creada exitosamente');
      setTimeout(() => setSuccess(''), 3000);

      // Recargar las notas para asegurar sincronización
      await fetchNotes();
    } catch (error) {
      console.error('Error creating note:', error);
      setError(error.message || 'Error al crear la nota');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };  const handleNoteReview = async (noteId, status) => {
    try {
      // Verificar si la nota existe
      const noteToReview = notes.find(note => note._id === noteId);
      
      if (!noteToReview) {
        throw new Error('Nota no encontrada');
      }
      
      const token = await getToken();
      const response = await fetch(`/api/notes/${noteId}/review`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al revisar la nota');
      }

      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (!data.note) {
        throw new Error('La respuesta del servidor no incluye la nota actualizada');
      }

      // Actualización optimista del estado
      setNotes(prevNotes => prevNotes.map(note => 
        note._id === noteId ? data.note : note
      ).filter(note => note._id !== noteId));  // Removemos la nota después de aprobar/rechazar
      
      setSuccess(`Nota ${status === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`);
      setTimeout(() => setSuccess(''), 3000);

      // Recargar las notas para asegurar sincronización
      await fetchNotes();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setTimeout(() => setError(null), 3000);
    }
  };  const renderNoteActions = (note) => {
    console.log('Evaluando nota para acciones:', {
      id: note._id,
      role: note.creator_info?.role,
      isCompleted: note.isCompleted,
      status: note.completionStatus,
      userInfo: note.user_info,
      creatorInfo: note.creator_info
    });

    // Verificar si la nota está completa y pendiente de revisión
    if (note.isCompleted && note.completionStatus === 'pending') {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => handleNoteReview(note._id, 'approved')}
            className="flex-1 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            Aprobar
          </button>
          <button
            onClick={() => handleNoteReview(note._id, 'rejected')}
            className="flex-1 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            Rechazar
          </button>
        </div>
      );
    }
    
    return null;
  };

  if (loading && notes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  return (
    <div id="super-admin-notes" className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <FileText className="text-purple-600" size={24} />
            Gestión de Notas
          </h2>
          <div className="flex gap-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar notas..."
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Search size={20} />
              </button>
            </form>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="createdAt">Fecha de creación</option>
                <option value="fechadenota">Fecha de nota</option>
                <option value="title">Título</option>
              </select>
              <button
                onClick={() => {
                  setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {notes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No hay notas disponibles</p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note._id}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
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
                        Creado: {new Date(note.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
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
                  <button
                    onClick={() => handleDeleteNote(note._id)}
                    className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    title="Eliminar nota"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="space-y-2 mt-4">
                  {renderNoteActions(note)}
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
            ))
          )}
        </div>

        {notes.length > 0 && (
          <div className="mt-6 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>  );
});

export default SuperAdminNotes;