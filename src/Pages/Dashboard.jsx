import React, { useEffect, useState } from 'react';
import { useSession, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, BarChart3, Plus, Trash2, User, UserCog, UserCircle2 } from 'lucide-react';
import { LogoutButton } from '../components/auth';
// CreateNote removido - migrado a módulo de Tareas
import { SuperAdminDashboard, AdminDashboard, UserDashboard } from '../components/layout';
import { ProfileManagement } from '../components/auth';
import { MyProfile } from '../components/auth';

function Dashboard() {
  const { session, isLoaded } = useSession();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);
  const [isServerConnected, setIsServerConnected] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);
  const [showMyProfile, setShowMyProfile] = useState(false);
  const [notes, setNotes] = useState([]);
  // Función para validar y establecer las notas
  const setNotesData = (data) => {
    if (Array.isArray(data)) {
      setNotes(data);
    } else if (data && typeof data === 'object') {
      // Si es un objeto, busca una propiedad que pueda contener el array de notas
      const possibleNotesArray = data.notes || data.data || [];
      setNotes(Array.isArray(possibleNotesArray) ? possibleNotesArray : []);
    } else {
      setNotes([]);
    }
  };

  // Función para verificar la conexión con el servidor
  const checkServerConnection = async () => {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Server connection response:', data);
      setIsServerConnected(true);
      return true;
    } catch (error) {
      console.error('Error connecting to server:', error);
      setIsServerConnected(false);
      return false;
    }
  };

  // Función para obtener el perfil del usuario y sus notas
  const fetchUserData = async () => {
    try {
      const isConnected = await checkServerConnection();
      if (!isConnected) {
        throw new Error('Server is not running. Please start the backend server.');
      }

      const token = await getToken();
      if (!token) {
        throw new Error('No session token found');
      }

      // Primero intentamos registrar al usuario si es necesario
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: session?.user?.primaryEmailAddress?.emailAddress,
          clerk_id: session?.user?.id,
          nombre_negocio: session?.user?.firstName || 'Mi Negocio'
        }),
        credentials: 'include'
      });

      if (!registerResponse.ok) {
        console.error('Error en el registro:', registerResponse.status);
      }

      // Obtenemos el perfil del usuario
      const profileResponse = await fetch('/api/auth/user-profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!profileResponse.ok) {
        throw new Error(`Failed to fetch profile: ${profileResponse.status}`);
      }

      const profileData = await profileResponse.json();
      setUserRole(profileData.user.role);

      // Obtener las notas del usuario
      const notesResponse = await fetch('/api/notes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!notesResponse.ok) {
        throw new Error(`Failed to fetch notes: ${notesResponse.status}`);
      }

      const notesData = await notesResponse.json();
      setNotesData(notesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!session) {
      navigate('/sign-in');
      return;
    }

    const initializeData = async () => {
      await checkServerConnection();
      await fetchUserData();
    };

    initializeData();

    // Poll server connection every 30 seconds (reducido la frecuencia)
    const serverCheckInterval = setInterval(checkServerConnection, 30000);
    return () => clearInterval(serverCheckInterval);
  }, [isLoaded, session]);

  // Función para manejar la creación de una nueva nota
  const handleNoteCreated = (newNote) => {
    console.log('New note created:', newNote);
    setNotes((prevNotes) => [newNote, ...prevNotes]);
    
    // Opcional: Recargar las notas para asegurar que tenemos la data más actualizada
    setTimeout(() => {
      fetchUserData();
    }, 1000);
  };

  // Función para eliminar nota (solo admins)
  const handleDeleteNote = async (noteId) => {
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      alert('No tienes permisos para eliminar notas');
      return;
    }

    if (window.confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
      try {
        const token = await getToken();
        const response = await fetch(`/api/notes/delete/${noteId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setNotes(notes.filter(note => note._id !== noteId));
          alert('Nota eliminada exitosamente');
        } else {
          const errorData = await response.json();
          alert(errorData.message || 'Error al eliminar la nota');
        }
      } catch (error) {
        console.error('Error deleting note:', error);
        alert('Error de conexión al eliminar la nota');
      }
    }
  };

  // Función para actualizar las notas después de acciones del servidor
  const refreshNotes = async () => {
    try {
      const token = await getToken();
      const notesResponse = await fetch('/api/notes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (notesResponse.ok) {
        const notesData = await notesResponse.json();
        setNotesData(notesData);
      }
    } catch (error) {
      console.error('Error refreshing notes:', error);
    }
  };

  // Mostrar el estado de carga mientras se están obteniendo los datos
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
          {!isServerConnected && (
            <p className="mt-2 text-red-500 text-sm">Conectando con el servidor...</p>
          )}
        </div>
      </div>
    );
  }

  // Verificar si la sesión ha sido cargada
  if (!session) {
    return null;
  }

  // Mostrar un mensaje de error si algo falla al obtener los datos
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex gap-2">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Reintentar
            </button>
            <button 
              onClick={() => fetchUserData()} 
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Recargar datos
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si se solicita mostrar el panel de Super Admin
  if (showSuperAdmin && userRole === 'super_admin') {
    return <SuperAdminDashboard />;
  }

  // Si se solicita mostrar la gestión de perfiles
  if (showProfiles && ['admin', 'super_admin'].includes(userRole)) {
    return <ProfileManagement />;
  }

  // Si se solicita mostrar mi perfil
  if (showMyProfile) {
    return <MyProfile />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto p-6">
        {/* Renderizar el dashboard según el rol */}
        {userRole === 'super_admin' ? (
          <SuperAdminDashboard />
        ) : userRole === 'admin' ? (
          <AdminDashboard 
            userRole={userRole} 
            initialNotes={notes}
            onNotesUpdate={setNotesData}
          />
        ) : (
          <UserDashboard 
            session={session} 
            initialNotes={notes}
            onNotesUpdate={setNotesData}
            onLogout={() => navigate('/sign-in')}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;