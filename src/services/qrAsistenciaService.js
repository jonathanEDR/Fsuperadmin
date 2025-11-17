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
    const response = await api.post('/api/qr-asistencia/generar', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Obtener código QR activo
 */
export const obtenerQRActivo = async () => {
  try {
    const response = await api.get('/api/qr-asistencia/activo');
    // El backend ahora devuelve 200 con data: null si no hay QR activo
    return response.data;
  } catch (error) {
    // Solo errores reales (500, etc.)
    console.error('Error al obtener QR activo:', error);
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
    const response = await api.get('/api/qr-asistencia/estadisticas/general');
    return response.data;
  } catch (error) {
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
