import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Calendar, User, Search, Download, Loader2, AlertCircle } from 'lucide-react';

function NotesHistory() {
  const { getToken } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  const fetchApprovedNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/notes/approved`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar el historial');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error al procesar las notas');
      }
      
      setNotes(data.notes || []);
    } catch (error) {
      console.error('Error al cargar el historial:', error);
      setError(error.message || 'Error al cargar el historial de notas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedNotes();
  }, []);

  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchTerm === '' || 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = dateFilter === '' ||
      (note.adminReviewedAt && new Date(note.adminReviewedAt).toISOString().split('T')[0] === dateFilter);

    return matchesSearch && matchesDate;
  });

  const exportToCSV = () => {
    const headers = ['Título', 'Contenido', 'Propietario', 'Creador', 'Fecha de Aprobación', 'Aprobado por'];
    const data = filteredNotes.map(note => [
      note.title,
      note.content,
      note.user_info?.nombre_negocio || note.user_info?.email || 'Usuario desconocido',
      note.creator_info?.nombre_negocio || note.creator_info?.email || 'Usuario desconocido',
      new Date(note.adminReviewedAt || note.completedAt).toLocaleDateString('es-ES'),
      note.reviewedByInfo?.nombre_negocio || note.reviewedByInfo?.email || 'Desconocido'
    ]);

    const csvContent = [headers, ...data]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historial-notas-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-xl rounded-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Historial de Notas Aprobadas</h2>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors text-sm"
          >
            <Download size={18} />
            Exportar CSV
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por título o contenido..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="w-48">
            <input
              type="date"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle size={16} className="flex-shrink-0" /> {error}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay notas aprobadas en el historial
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Título</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Propietario</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Creador</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Fecha de Aprobación</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Aprobado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredNotes.map((note) => (
                  <tr key={note._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{note.title}</div>
                        <div className="text-sm text-gray-500 mt-1">{note.content}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{note.user_info?.nombre_negocio || note.user_info?.email || 'Usuario desconocido'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{note.creator_info?.nombre_negocio || note.creator_info?.email || 'Usuario desconocido'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {new Date(note.adminReviewedAt || note.completedAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{note.reviewedByInfo?.nombre_negocio || note.reviewedByInfo?.email || 'Desconocido'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotesHistory;
