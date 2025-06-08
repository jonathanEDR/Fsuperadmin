import React, { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';

function Login() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && user) {
      // Si el usuario está autenticado, redirige al Dashboard
      navigate('/dashboard');
    }
  }, [user, isLoaded, navigate]);

  // Mostrar loading mientras Clerk se carga
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Iniciar Sesión</h1>
          <p className="text-gray-600 mt-2">Accede a tu cuenta</p>
        </div>
        
        <div className="bg-white shadow-lg rounded-lg p-6">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
                card: 'shadow-none',
              }
            }}
            afterSignInUrl="/dashboard"
            signUpUrl="/signup"
          />
        </div>
        
        <div className="text-center mt-6">
          <p className="text-gray-600">
            ¿No tienes cuenta?{' '}
            <a href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              Crear cuenta
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;