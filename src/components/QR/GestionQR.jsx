/**
 * Componente GestionQR
 * Panel de administración para gestionar códigos QR de asistencias
 * 
 * Features:
 * - Generar nuevo QR
 * - Ver QR activo con imagen
 * - Descargar e imprimir QR
 * - Tabla de QRs históricos
 * - Estadísticas de uso
 * - Activar/Desactivar QRs
 */

import React, { useState, useEffect } from 'react';
import { 
  QrCode, Plus, Download, Printer, Eye, 
  Activity, BarChart3, Calendar, Users,
  CheckCircle, XCircle, Trash2, RefreshCw
} from 'lucide-react';
import { qrAsistenciaService } from '../../services';
import QRCodeDisplay from './QRCodeDisplay';
import ModalGenerarQR from './ModalGenerarQR';
import TablaQRs from './TablaQRs';
import EstadisticasQR from './EstadisticasQR';

const GestionQR = () => {
  // Estados
  const [loading, setLoading] = useState(false);
  const [qrActivo, setQrActivo] = useState(null);
  const [qrImageUrl, setQrImageUrl] = useState(null);
  const [modalGenerarAbierto, setModalGenerarAbierto] = useState(false);
  const [qrEditar, setQrEditar] = useState(null); // QR que se está editando
  const [estadisticasGenerales, setEstadisticasGenerales] = useState(null);
  const [qrs, setQrs] = useState([]);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  
  // Estado para tabs
  const [tabActivo, setTabActivo] = useState('actual'); // 'actual', 'historial', 'estadisticas'

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  /**
   * Cargar todos los datos
   */
  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Cargar QR activo
      await cargarQRActivo();
      
      // Cargar estadísticas generales
      await cargarEstadisticas();
      
      // Cargar historial de QRs
      await cargarHistorialQRs();
      
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cargar QR activo
   */
  const cargarQRActivo = async () => {
    try {
      const response = await qrAsistenciaService.obtenerQRActivo();
      
      if (response.success && response.data) {
        setQrActivo(response.data.qr);
        setQrImageUrl(response.data.qrImageUrl);
      } else {
        // No hay QR activo - esto es normal si no se ha generado ninguno
        setQrActivo(null);
        setQrImageUrl(null);
      }
    } catch (err) {
      // Solo mostrar error si es diferente a "no hay código QR activo"
      if (!err.message?.includes('No hay código QR activo')) {
        console.error('Error al cargar QR activo:', err);
      }
      setQrActivo(null);
      setQrImageUrl(null);
    }
  };

  /**
   * Cargar estadísticas generales
   */
  const cargarEstadisticas = async () => {
    try {
      const response = await qrAsistenciaService.obtenerEstadisticasGenerales();
      
      if (response.success) {
        setEstadisticasGenerales(response.data);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  /**
   * Cargar historial de QRs
   */
  const cargarHistorialQRs = async () => {
    try {
      const response = await qrAsistenciaService.obtenerTodosQRs({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      if (response.success) {
        setQrs(response.data);
      }
    } catch (err) {
      console.error('Error al cargar historial:', err);
    }
  };

  /**
   * Manejar generación de nuevo QR
   */
  const handleGenerarQR = async (datos) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await qrAsistenciaService.generarQR(datos);
      
      if (response.success) {
        setMensaje('Código QR generado exitosamente');
        setModalGenerarAbierto(false);
        
        // Recargar datos
        await cargarDatos();
        
        // Cambiar a tab actual para ver el nuevo QR
        setTabActivo('actual');
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setMensaje(null), 3000);
      }
      
    } catch (err) {
      console.error('Error al generar QR:', err);
      setError(err.message || 'Error al generar código QR');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Descargar QR como imagen
   */
  const handleDescargarQR = () => {
    if (!qrImageUrl) return;
    
    try {
      qrAsistenciaService.descargarQRComoImagen(
        qrImageUrl, 
        `qr-asistencias-${new Date().getTime()}.png`
      );
      setMensaje('QR descargado exitosamente');
      setTimeout(() => setMensaje(null), 3000);
    } catch (err) {
      setError('Error al descargar QR');
    }
  };

  /**
   * Imprimir QR
   */
  const handleImprimirQR = () => {
    if (!qrImageUrl) return;
    
    try {
      qrAsistenciaService.imprimirQR(qrImageUrl, qrActivo?.nombre || 'Código QR - Asistencias');
      setMensaje('Preparando impresión...');
      setTimeout(() => setMensaje(null), 3000);
    } catch (err) {
      setError('Error al imprimir QR');
    }
  };

  /**
   * Desactivar QR
   */
  const handleDesactivarQR = async (id) => {
    if (!confirm('¿Estás seguro de desactivar este código QR?')) return;
    
    try {
      setLoading(true);
      await qrAsistenciaService.desactivarQR(id);
      setMensaje('QR desactivado exitosamente');
      await cargarDatos();
      setTimeout(() => setMensaje(null), 3000);
    } catch (err) {
      setError(err.message || 'Error al desactivar QR');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Activar QR
   */
  const handleActivarQR = async (id) => {
    if (!confirm('¿Estás seguro de activar este código QR? Se desactivarán los demás.')) return;
    
    try {
      setLoading(true);
      await qrAsistenciaService.activarQR(id);
      setMensaje('QR activado exitosamente');
      await cargarDatos();
      setTimeout(() => setMensaje(null), 3000);
    } catch (err) {
      setError(err.message || 'Error al activar QR');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Eliminar QR
   */
  const handleEliminarQR = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este código QR? Esta acción no se puede deshacer.')) return;
    
    try {
      setLoading(true);
      await qrAsistenciaService.eliminarQR(id);
      setMensaje('QR eliminado exitosamente');
      await cargarDatos();
      setTimeout(() => setMensaje(null), 3000);
    } catch (err) {
      setError(err.message || 'Error al eliminar QR');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Abrir modal para editar QR
   */
  const handleEditarQR = (qr) => {
    setQrEditar(qr);
    setModalGenerarAbierto(true);
  };

  /**
   * Actualizar QR existente
   */
  const handleActualizarQR = async (id, datos) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await qrAsistenciaService.actualizarQR(id, datos);
      
      if (response.success) {
        setMensaje('Código QR actualizado exitosamente');
        setModalGenerarAbierto(false);
        setQrEditar(null);
        
        // Recargar datos
        await cargarDatos();
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setMensaje(null), 3000);
      }
      
    } catch (err) {
      console.error('Error al actualizar QR:', err);
      setError(err.message || 'Error al actualizar código QR');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cerrar modal y limpiar estado de edición
   */
  const handleCerrarModal = () => {
    setModalGenerarAbierto(false);
    setQrEditar(null);
  };

  /**
   * Ver detalles de un QR
   */
  const handleVerDetalles = async (qr) => {
    try {
      // Obtener estadísticas del QR específico
      const response = await qrAsistenciaService.obtenerEstadisticas(qr._id);
      
      if (response.success) {
        const stats = response.data;
        
        // Mostrar modal con información detallada
        alert(`
📊 DETALLES DEL CÓDIGO QR

Nombre: ${qr.nombre}
Sucursal: ${qr.sucursalNombre}
Estado: ${qr.activo ? 'Activo ✅' : 'Inactivo ❌'}

📈 Estadísticas:
• Total Escaneos: ${stats.totalEscaneos || 0}
• Entradas: ${stats.totalEntradas || 0}
• Salidas: ${stats.totalSalidas || 0}

📅 Fechas:
• Creado: ${new Date(qr.createdAt).toLocaleDateString('es-PE', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
• Creado por: ${qr.createdByName}
${qr.validoHasta ? `• Válido hasta: ${new Date(qr.validoHasta).toLocaleDateString('es-PE')}` : '• Sin fecha de expiración'}

⚙️ Configuración:
• Geolocalización: ${qr.configuracion?.requiereGeolocalizacion ? 'Requerida' : 'Opcional'}
• Horario: ${qr.configuracion?.horariosPermitidos?.horaInicio} - ${qr.configuracion?.horariosPermitidos?.horaFin}

${qr.notas ? `📝 Notas:\n${qr.notas}` : ''}
        `);
      }
    } catch (err) {
      alert('Error al obtener detalles: ' + (err.message || 'Error desconocido'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <QrCode size={32} className="text-blue-600" />
              Gestión de Códigos QR
            </h1>
            <p className="text-gray-600 mt-2">
              Administra los códigos QR para registro de asistencias
            </p>
          </div>
          
          <button
            onClick={() => setModalGenerarAbierto(true)}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            <span>Generar Nuevo QR</span>
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {mensaje && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="text-green-600" size={20} />
          <p className="text-green-800">{mensaje}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <XCircle className="text-red-600" size={20} />
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Estadísticas Rápidas */}
      {estadisticasGenerales && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <QrCode className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total QRs</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticasGenerales.totalQRs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Activity className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">QRs Activos</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticasGenerales.qrsActivos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Escaneos</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticasGenerales.totalEscaneos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Entradas/Salidas</p>
                <p className="text-lg font-bold text-gray-900">
                  {estadisticasGenerales.totalEntradas} / {estadisticasGenerales.totalSalidas}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setTabActivo('actual')}
            className={`
              px-4 py-2 font-medium transition-colors border-b-2
              ${tabActivo === 'actual'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
              }
            `}
          >
            QR Actual
          </button>
          
          <button
            onClick={() => setTabActivo('historial')}
            className={`
              px-4 py-2 font-medium transition-colors border-b-2
              ${tabActivo === 'historial'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
              }
            `}
          >
            Historial
          </button>
          
          <button
            onClick={() => setTabActivo('estadisticas')}
            className={`
              px-4 py-2 font-medium transition-colors border-b-2
              ${tabActivo === 'estadisticas'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
              }
            `}
          >
            Estadísticas
          </button>
        </div>
      </div>

      {/* Contenido según tab */}
      {tabActivo === 'actual' && (
        <QRCodeDisplay
          qrActivo={qrActivo}
          qrImageUrl={qrImageUrl}
          onDescargar={handleDescargarQR}
          onImprimir={handleImprimirQR}
          onDesactivar={() => handleDesactivarQR(qrActivo?._id)}
          onRecargar={cargarQRActivo}
          loading={loading}
        />
      )}

      {tabActivo === 'historial' && (
        <TablaQRs
          qrs={qrs}
          onActivar={handleActivarQR}
          onDesactivar={handleDesactivarQR}
          onEliminar={handleEliminarQR}
          onEditar={handleEditarQR}
          onRecargar={cargarHistorialQRs}
          onVerDetalles={handleVerDetalles}
          loading={loading}
        />
      )}

      {tabActivo === 'estadisticas' && (
        <EstadisticasQR
          estadisticas={estadisticasGenerales}
          loading={loading}
        />
      )}

      {/* Modal para generar/editar QR */}
      <ModalGenerarQR
        isOpen={modalGenerarAbierto}
        onClose={handleCerrarModal}
        onGenerar={handleGenerarQR}
        onActualizar={handleActualizarQR}
        qrEditar={qrEditar}
        loading={loading}
      />
    </div>
  );
};

export default GestionQR;
