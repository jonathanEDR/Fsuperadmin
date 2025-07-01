import React, { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { SignUp } from "@clerk/clerk-react";

function Register() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [registering, setRegistering] = useState(false);


  useEffect(() => {
    if (!isLoaded) return;

    if (user && !registering) {
      // Usuario ya existe, intentar registrar en nuestro backend
      registerUserInBackend();
    }
  }, [user, isLoaded, registering]);

  const registerUserInBackend = async () => {
    setRegistering(true);
    try {
      const token = await getToken();
      
      if (!token) {
        console.error('No authentication token available');
        setRegistering(false);
        return;
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clerk_id: user.id,
          email: user.emailAddresses[0].emailAddress,
          role: 'user' // rol por defecto
        })
      });

      if (!response.ok) {
        throw new Error('Error registering user in backend');
      }

      // Registro exitoso, redirigir al dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error during backend registration:', error);
    } finally {
      setRegistering(false);
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  // Si el usuario ya está autenticado, redirigir al dashboard
  if (user) {
    return <div>Setting up your account...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <SignUp routing="path" path="/signup" />
      </div>
    </div>
  );
}
  
export default Register;