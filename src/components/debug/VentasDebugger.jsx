import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

const VentasDebugger = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  const fetchVentas = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ventas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      const ventasData = result.ventas || result || [];
      
      console.log('🔍 VENTAS RAW DATA:', ventasData);
      
      // Analizar estructura de las primeras 3 ventas
      ventasData.slice(0, 3).forEach((venta, index) => {
        console.log(`📋 VENTA ${index + 1}:`, {
          id: venta._id,
          fechaVenta: venta.fechaVenta,
          createdAt: venta.createdAt,
          estadoPago: venta.estadoPago,
          completionStatus: venta.completionStatus,
          productos: venta.productos?.map(p => ({
            nombre: p.nombre || p.title,
            cantidad: p.cantidad,
            precio: p.precio
          }))
        });
      });

      setVentas(ventasData);
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentas();
  }, []);

  if (loading) return <div>Cargando debug...</div>;

  return (
    <div className="bg-gray-100 p-4 rounded-lg text-xs">
      <h3 className="font-bold mb-2">🔍 DEBUG: Estructura de Ventas</h3>
      <p><strong>Total ventas:</strong> {ventas.length}</p>
      <p><strong>Ventas pagadas:</strong> {ventas.filter(v => v.estadoPago === 'Pagado').length}</p>
      <p><strong>Ventas aprobadas:</strong> {ventas.filter(v => v.completionStatus === 'approved').length}</p>
      
      <div className="mt-3">
        <strong>Fechas encontradas (primeras 5):</strong>
        <ul className="list-disc list-inside">
          {ventas.slice(0, 5).map((venta, i) => (
            <li key={i}>
              {venta.fechaVenta || venta.createdAt} - 
              Productos: {venta.productos?.length || 0} - 
              Estado: {venta.estadoPago}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default VentasDebugger;
