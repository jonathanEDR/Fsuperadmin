import React, { useEffect, useState, useRef } from 'react';
import { ClipboardList, Home, User, Coins, MapPin, Scale, Pencil, Plus, X } from 'lucide-react';
import { useGarantiaForm } from './hooks';
import {
    opcionesTipoGarantia,
    opcionesTipoDocumento,
    opcionesRelacionPropietario,
    opcionesEstadoBien,
    opcionesMoneda,
    mensajes
} from './garantiasConfig';

/**
 * Modal para crear o editar garantías
 */
const ModalGarantia = ({
    isOpen,
    onClose,
    garantia = null,
    modoEdicion = false,
    onGuardar,
    prestamos = [],
    loading = false
}) => {
    const [activeTab, setActiveTab] = useState('basico');
    const [guardando, setGuardando] = useState(false);
    const tabsContainerRef = useRef(null);

    const {
        valores,
        errores,
        tocados,
        manejarCambio,
        manejarCambioInput,
        manejarBlur,
        validarFormulario,
        resetearFormulario,
        cargarGarantia,
        prepararDatosEnvio,
        obtenerError,
        tieneError
    } = useGarantiaForm();

    // Cargar datos si es edición
    useEffect(() => {
        if (isOpen) {
            if (modoEdicion && garantia) {
                cargarGarantia(garantia);
            } else {
                resetearFormulario();
            }
            setActiveTab('basico');
        }
    }, [isOpen, modoEdicion, garantia, cargarGarantia, resetearFormulario]);

    // Manejar envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) {
            return;
        }

        setGuardando(true);
        try {
            const datos = prepararDatosEnvio();
            await onGuardar(datos);
            onClose();
        } catch (error) {
            console.error('Error guardando garantía:', error);
        } finally {
            setGuardando(false);
        }
    };

    // Tabs de navegación
    const tabs = [
        { id: 'basico', label: 'Información Básica', labelCorto: 'Básica', icono: <ClipboardList size={16} /> },
        { id: 'bien', label: 'Datos del Bien', labelCorto: 'Bien', icono: <Home size={16} /> },
        { id: 'propietario', label: 'Propietario', labelCorto: 'Dueño', icono: <User size={16} /> },
        { id: 'valores', label: 'Valores', labelCorto: 'Valores', icono: <Coins size={16} /> },
        { id: 'ubicacion', label: 'Ubicación', labelCorto: 'Ubicación', icono: <MapPin size={16} /> },
        { id: 'legal', label: 'Info. Legal', labelCorto: 'Legal', icono: <Scale size={16} /> }
    ];

    // Obtener índice del tab activo
    const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);

    // Navegación entre tabs
    const irAlTab = (direccion) => {
        const nuevoIndice = activeTabIndex + direccion;
        if (nuevoIndice >= 0 && nuevoIndice < tabs.length) {
            setActiveTab(tabs[nuevoIndice].id);
        }
    };

    // Scroll al tab activo en móvil
    useEffect(() => {
        if (tabsContainerRef.current) {
            const activeButton = tabsContainerRef.current.querySelector(`[data-tab="${activeTab}"]`);
            if (activeButton) {
                activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [activeTab]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-4xl max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-2xl">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <span>{modoEdicion ? <Pencil size={20} /> : <Plus size={20} />}</span>
                            <span>{modoEdicion ? 'Editar Garantía' : 'Nueva Garantía'}</span>
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/80 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 bg-white overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.icono}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {/* Tab: Información Básica */}
                            {activeTab === 'basico' && (
                                <div className="space-y-4">
                                    {/* Préstamo Asociado */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Préstamo Asociado <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="prestamoId"
                                            value={valores.prestamoId}
                                            onChange={manejarCambioInput}
                                            onBlur={() => manejarBlur('prestamoId')}
                                            className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 ${tieneError('prestamoId') ? 'border-red-500' : 'border-gray-200'
                                                }`}
                                            disabled={modoEdicion}
                                        >
                                            <option value="">Seleccionar préstamo...</option>
                                            {prestamos.map(prestamo => (
                                                <option key={prestamo._id} value={prestamo._id}>
                                                    {prestamo.codigo} - {prestamo.entidadFinanciera?.nombre || 'Sin entidad'} - S/ {parseFloat(prestamo.montoAprobado || prestamo.montoSolicitado || 0).toLocaleString()}
                                                </option>
                                            ))}
                                        </select>
                                        {obtenerError('prestamoId') && (
                                            <p className="mt-1 text-sm text-red-500">{obtenerError('prestamoId')}</p>
                                        )}
                                    </div>

                                    {/* Tipo de Garantía */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tipo de Garantía <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="tipo"
                                            value={valores.tipo}
                                            onChange={manejarCambioInput}
                                            onBlur={() => manejarBlur('tipo')}
                                            className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 ${tieneError('tipo') ? 'border-red-500' : 'border-gray-200'
                                                }`}
                                        >
                                            <option value="">Seleccionar tipo...</option>
                                            {opcionesTipoGarantia.map(tipo => (
                                                <option key={tipo.value} value={tipo.value}>
                                                    {tipo.label} - {tipo.descripcion}
                                                </option>
                                            ))}
                                        </select>
                                        {obtenerError('tipo') && (
                                            <p className="mt-1 text-sm text-red-500">{obtenerError('tipo')}</p>
                                        )}
                                    </div>

                                    {/* Descripción */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Descripción <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="descripcion"
                                            value={valores.descripcion}
                                            onChange={manejarCambioInput}
                                            onBlur={() => manejarBlur('descripcion')}
                                            rows={3}
                                            placeholder="Descripción detallada de la garantía..."
                                            className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 ${tieneError('descripcion') ? 'border-red-500' : 'border-gray-200'
                                                }`}
                                        />
                                        {obtenerError('descripcion') && (
                                            <p className="mt-1 text-sm text-red-500">{obtenerError('descripcion')}</p>
                                        )}
                                    </div>

                                    {/* Observaciones */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Observaciones
                                        </label>
                                        <textarea
                                            name="observaciones"
                                            value={valores.observaciones}
                                            onChange={manejarCambioInput}
                                            rows={2}
                                            placeholder="Observaciones adicionales..."
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Tab: Datos del Bien */}
                            {activeTab === 'bien' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Nombre del Bien */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nombre del Bien <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.bien.nombre}
                                                onChange={(e) => manejarCambio('bien.nombre', e.target.value)}
                                                onBlur={() => manejarBlur('bien.nombre')}
                                                placeholder="Ej: Casa de 2 pisos, Toyota Corolla 2020..."
                                                className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 ${tieneError('bien.nombre') ? 'border-red-500' : 'border-gray-200'
                                                    }`}
                                            />
                                            {obtenerError('bien.nombre') && (
                                                <p className="mt-1 text-sm text-red-500">{obtenerError('bien.nombre')}</p>
                                            )}
                                        </div>

                                        {/* Marca */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Marca
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.bien.marca}
                                                onChange={(e) => manejarCambio('bien.marca', e.target.value)}
                                                placeholder="Ej: Toyota, Samsung..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Modelo */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Modelo
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.bien.modelo}
                                                onChange={(e) => manejarCambio('bien.modelo', e.target.value)}
                                                placeholder="Ej: Corolla, Galaxy S21..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Año */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Año
                                            </label>
                                            <input
                                                type="number"
                                                value={valores.bien.año}
                                                onChange={(e) => manejarCambio('bien.año', e.target.value)}
                                                placeholder="2024"
                                                min="1900"
                                                max="2100"
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Estado del Bien */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Estado del Bien
                                            </label>
                                            <select
                                                value={valores.bien.estado}
                                                onChange={(e) => manejarCambio('bien.estado', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            >
                                                {opcionesEstadoBien.map(estado => (
                                                    <option key={estado.value} value={estado.value}>
                                                        {estado.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Color */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Color
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.bien.color}
                                                onChange={(e) => manejarCambio('bien.color', e.target.value)}
                                                placeholder="Ej: Blanco, Negro..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Número de Serie */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Número de Serie
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.bien.numeroSerie}
                                                onChange={(e) => manejarCambio('bien.numeroSerie', e.target.value)}
                                                placeholder="Número de serie..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Número de Motor (para vehículos) */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Número de Motor
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.bien.numeroMotor}
                                                onChange={(e) => manejarCambio('bien.numeroMotor', e.target.value)}
                                                placeholder="Solo para vehículos..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Número de Chasis (para vehículos) */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Número de Chasis
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.bien.numeroChasis}
                                                onChange={(e) => manejarCambio('bien.numeroChasis', e.target.value)}
                                                placeholder="Solo para vehículos..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Descripción Detallada */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Descripción Detallada del Bien
                                            </label>
                                            <textarea
                                                value={valores.bien.descripcionDetallada}
                                                onChange={(e) => manejarCambio('bien.descripcionDetallada', e.target.value)}
                                                rows={3}
                                                placeholder="Características adicionales del bien..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab: Propietario */}
                            {activeTab === 'propietario' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Nombre del Propietario */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nombre Completo <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.propietario.nombre}
                                                onChange={(e) => manejarCambio('propietario.nombre', e.target.value)}
                                                onBlur={() => manejarBlur('propietario.nombre')}
                                                placeholder="Nombre completo del propietario..."
                                                className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 ${tieneError('propietario.nombre') ? 'border-red-500' : 'border-gray-200'
                                                    }`}
                                            />
                                            {obtenerError('propietario.nombre') && (
                                                <p className="mt-1 text-sm text-red-500">{obtenerError('propietario.nombre')}</p>
                                            )}
                                        </div>

                                        {/* Tipo de Documento */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tipo de Documento <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={valores.propietario.documento.tipo}
                                                onChange={(e) => manejarCambio('propietario.documento.tipo', e.target.value)}
                                                onBlur={() => manejarBlur('propietario.documento.tipo')}
                                                className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 ${tieneError('propietario.documento.tipo') ? 'border-red-500' : 'border-gray-200'
                                                    }`}
                                            >
                                                {opcionesTipoDocumento.map(tipo => (
                                                    <option key={tipo.value} value={tipo.value}>
                                                        {tipo.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Número de Documento */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Número de Documento <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.propietario.documento.numero}
                                                onChange={(e) => manejarCambio('propietario.documento.numero', e.target.value)}
                                                onBlur={() => manejarBlur('propietario.documento.numero')}
                                                placeholder="Número de documento..."
                                                className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 ${tieneError('propietario.documento.numero') ? 'border-red-500' : 'border-gray-200'
                                                    }`}
                                            />
                                            {obtenerError('propietario.documento.numero') && (
                                                <p className="mt-1 text-sm text-red-500">{obtenerError('propietario.documento.numero')}</p>
                                            )}
                                        </div>

                                        {/* Relación con el Titular */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Relación con el Titular
                                            </label>
                                            <select
                                                value={valores.propietario.relacion}
                                                onChange={(e) => manejarCambio('propietario.relacion', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            >
                                                {opcionesRelacionPropietario.map(relacion => (
                                                    <option key={relacion.value} value={relacion.value}>
                                                        {relacion.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Teléfono */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Teléfono
                                            </label>
                                            <input
                                                type="tel"
                                                value={valores.propietario.telefono}
                                                onChange={(e) => manejarCambio('propietario.telefono', e.target.value)}
                                                placeholder="999 999 999"
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={valores.propietario.email}
                                                onChange={(e) => manejarCambio('propietario.email', e.target.value)}
                                                placeholder="correo@ejemplo.com"
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Dirección */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Dirección
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.propietario.direccion}
                                                onChange={(e) => manejarCambio('propietario.direccion', e.target.value)}
                                                placeholder="Dirección del propietario..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab: Valores */}
                            {activeTab === 'valores' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Moneda */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Moneda
                                            </label>
                                            <select
                                                value={valores.valores.moneda}
                                                onChange={(e) => manejarCambio('valores.moneda', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            >
                                                {opcionesMoneda.map(moneda => (
                                                    <option key={moneda.value} value={moneda.value}>
                                                        {moneda.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Espacio vacío para alineación */}
                                        <div></div>

                                        {/* Valor Comercial */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Valor Comercial <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                                                    {opcionesMoneda.find(m => m.value === valores.valores.moneda)?.simbolo || 'S/'}
                                                </span>
                                                <input
                                                    type="number"
                                                    value={valores.valores.comercial}
                                                    onChange={(e) => manejarCambio('valores.comercial', e.target.value)}
                                                    onBlur={() => manejarBlur('valores.comercial')}
                                                    placeholder="0.00"
                                                    min="0"
                                                    step="0.01"
                                                    className={`w-full pl-10 pr-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 ${tieneError('valores.comercial') ? 'border-red-500' : 'border-gray-200'
                                                        }`}
                                                />
                                            </div>
                                            {obtenerError('valores.comercial') && (
                                                <p className="mt-1 text-sm text-red-500">{obtenerError('valores.comercial')}</p>
                                            )}
                                            <p className="mt-1 text-xs text-gray-500">Valor de mercado actual del bien</p>
                                        </div>

                                        {/* Valor de Tasación */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Valor de Tasación
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                                                    {opcionesMoneda.find(m => m.value === valores.valores.moneda)?.simbolo || 'S/'}
                                                </span>
                                                <input
                                                    type="number"
                                                    value={valores.valores.tasacion}
                                                    onChange={(e) => manejarCambio('valores.tasacion', e.target.value)}
                                                    placeholder="0.00"
                                                    min="0"
                                                    step="0.01"
                                                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">Valor determinado por tasador oficial</p>
                                        </div>

                                        {/* Valor de Realización */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Valor de Realización
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                                                    {opcionesMoneda.find(m => m.value === valores.valores.moneda)?.simbolo || 'S/'}
                                                </span>
                                                <input
                                                    type="number"
                                                    value={valores.valores.realizacion}
                                                    onChange={(e) => manejarCambio('valores.realizacion', e.target.value)}
                                                    placeholder="0.00"
                                                    min="0"
                                                    step="0.01"
                                                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">Valor estimado de venta rápida (80% del comercial)</p>
                                        </div>

                                        {/* Valor del Seguro */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Valor Asegurado
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                                                    {opcionesMoneda.find(m => m.value === valores.valores.moneda)?.simbolo || 'S/'}
                                                </span>
                                                <input
                                                    type="number"
                                                    value={valores.valores.seguro}
                                                    onChange={(e) => manejarCambio('valores.seguro', e.target.value)}
                                                    placeholder="0.00"
                                                    min="0"
                                                    step="0.01"
                                                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">Suma asegurada en póliza</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab: Ubicación */}
                            {activeTab === 'ubicacion' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Dirección */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Dirección
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.ubicacion.direccion}
                                                onChange={(e) => manejarCambio('ubicacion.direccion', e.target.value)}
                                                placeholder="Av. Principal 123..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Distrito */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Distrito
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.ubicacion.distrito}
                                                onChange={(e) => manejarCambio('ubicacion.distrito', e.target.value)}
                                                placeholder="Ej: Miraflores, San Isidro..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Provincia */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Provincia
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.ubicacion.provincia}
                                                onChange={(e) => manejarCambio('ubicacion.provincia', e.target.value)}
                                                placeholder="Ej: Lima, Callao..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Departamento */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Departamento
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.ubicacion.departamento}
                                                onChange={(e) => manejarCambio('ubicacion.departamento', e.target.value)}
                                                placeholder="Ej: Lima, Arequipa..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Código Postal */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Código Postal
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.ubicacion.codigoPostal}
                                                onChange={(e) => manejarCambio('ubicacion.codigoPostal', e.target.value)}
                                                placeholder="15001"
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Referencia */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Referencia
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.ubicacion.referencia}
                                                onChange={(e) => manejarCambio('ubicacion.referencia', e.target.value)}
                                                placeholder="Cerca al parque central, frente a..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab: Información Legal */}
                            {activeTab === 'legal' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Número de Registro */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Número de Registro
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.informacionLegal.numeroRegistro}
                                                onChange={(e) => manejarCambio('informacionLegal.numeroRegistro', e.target.value)}
                                                placeholder="N° de partida registral..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Oficina Registral */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Oficina Registral
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.informacionLegal.oficina}
                                                onChange={(e) => manejarCambio('informacionLegal.oficina', e.target.value)}
                                                placeholder="SUNARP Lima, Zona Registral IX..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Partida */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Partida
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.informacionLegal.partida}
                                                onChange={(e) => manejarCambio('informacionLegal.partida', e.target.value)}
                                                placeholder="N° de partida..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Asiento */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Asiento
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.informacionLegal.asiento}
                                                onChange={(e) => manejarCambio('informacionLegal.asiento', e.target.value)}
                                                placeholder="N° de asiento..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Folio */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Folio
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.informacionLegal.folio}
                                                onChange={(e) => manejarCambio('informacionLegal.folio', e.target.value)}
                                                placeholder="N° de folio..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Zona */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Zona Registral
                                            </label>
                                            <input
                                                type="text"
                                                value={valores.informacionLegal.zona}
                                                onChange={(e) => manejarCambio('informacionLegal.zona', e.target.value)}
                                                placeholder="Zona IX - Sede Lima..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Fecha de Inscripción */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Fecha de Inscripción
                                            </label>
                                            <input
                                                type="date"
                                                value={valores.informacionLegal.fechaInscripcion}
                                                onChange={(e) => manejarCambio('informacionLegal.fechaInscripcion', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Vigencia de Inscripción */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Vigencia de Inscripción
                                            </label>
                                            <input
                                                type="date"
                                                value={valores.informacionLegal.vigenciaInscripcion}
                                                onChange={(e) => manejarCambio('informacionLegal.vigenciaInscripcion', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                disabled={guardando}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                disabled={guardando || loading}
                            >
                                {guardando ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Guardando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{modoEdicion ? 'Actualizar' : 'Crear'} Garantía</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ModalGarantia;
