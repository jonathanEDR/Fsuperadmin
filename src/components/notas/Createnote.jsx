import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Plus, Loader2, Calendar, Users, User, AlertCircle } from 'lucide-react';
import { api } from '../../services';
import { useRole } from '../../context/RoleContext';

// Helper function for date formatting
const formatDate = (date) => {
  if (!date) return new Date().toISOString();
  const d = new Date(date);
  return d instanceof Date && !isNaN(d) ? d.toISOString() : new Date().toISOString();
};

/**
 * CreateNote Component
 * 
 * A component for creating new notes with title, content, and date.
 * Supports user selection for admin and super_admin roles.
 *
 * @param {Object} props
 * @param {Function} props.onNoteCreated - Callback function when a note is created
 * @param {boolean} props.disabled - Whether the form is disabled
 */
const CreateNote = ({ onNoteCreated, disabled = false }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [fechadenota, setFechadenota] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const { getToken } = useAuth();
  const userRole = useRole();

  // Load users list if admin or super_admin
  useEffect(() => {
    const fetchUsers = async () => {
      if (userRole === 'super_admin') {
        setLoadingUsers(true);
        try {
          const token = await getToken();
          const response = await api.get('/api/admin/users', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUsers(response.data.users || []);
        } catch (err) {
          console.error('Error fetching users:', err);
          setError('Error loading users');
        } finally {
          setLoadingUsers(false);
        }
      } else if (userRole === 'admin') {
        setLoadingUsers(true);
        try {
          const token = await getToken();
          const response = await api.get('/api/notes/my-users', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUsers(response.data.users || []);
        } catch (err) {
          console.error('Error fetching users:', err);
          setError('Error loading users');
        } finally {
          setLoadingUsers(false);
        }
      }
    };

    fetchUsers();
  }, [userRole, getToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled) return;

    setLoading(true);
    setError('');

    try {
      const token = await getToken();
      const noteData = {
        title,
        content,
        fechadenota: formatDate(fechadenota),
        ...(selectedUser && { targetUserId: selectedUser })
      };

      await api.post('/api/notes/create', noteData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Reset form
      setTitle('');
      setContent('');
      setFechadenota('');
      setSelectedUser('');
      
      if (onNoteCreated) {
        onNoteCreated();
      }
    } catch (err) {
      console.error('Error creating note:', err);
      setError('Error creating note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative flex items-center gap-2 text-sm" role="alert">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled || loading}
          required
        />
      </div>

      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Contenido"
          className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="4"
          disabled={disabled || loading}
          required
        />
      </div>

      <div>
        <div className="flex items-center space-x-2">
          <Calendar className="text-gray-500" size={18} />
          <input
            type="datetime-local"
            value={fechadenota}
            onChange={(e) => setFechadenota(e.target.value)}
            className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled || loading}
          />
        </div>
      </div>

      {['admin', 'super_admin'].includes(userRole) && (
        <div>
          <div className="flex items-center space-x-2">
            <User className="text-gray-500" size={20} />
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled || loading || loadingUsers}
            >
              <option value="">Select User</option>
              {users.map(user => (
                <option key={user.clerk_id} value={user.clerk_id}>{user.username || user.email}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={disabled || loading}
        className={`w-full text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 p-2.5 rounded-xl flex items-center justify-center space-x-2 transition-colors text-sm font-medium
          ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <>
            <Plus size={20} />
            <span>Create Note</span>
          </>
        )}
      </button>
    </form>
  );
};

export default CreateNote;
