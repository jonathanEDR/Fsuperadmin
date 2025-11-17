/**
 * Componente ModalGenerarQR
 * Modal con formulario para generar nuevos códigos QR
 */

import React, { useState } from 'react';
import { X, QrCode, MapPin, Clock, AlertCircle } from 'lucide-react';

const ModalGenerarQR = ({ isOpen, onClose, onGenerar, loading = false }) => {
  
  const [formData, setFormData] = useState({
    nombre: '',
    sucursal: '',
    validoHasta: '',
    notas: '',
    requiereGeolocalizacion: true,
    horaInicio: '06:00',
    horaFin: '23:00'
  });

  const [errores, setErrores] = useState({});

  // Cerrar modal y resetear formulario
  const handleCerrar = () => {
    setFormData({
      nombre: '',
      sucursal: '',
      validoHasta: '',
      notas: '',
      requiereGeolocalizacion: true,
      horaInicio: '06:00',
      horaFin: '23:00'
    });
    setErrores({});
    onClose();
  };

  // Validar formulario
  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    }

    if (!formData.sucursal.trim()) {
      nuevosErrores.sucursal = 'La sucursal es obligatoria';
    }

    if (formData.validoHasta) {
      const fechaSeleccionada = new Date(formData.validoHasta);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaSeleccionada < hoy) {
        nuevosErrores.validoHasta = 'La fecha debe ser futura';
      }
    }

    if (formData.horaInicio && formData.horaFin) {
      if (formData.horaInicio >= formData.horaFin) {
        nuevosErrores.horaInicio = 'La hora de inicio debe ser menor a la hora de fin';
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    // Preparar datos para enviar
    const datosQR = {
      nombre: formData.nombre.trim(),
      sucursal: formData.sucursal.trim(),
      notas: formData.notas.trim(),
      configuracion: {
        requiereGeolocalizacion: formData.requiereGeolocalizacion,
        horariosPermitidos: {
          horaInicio: formData.horaInicio,
          horaFin: formData.horaFin
        }
      }
    };

    // Solo incluir validoHasta si tiene valor
    if (formData.validoHasta) {
      datosQR.validoHasta = formData.validoHasta;
    }

    await onGenerar(datosQR);
  };

  // Manejar cambios en inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar error del campo al editar
    if (errores[name]) {
      setErrores(prev => {
        const nuevos = { ...prev };
        delete nuevos[name];
        return nuevos;
      });
    }
  };

  // Obtener fecha mínima (hoy)
  const getFechaMinima = () => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between sticky top-0">
          <div className="flex items-center gap-3">
            <QrCode size={32} />
            <h2 className="text-2xl font-bold">Generar Código QR</h2>
          </div>
          <button
            onClick={handleCerrar}
            disabled={loading}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              Información Básica
            </h3>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del QR <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: QR Sede Principal - Marzo 2025"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errores.nombre ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {errores.nombre && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errores.nombre}
                </p>
              )}
            </div>

            {/* Sucursal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sucursal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sucursal"
                value={formData.sucursal}
                onChange={handleChange}
                placeholder="Ej: Lima Centro, Arequipa, Trujillo"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errores.sucursal ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {errores.sucursal && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errores.sucursal}
                </p>
              )}
            </div>

            {/* Válido Hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Válido Hasta (Opcional)
              </label>
              <input
                type="date"
                name="validoHasta"
                value={formData.validoHasta}
                onChange={handleChange}
                min={getFechaMinima()}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errores.validoHasta ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {errores.validoHasta && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errores.validoHasta}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Deja vacío para que no expire
              </p>
            </div>
          </div>

          {/* Configuración de Horarios */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <Clock size={20} />
              Horarios Permitidos
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Hora Inicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora Inicio
                </label>
                <input
                  type="time"
                  name="horaInicio"
                  value={formData.horaInicio}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errores.horaInicio ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
              </div>

              {/* Hora Fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora Fin
                </label>
                <input
                  type="time"
                  name="horaFin"
                  value={formData.horaFin}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>
            {errores.horaInicio && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle size={14} />
                {errores.horaInicio}
              </p>
            )}
          </div>

          {/* Configuración Adicional */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <MapPin size={20} />
              Configuración Adicional
            </h3>

            {/* Requiere Geolocalización */}
            <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg">
              <input
                type="checkbox"
                name="requiereGeolocalizacion"
                id="requiereGeolocalizacion"
                checked={formData.requiereGeolocalizacion}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                disabled={loading}
              />
              <label htmlFor="requiereGeolocalizacion" className="flex-1 cursor-pointer">
                <span className="text-sm font-medium text-gray-900 block">
                  Requiere Geolocalización
                </span>
                <span className="text-xs text-gray-600">
                  El colaborador debe compartir su ubicación al escanear el QR
                </span>
              </label>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (Opcional)
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows="3"
              placeholder="Ej: Este QR es para el personal de la nueva sede..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={loading}
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCerrar}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <QrCode size={20} />
                  <span>Generar Código QR</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalGenerarQR;
