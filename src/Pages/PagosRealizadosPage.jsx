import React from 'react';
import { Navigate } from 'react-router-dom';

// Redirect to the new V2 implementation
function PagosRealizadosPage() {
  // This page is deprecated - redirect to the V2 module
  return <Navigate to="/super-admin/personal-v2?tab=pagos-realizados" replace />;
}

export default PagosRealizadosPage;
