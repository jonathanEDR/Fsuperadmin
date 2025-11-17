/**
 * Servicio para gestión de códigos QR de asistencias (Frontend)
 * Conecta con el backend /api/qr-asistencia
 */

import api from './api';

/**
 * Generar nuevo código QR (Admin)
 */
export const generarQR = async (data) => {
  try {
    console.log('🔵 [QR Service Frontend] Llamando a POST /api/qr-asistencia/generar');
    console.log('🔵 [QR Service Frontend] Data enviada:', data);
    const response = await api.post('/api/qr-asistencia/generar', data);
    console.log('✅ [QR Service Frontend] QR generado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [QR Service Frontend] Error al generar QR:', error);
    console.error('❌ [QR Service Frontend] Error response:', error.response?.data);
    throw error.response?.data || error;
  }
};

/**
 * Obtener código QR activo
 */
export const obtenerQRActivo = async () => {
  try {
    console.log('🔵 [QR Service Frontend] Llamando a GET /api/qr-asistencia/activo');
    const response = await api.get('/api/qr-asistencia/activo');
    console.log('✅ [QR Service Frontend] Response status:', response.status);
    console.log('✅ [QR Service Frontend] Response data:', response.data);
    // El backend ahora devuelve 200 con data: null si no hay QR activo
    return response.data;
  } catch (error) {
    // Solo errores reales (500, etc.)
    console.error('❌ [QR Service Frontend] Error al obtener QR activo:', error);
    console.error('❌ [QR Service Frontend] Error response:', error.response);
    console.error('❌ [QR Service Frontend] Error data:', error.response?.data);
    console.error('❌ [QR Service Frontend] Error status:', error.response?.status);
    throw error.response?.data || error;
  }
};

/**
 * Obtener todos los códigos QR con filtros
 */
export const obtenerTodosQRs = async (params = {}) => {
  try {
    const response = await api.get('/api/qr-asistencia', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Obtener un QR específico por ID
 */
export const obtenerQRPorId = async (id) => {
  try {
    const response = await api.get(`/api/qr-asistencia/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Obtener estadísticas de un QR específico
 */
export const obtenerEstadisticas = async (id) => {
  try {
    const response = await api.get(`/api/qr-asistencia/${id}/estadisticas`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Obtener estadísticas generales de todos los QRs
 */
export const obtenerEstadisticasGenerales = async () => {
  try {
    console.log('🔵 [QR Service Frontend] Llamando a GET /api/qr-asistencia/estadisticas/general');
    const response = await api.get('/api/qr-asistencia/estadisticas/general');
    console.log('✅ [QR Service Frontend] Estadísticas recibidas:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [QR Service Frontend] Error al obtener estadísticas:', error);
    console.error('❌ [QR Service Frontend] Error response:', error.response?.data);
    throw error.response?.data || error;
  }
};

/**
 * Desactivar un código QR
 */
export const desactivarQR = async (id) => {
  try {
    const response = await api.put(`/api/qr-asistencia/${id}/desactivar`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Activar un código QR
 */
export const activarQR = async (id) => {
  try {
    const response = await api.put(`/api/qr-asistencia/${id}/activar`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Eliminar un código QR
 */
export const eliminarQR = async (id) => {
  try {
    const response = await api.delete(`/api/qr-asistencia/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Escanear código QR (Colaborador)
 */
export const escanearQR = async (data) => {
  try {
    const response = await api.post('/api/qr-asistencia/escanear', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Descargar imagen QR como archivo
 */
export const descargarQRComoImagen = (qrImageUrl, nombreArchivo = 'codigo-qr-asistencias.png') => {
  try {
    // Crear elemento <a> temporal
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error al descargar QR:', error);
    throw new Error('No se pudo descargar la imagen');
  }
};

/**
 * Imprimir QR
 */
export const imprimirQR = (qrImageUrl, titulo = 'Código QR - Asistencias') => {
  try {
    const ventana = window.open('', '_blank');
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${titulo}</title>
        <style>
          body {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            font-family: Arial, sans-serif;
          }
          h1 {
            color: #333;
            margin-bottom: 20px;
          }
          img {
            max-width: 500px;
            border: 2px solid #ddd;
            padding: 20px;
            background: white;
          }
          .instrucciones {
            margin-top: 20px;
            text-align: center;
            color: #666;
            max-width: 500px;
          }
        </style>
      </head>
      <body>
        <h1>${titulo}</h1>
        <img src="${qrImageUrl}" alt="Código QR" />
        <div class="instrucciones">
          <p><strong>Instrucciones:</strong></p>
          <p>Escanea este código QR con tu dispositivo móvil para registrar tu entrada y salida.</p>
        </div>
      </body>
      </html>
    `);
    ventana.document.close();
    ventana.print();
  } catch (error) {
    console.error('Error al imprimir QR:', error);
    throw new Error('No se pudo imprimir el código QR');
  }
};

export default {
  generarQR,
  obtenerQRActivo,
  obtenerTodosQRs,
  obtenerQRPorId,
  obtenerEstadisticas,
  obtenerEstadisticasGenerales,
  desactivarQR,
  activarQR,
  eliminarQR,
  escanearQR,
  descargarQRComoImagen,
  imprimirQR
};
