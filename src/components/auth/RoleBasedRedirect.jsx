// RoleBasedRedirect.jsx - Componente para redirigir según el rol
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const RoleBasedRedirect = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const redirectToRoleDashboard = async () => {
      try {
        console.log('🔄 Redirecting based on user role...');
        
        const token = await getToken();
        if (!token) {
          console.log('❌ No token found, redirecting to login');
          navigate('/login');
          return;
        }

        console.log('🔑 Token obtained successfully');

        // Obtener perfil del usuario
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        console.log('🌐 Backend URL:', backendUrl);
        
        const response = await fetch(`${backendUrl}/api/auth/user-profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📡 API Response status:', response.status);

        if (!response.ok) {
          console.log('❌ Error fetching profile, redirecting to login');
          console.log('Response status text:', response.statusText);
          navigate('/login');
          return;
        }

        const profileData = await response.json();
        console.log('👤 Profile data received:', profileData);
        
        const userRole = profileData.user.role;
        const userEmail = profileData.user.email;
        
        console.log('✅ User role detected:', userRole);
        console.log('📧 User email:', userEmail);

        // Redirigir según el rol
        switch (userRole) {
          case 'super_admin':
            console.log('🔴 Redirecting to Super Admin dashboard');
            navigate('/super-admin/dashboard', { replace: true });
            break;
          case 'admin':
            console.log('🟡 Redirecting to Admin dashboard');
            navigate('/admin/dashboard', { replace: true });
            break;
          case 'user':
          default:
            console.log('🔵 Redirecting to User dashboard');
            navigate('/user/dashboard', { replace: true });
            break;
        }
      } catch (error) {
        console.error('❌ Error during role-based redirect:', error);
        navigate('/login');
      }
    };

    redirectToRoleDashboard();
  }, [getToken, navigate]);

  // Mostrar loading mientras se hace la redirección
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirigiendo a tu dashboard...</p>
      </div>
    </div>
  );
};

export default RoleBasedRedirect;
