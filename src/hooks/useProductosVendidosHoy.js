import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { startOfDay, endOfDay } from 'date-fns';

export const useProductosVendidosHoy = () => {
  const [data, setData] = useState({
    totalProductosHoy: 0,
    productoMasVendido: null,
    loading: true,
    error: null
  });

  const { getToken } = useAuth();

  const fetchProductosHoy = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const token = await getToken();
      
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fechas de hoy
      const now = new Date();
      const startDate = startOfDay(now);
      const endDate = endOfDay(now);

      console.log('🔍 Fetching productos para hoy:', { startDate, endDate });

      // Fetch ventas de hoy - Simplificado sin parámetros de fecha primero
      const ventasResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/ventas`,
        { headers }
      );

      if (!ventasResponse.ok) {
        const errorText = await ventasResponse.text();
        console.error('❌ Error en ventas response:', ventasResponse.status, errorText);
        throw new Error(`Error al obtener las ventas: ${ventasResponse.status}`);
      }

      const ventasResult = await ventasResponse.json();
      console.log('✅ Ventas obtenidas:', ventasResult);

      const ventasData = ventasResult.ventas || ventasResult || [];

      // 🔍 DEBUGGING: Analizar estructura de datos
      console.log('🔍 Analizando estructura de ventas:');
      if (ventasData.length > 0) {
        console.log('📋 Primera venta (estructura):', {
          fechaVenta: ventasData[0].fechaVenta,
          createdAt: ventasData[0].createdAt,
          estadoPago: ventasData[0].estadoPago,
          completionStatus: ventasData[0].completionStatus,
          productos: ventasData[0].productos
        });
        
        if (ventasData[0].productos && ventasData[0].productos.length > 0) {
          console.log('📦 Primer producto (estructura):', ventasData[0].productos[0]);
        }
      }

      // Procesar datos - filtrar solo ventas de hoy
      let totalProductosHoy = 0;
      const resumenProductos = {};

      // Filtrar y contar productos vendidos hoy
      const ventasHoy = ventasData.filter(venta => {
        // ✅ CORRECCIÓN: Usar el campo REAL del modelo (fechadeVenta)
        const fechaVenta = new Date(venta.fechadeVenta || venta.createdAt);
        const esHoy = fechaVenta >= startDate && fechaVenta <= endDate;
        
        if (esHoy) {
          console.log('✅ Venta de hoy encontrada:', {
            id: venta._id,
            fecha: fechaVenta.toISOString(),
            estado: venta.estadoPago,
            completion: venta.completionStatus,
            totalProductos: venta.productos?.length || 0
          });
        }
        
        return esHoy;
      });

      console.log('📅 Ventas de hoy encontradas:', ventasHoy.length, 'de', ventasData.length, 'ventas totales');

      // Procesar cada venta de hoy
      ventasHoy.forEach((venta, index) => {
        console.log(`🏪 Procesando venta ${index + 1}:`, {
          id: venta._id,
          estadoPago: venta.estadoPago,
          completionStatus: venta.completionStatus,
          cantidadProductos: venta.productos?.length || 0
        });

        if (venta.estadoPago === 'Pagado' && venta.completionStatus === 'approved') {
          if (venta.productos && Array.isArray(venta.productos)) {
            venta.productos.forEach((producto, prodIndex) => {
              console.log(`  📦 Producto ${prodIndex + 1}:`, {
                nombre: producto.nombre || producto.title,
                nombreEnProductoId: producto.productoId?.nombre,
                cantidad: producto.cantidad,
                tipo: typeof producto.cantidad,
                productoCompleto: producto
              });

              if (producto && producto.cantidad) {
                const cantidad = parseInt(producto.cantidad) || 0;
                totalProductosHoy += cantidad;
                
                // ✅ CORRECCIÓN: Acceder correctamente al nombre del producto
                const nombreProducto = producto.productoId?.nombre || 
                                     producto.nombre || 
                                     producto.title || 
                                     'Producto sin nombre';
                
                if (!resumenProductos[nombreProducto]) {
                  resumenProductos[nombreProducto] = 0;
                }
                resumenProductos[nombreProducto] += cantidad;
                
                console.log(`    ✅ Agregado: ${cantidad} unidades de "${nombreProducto}"`);
              }
            });
          }
        } else {
          console.log(`  ❌ Venta saltada - Estado: ${venta.estadoPago}, Completion: ${venta.completionStatus}`);
        }
      });

      // Encontrar producto más vendido
      const productoMasVendido = Object.entries(resumenProductos)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 1)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))[0] || null;

      console.log('📊 Resultados:', { totalProductosHoy, productoMasVendido, resumenProductos });

      setData({
        totalProductosHoy,
        productoMasVendido,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('❌ Error fetching productos hoy:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  useEffect(() => {
    fetchProductosHoy();
  }, []);

  return {
    ...data,
    refetch: fetchProductosHoy
  };
};
