import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { filterUsersByRole, mapUsuarios } from '../utils/ventaHelpers';

/**
 * Hook personalizado para gestionar usuarios según rol
 * @param {string} currentUserRole - Rol del usuario actual
 * @returns {Object} Estado y funciones para usuarios
 */
export const useUsuariosVenta = (currentUserRole) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');

  /**
   * Carga usuarios desde el backend (solo para admin y super_admin)
   */
  useEffect(() => {
    const loadUsers = async () => {
      // Solo cargar usuarios si el rol permite crear ventas para otros
      if (!['admin', 'super_admin'].includes(currentUserRole)) {
        // Para usuarios normales, solo pueden crear ventas para sí mismos
        if (user) {
          const currentUserObj = {
            id: user.id,
            name: user.fullName || user.email || 'Tú',
            email: user.email,
            role: currentUserRole
          };
          setUsuarios([currentUserObj]);
          setUsuarioSeleccionado(currentUserObj.id);
        }
        return;
      }

      setLoading(true);
      try {
        const token = await getToken();
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/users`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Verificar la estructura de datos
        const users = Array.isArray(data) ? data : data.users;
        if (!users) {
          throw new Error('Formato de respuesta inválido');
        }

        // Mapear usuarios
        const mappedUsers = mapUsuarios(users);

        // Filtrar usuarios según el rol del usuario actual
        let filteredUsers = filterUsersByRole(
          mappedUsers, 
          currentUserRole, 
          user?.id
        );

        // Fallback solo para 'admin' y 'user', NO para 'super_admin'
        // Super_admin nunca debe verse a sí mismo en la lista
        if (filteredUsers.length === 0 && user && currentUserRole !== 'super_admin') {
          const currentUserObj = {
            id: user.id,
            name: user.fullName || user.email || 'Tú',
            email: user.email,
            role: currentUserRole
          };
          filteredUsers = [currentUserObj];
        }

        setUsuarios(filteredUsers);

        // Seleccionar el primer usuario por defecto
        if (filteredUsers.length > 0 && !usuarioSeleccionado) {
          setUsuarioSeleccionado(filteredUsers[0].id);
        }

        setError('');
      } catch (error) {
        setError('Error al cargar la lista de usuarios: ' + error.message);
        
        // Fallback: agregar usuario actual (excepto super_admin)
        // Super_admin no puede asignarse ventas a sí mismo
        if (user && currentUserRole !== 'super_admin') {
          const currentUserObj = {
            id: user.id,
            name: user.fullName || user.email || 'Tú',
            email: user.email,
            role: currentUserRole
          };
          setUsuarios([currentUserObj]);
          setUsuarioSeleccionado(currentUserObj.id);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [currentUserRole, user?.id, getToken]); // Dependencias optimizadas

  /**
   * Verifica si el usuario actual puede crear ventas para otros
   */
  const puedeCrearVentasParaOtros = () => {
    return ['admin', 'super_admin'].includes(currentUserRole);
  };

  /**
   * Obtiene el usuario seleccionado actual
   */
  const getUsuarioSeleccionado = () => {
    return usuarios.find(u => u.id === usuarioSeleccionado);
  };

  return {
    usuarios,
    loading,
    error,
    usuarioSeleccionado,
    setUsuarioSeleccionado,
    puedeCrearVentasParaOtros,
    getUsuarioSeleccionado,
    setError
  };
};
