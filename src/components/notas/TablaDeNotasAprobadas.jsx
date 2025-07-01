import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { CheckCircle, User, Calendar, Search, Filter, Eye, X } from 'lucide-react';
import { useRole } from '../../context/RoleContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export default function TablaDeNotasAprobadas() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const userRole = useRole();
  const [approvedNotes, setApprovedNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Cargar notas aprobadas
  useEffect(() => {
    const fetchApprovedNotes = async () => {
      setLoading(true);
      setError('');
      try {
        const token = await getToken();
        const queryParams = new URLSearchParams();
        if (searchTerm) queryParams.append('search', searchTerm);
        if (dateFilter) queryParams.append('date', dateFilter);
        
        const res = await fetch(`${BACKEND_URL}/api/notes/approved?${queryParams}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          throw new Error('Error al cargar notas aprobadas');
        }
        
        const data = await res.json();
        setApprovedNotes(data.notes || []);
      } catch (err) {
        setError(err.message || 'Error al cargar notas aprobadas');
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedNotes();
  }, [searchTerm, dateFilter, getToken]);

  // Filtrar notas por término de búsqueda
  const filteredNotes = approvedNotes.filter(note => 
    note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.user_info?.nombre_negocio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.creator_info?.nombre_negocio?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Abrir modal con detalles de la nota
  const openNoteModal = (note) => {
    setSelectedNote(note);
    setShowModal(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setSelectedNote(null);
    setShowModal(false);
  };

  return (
    <div className="bg-white shadow-xl rounded-2xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <CheckCircle className="text-green-600" size={24} />
          Historial de Notas Aprobadas
        </h2>
        <div className="text-sm text-gray-500 bg-green-50 px-3 py-1 rounded-full">
          {filteredNotes.length} nota{filteredNotes.length !== 1 ? 's' : ''} aprobada{filteredNotes.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por título, contenido o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        {(searchTerm || dateFilter) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setDateFilter('');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <X size={16} />
            Limpiar
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          {searchTerm || dateFilter ? 'No se encontraron notas con los filtros aplicados' : 'No hay notas aprobadas'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-green-50 border-b border-green-200">
                <th className="text-left p-4 font-semibold text-green-800">Título</th>
                <th className="text-left p-4 font-semibold text-green-800">Propietario</th>
                <th className="text-left p-4 font-semibold text-green-800">Creado por</th>
                <th className="text-left p-4 font-semibold text-green-800">Fecha de Nota</th>
                <th className="text-left p-4 font-semibold text-green-800">Aprobada el</th>
                <th className="text-left p-4 font-semibold text-green-800">Aprobada por</th>
                <th className="text-center p-4 font-semibold text-green-800">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotes.map((note, index) => (
                <tr 
                  key={note._id} 
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                  }`}
                >
                  <td className="p-4">
                    <div className="font-medium text-gray-900 truncate max-w-xs" title={note.title}>
                      {note.title}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {note.user_info?.nombre_negocio || 'Usuario desconocido'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full w-fit ${
                          note.user_info?.role === 'super_admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : note.user_info?.role === 'admin'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {note.user_info?.role || 'user'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {note.creator_info?.nombre_negocio || 'Usuario desconocido'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full w-fit ${
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
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {note.fechadenota ? new Date(note.fechadenota).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : '-'}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {note.adminReviewedAt ? new Date(note.adminReviewedAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-900">
                      {note.reviewedByInfo?.nombre_negocio || 'No especificado'}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => openNoteModal(note)}
                      className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-lg text-sm flex items-center gap-1 mx-auto transition-colors"
                    >
                      <Eye size={14} />
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para ver detalles de la nota */}
      {showModal && selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={20} />
                  Nota Aprobada
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 text-lg mb-2">{selectedNote.title}</h4>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-700 mb-2">Contenido:</h5>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedNote.content}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h5 className="font-medium text-blue-800 mb-1">Propietario</h5>
                    <p className="text-blue-700">{selectedNote.user_info?.nombre_negocio || 'Usuario desconocido'}</p>
                    <p className="text-xs text-blue-600">{selectedNote.user_info?.email}</p>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h5 className="font-medium text-green-800 mb-1">Creado por</h5>
                    <p className="text-green-700">{selectedNote.creator_info?.nombre_negocio || 'Usuario desconocido'}</p>
                    <p className="text-xs text-green-600">{selectedNote.creator_info?.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <strong>Fecha de nota:</strong> {selectedNote.fechadenota ? new Date(selectedNote.fechadenota).toLocaleDateString('es-ES') : 'No especificada'}
                  </div>
                  <div>
                    <strong>Creada el:</strong> {selectedNote.createdAt ? new Date(selectedNote.createdAt).toLocaleDateString('es-ES') : 'No especificada'}
                  </div>
                  <div>
                    <strong>Aprobada el:</strong> {selectedNote.adminReviewedAt ? new Date(selectedNote.adminReviewedAt).toLocaleDateString('es-ES') : 'No especificada'}
                  </div>
                  <div>
                    <strong>Aprobada por:</strong> {selectedNote.reviewedByInfo?.nombre_negocio || 'No especificado'}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={closeModal}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
