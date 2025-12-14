/**
 * Modal para crear y editar asistencias
 * 
 * Features:
 * - Crear nueva asistencia
 * - Editar asistencia existente
 * - Validación de datos
 * - Selección de colaborador
 * - Selección de fecha
 * - Estado de asistencia
 * - Horarios entrada/salida
 * - Justificación y permisos
 * 
 * IMPORTANTE: Usa zona horaria de Perú (America/Lima UTC-5)
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { asistenciaService } from '../../../services';
import { useAuth } from '@clerk/clerk-react';

/**
 * Convertir hora local de Perú a UTC (ISO)
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {string} hora - Hora en formato HH:mm
 * @returns {string} - Fecha/hora en formato ISO UTC
 */
const convertirHoraPeruAUTC = (fecha, hora) => {
  if (!fecha || !hora) return null;
  
  // Asegurar que la hora tenga segundos
  const horaNormalizada = hora.includes(':') && hora.split(':').length === 2 
    ? `${hora}:00` 
    : hora;
  
  // Construir string con offset de Perú (-05:00)
  const fechaHoraPerú = `${fecha}T${horaNormalizada}-05:00`;
  const fechaUTC = new Date(fechaHoraPerú);
  return fechaUTC.toISOString();
};

const ModalAsistencia = ({
  isOpen,
  onClose,
  onSubmit,
  onUpdate,
  modo = 'crear', // 'crear' | 'editar' | 'ver'
  asistencia = null,
  colaboradores = [],
  colaboradorPreseleccionado = null,
  fechaPreseleccionada = null
}) => {
  
  const { userId } = useAuth();
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    colaboradorUserId: '',
    fecha: '',
    horaEntrada: '',
    horaSalida: '',
    estado: 'presente',
    tipoRegistro: 'manual_admin',
    tienePermiso: false,
    motivoPermiso: ''
  });
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Inicializar formulario
  useEffect(() => {
    if (isOpen) {
      if (modo === 'editar' && asistencia) {
        // Modo editar: cargar datos de asistencia existente
        setFormData({
          colaboradorUserId: asistencia.colaboradorUserId || '',
          fecha: formatDateForInput(asistencia.fecha),
          horaEntrada: formatTimeForInput(asistencia.horaEntrada),
          horaSalida: formatTimeForInput(asistencia.horaSalida),
          estado: asistencia.estado || 'presente',
          tipoRegistro: asistencia.tipoRegistro || 'manual_admin',
          tienePermiso: asistencia.tienePermiso || false,
          motivoPermiso: asistencia.motivoPermiso || ''
        });
      } else {
        // Modo crear: valores por defecto - Con zona horaria de Perú
        const hoy = new Date();
        const fechaHoyPeru = hoy.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
        const fechaDefault = fechaPreseleccionada 
          ? formatDateForInput(fechaPreseleccionada)
          : fechaHoyPeru;
        
        setFormData({
          colaboradorUserId: colaboradorPreseleccionado?.clerk_id || '',
          fecha: fechaDefault,
          horaEntrada: '08:00:00',
          horaSalida: '',
          estado: 'presente',
          tipoRegistro: 'manual_admin',
          tienePermiso: false,
          motivoPermiso: ''
        });
      }
      setError(null);
    }
  }, [isOpen, modo, asistencia, colaboradorPreseleccionado, fechaPreseleccionada]);
  
  // Formatear fecha para input - Con zona horaria de Perú
  const formatDateForInput = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    // Usar toLocaleDateString con formato 'en-CA' para obtener YYYY-MM-DD en hora de Perú
    return date.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  };
  
  // Formatear hora para input (considerando zona horaria de Perú) - CON SEGUNDOS
  const formatTimeForInput = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    
    // Formatear usando zona horaria de Perú incluyendo segundos
    const horaPerú = date.toLocaleString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/Lima'
    });
    
    return horaPerú;
  };
  
  // Manejar cambio en inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar error al escribir
    if (error) setError(null);
  };
  
  // Validar formulario
  const validarFormulario = () => {
    if (!formData.colaboradorUserId) {
      setError('Debe seleccionar un colaborador');
      return false;
    }
    
    if (!formData.fecha) {
      setError('Debe seleccionar una fecha');
      return false;
    }
    
    if (formData.horaEntrada && formData.horaSalida) {
      const entrada = new Date(`${formData.fecha}T${formData.horaEntrada}`);
      const salida = new Date(`${formData.fecha}T${formData.horaSalida}`);
      
      if (salida <= entrada) {
        setError('La hora de salida debe ser posterior a la hora de entrada');
        return false;
      }
    }
    
    if (formData.tienePermiso && !formData.motivoPermiso.trim()) {
      setError('Debe especificar el motivo del permiso');
      return false;
    }
    
    return true;
  };
  
  // Manejar submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Construir objeto de datos
      const datos = {
        colaboradorUserId: formData.colaboradorUserId,
        fecha: formData.fecha,
        estado: formData.estado,
        tipoRegistro: formData.tipoRegistro,
        tienePermiso: formData.tienePermiso,
        motivoPermiso: formData.motivoPermiso
      };
      
      // Agregar horarios si están presentes (convertir de hora Perú a UTC)
      if (formData.horaEntrada) {
        datos.horaEntrada = convertirHoraPeruAUTC(formData.fecha, formData.horaEntrada);
      }
      
      if (formData.horaSalida) {
        datos.horaSalida = convertirHoraPeruAUTC(formData.fecha, formData.horaSalida);
      }
      
      if (modo === 'editar') {
        await onUpdate(asistencia._id, datos);
      } else {
        await onSubmit(datos);
      }
      
      onClose();
      
    } catch (err) {
      console.error('Error al guardar asistencia:', err);
      setError(err.response?.data?.message || err.message || 'Error al guardar asistencia');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  // Obtener colaborador seleccionado
  const colaboradorSeleccionado = colaboradores.find(
    c => c.clerk_id === formData.colaboradorUserId
  );
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {modo === 'editar' ? 'Editar Asistencia' : 'Nueva Asistencia'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {/* Colaborador */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="inline mr-1" />
              Colaborador *
            </label>
            <select
              name="colaboradorUserId"
              value={formData.colaboradorUserId}
              onChange={handleChange}
              disabled={modo === 'editar' || loading}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Seleccionar colaborador...</option>
              {colaboradores.map(colaborador => (
                <option key={colaborador.clerk_id} value={colaborador.clerk_id}>
                  {colaborador.nombre_negocio} - {colaborador.email}
                </option>
              ))}
            </select>
            {colaboradorSeleccionado && (
              <div className="mt-2 text-sm text-gray-600">
                Departamento: {colaboradorSeleccionado.departamento || 'No especificado'}
              </div>
            )}
          </div>
          
          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              Fecha *
            </label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              disabled={loading}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Horarios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} className="inline mr-1" />
                Hora Entrada
              </label>
              <input
                type="time"
                name="horaEntrada"
                value={formData.horaEntrada}
                onChange={handleChange}
                disabled={loading}
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} className="inline mr-1" />
                Hora Salida
              </label>
              <input
                type="time"
                name="horaSalida"
                value={formData.horaSalida}
                onChange={handleChange}
                disabled={loading}
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado *
            </label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              disabled={loading}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="presente">Presente</option>
              <option value="ausente">Ausente</option>
              <option value="tardanza">Tardanza</option>
              <option value="permiso">Permiso</option>
              <option value="falta_justificada">Falta Justificada</option>
              <option value="falta_injustificada">Falta Injustificada</option>
            </select>
          </div>
          
          {/* Permiso */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="tienePermiso"
                checked={formData.tienePermiso}
                onChange={handleChange}
                disabled={loading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Tiene permiso autorizado
              </span>
            </label>
          </div>
          
          {/* Motivo del permiso */}
          {formData.tienePermiso && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo del permiso *
              </label>
              <textarea
                name="motivoPermiso"
                value={formData.motivoPermiso}
                onChange={handleChange}
                disabled={loading}
                rows={3}
                placeholder="Especifique el motivo del permiso..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          )}
          
          {/* Acciones */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{modo === 'editar' ? 'Actualizar' : 'Registrar'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalAsistencia;
