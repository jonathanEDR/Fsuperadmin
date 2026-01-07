import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { getFullApiUrl, safeFetch } from '../config/api';
import { useRole } from '../context/RoleContext';

/**
 * Hook para manejar permisos del módulo de Producción
 * Obtiene los permisos del backend y los cachea localmente
 * 
 * @returns {Object} Objeto con permisos y estado de carga
 */
export const useProduccionPermissions = () => {
  const { getToken } = useAuth();
  const userRole = useRole();
  
  const [permissions, setPermissions] = useState({
    canViewPrices: false,
    canManageIngredientes: false,
    canManageMateriales: false,
    canManageRecetas: false,
    canAdjustInventory: false,
    canRegisterEntradasConPrecio: false,
    canRegisterProduccion: false,
    canDeleteProduccion: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Calcula permisos basados en el rol del usuario (fallback local)
   */
  const calculateLocalPermissions = useCallback((role) => {
    const isSuperAdmin = role === 'super_admin';
    const isAdmin = role === 'admin';
    const isAdminOrAbove = isSuperAdmin || isAdmin;

    return {
      canViewPrices: isSuperAdmin,
      canManageIngredientes: isSuperAdmin,
      canManageMateriales: isSuperAdmin,
      canManageRecetas: isSuperAdmin, // Solo super_admin puede crear/editar recetas
      canAdjustInventory: isAdminOrAbove,
      canRegisterEntradasConPrecio: isSuperAdmin,
      canCreateProduccion: isSuperAdmin, // Crear nueva producción desde catálogo
      canAddCantidadProduccion: isAdminOrAbove, // Agregar cantidad desde movimientos
      canRegisterProduccion: isAdminOrAbove, // Registrar producción en general
      canDeleteProduccion: isSuperAdmin // Solo super_admin puede eliminar
    };
  }, []);

  /**
   * Obtiene los permisos desde el backend
   */
  const fetchPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        // Sin token, usar permisos locales basados en rol
        setPermissions(calculateLocalPermissions(userRole || 'user'));
        return;
      }

      const response = await safeFetch(getFullApiUrl('/auth/user-profile'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.warn('Error fetching permissions, using local fallback');
        setPermissions(calculateLocalPermissions(userRole || 'user'));
        return;
      }

      const data = await response.json();
      
      if (data.user?.produccionPermissions) {
        setPermissions(data.user.produccionPermissions);
      } else {
        // Fallback a cálculo local si no hay permisos en la respuesta
        setPermissions(calculateLocalPermissions(data.user?.role || userRole || 'user'));
      }

    } catch (error) {
      console.error('Error fetching production permissions:', error);
      setError(error.message);
      // Usar fallback local en caso de error
      setPermissions(calculateLocalPermissions(userRole || 'user'));
    } finally {
      setIsLoading(false);
    }
  }, [getToken, userRole, calculateLocalPermissions]);

  // Cargar permisos al montar el componente o cuando cambia el rol
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Funciones helper para verificaciones comunes
  const helpers = {
    /**
     * Verifica si el usuario puede ver campos de precio
     */
    shouldShowPrice: () => permissions.canViewPrices,
    
    /**
     * Verifica si el usuario puede crear/editar ingredientes
     */
    canEditIngrediente: () => permissions.canManageIngredientes,
    
    /**
     * Verifica si el usuario puede crear/editar materiales
     */
    canEditMaterial: () => permissions.canManageMateriales,
    
    /**
     * Verifica si el usuario puede crear/editar recetas
     */
    canEditReceta: () => permissions.canManageRecetas,
    
    /**
     * Verifica si el usuario puede ajustar inventario
     */
    canAdjustStock: () => permissions.canAdjustInventory,
    
    /**
     * Verifica si el usuario puede ingresar precio en entradas
     */
    canEnterPrice: () => permissions.canRegisterEntradasConPrecio,
    
    /**
     * Verifica si el usuario puede producir
     */
    canProduce: () => permissions.canRegisterProduccion,
    
    /**
     * Verifica si el usuario puede eliminar producción
     */
    canDelete: () => permissions.canDeleteProduccion,

    /**
     * Obtiene el rol actual
     */
    getRole: () => userRole
  };

  return {
    permissions,
    isLoading,
    error,
    refetch: fetchPermissions,
    ...helpers
  };
};

/**
 * Hook simplificado para verificaciones rápidas de permisos
 * Usa el rol del contexto directamente sin llamada al backend
 * 
 * @returns {Object} Funciones de verificación de permisos
 */
export const useQuickPermissions = () => {
  const userRole = useRole();
  
  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin';
  const isAdminOrAbove = isSuperAdmin || isAdmin;

  return {
    // Permisos de visualización
    canViewPrices: isSuperAdmin,
    canViewCosts: isSuperAdmin,
    
    // Permisos de gestión
    canManageIngredientes: isSuperAdmin,
    canManageMateriales: isSuperAdmin,
    canManageRecetas: isSuperAdmin, // Solo super_admin puede crear/editar recetas
    
    // Permisos de inventario
    canAdjustInventory: isAdminOrAbove,
    canRegisterEntradasConPrecio: isSuperAdmin,
    
    // Permisos de producción
    canCreateProduccion: isSuperAdmin, // Crear nueva producción desde catálogo
    canAddCantidadProduccion: isAdminOrAbove, // Agregar cantidad desde movimientos
    canRegisterProduccion: isAdminOrAbove, // Registrar producción en general
    canDeleteProduccion: isSuperAdmin, // Solo super_admin puede eliminar
    
    // Helpers
    isSuperAdmin,
    isAdmin,
    isAdminOrAbove,
    role: userRole
  };
};

export default useProduccionPermissions;
