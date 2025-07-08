import React from 'react';
import VentasManager from '../components/ventas/VentasManager';
import { ReservasCompletadas } from '../components/productos';

function VentasPage() {
  return (
    <div>
      <VentasManager />
            <ReservasCompletadas />

    </div>
  );
}

export default VentasPage;
