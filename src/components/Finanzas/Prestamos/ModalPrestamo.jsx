import React, { useState, useEffect } from 'react';
import CampoPrestamos from './CampoPrestamos';
import {
    opcionesTipoEntidad,
    opcionesTipoInteres,
    opcionesPeriodoInteres,
    opcionesUnidadPlazo,
    opcionesTipoPrestatario,
    opcionesTipoDocumento,
    opcionesTipoDescuento,
    opcionesPeriodoDescuento
} from './prestamosConfig.jsx';
import PrestamosService from '../../../services/prestamosService';

const ModalPrestamo = ({
    isOpen,
    onClose,
    onSubmit,
    formulario,
    prestamoEditando,
    loading,
    trabajadores = [],
    onBuscarTrabajador,
    onSeleccionarTrabajador,
    loadingTrabajadores = false
}) => {
    const [mostrarBuscadorTrabajador, setMostrarBuscadorTrabajador] = useState(false);
    const [busquedaTrabajador, setBusquedaTrabajador] = useState('');
    const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState(null);

    // Resetear estado cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            setMostrarBuscadorTrabajador(false);
            setBusquedaTrabajador('');
            setTrabajadorSeleccionado(null);
        }
    }, [isOpen]);

    // Manejar cambio de tipo de prestatario
    useEffect(() => {
        const tipoPrestatario = formulario.valores.tipoPrestatario;
        if (tipoPrestatario === 'trabajador') {
            setMostrarBuscadorTrabajador(true);
        } else {
            setMostrarBuscadorTrabajador(false);
            setTrabajadorSeleccionado(null);
        }
    }, [formulario.valores.tipoPrestatario]);

    if (!isOpen) return null;

    const tiposPrestamo = PrestamosService.obtenerTiposPrestamo();
    const tipoPrestatario = formulario.valores.tipoPrestatario || 'particular';
    const esTrabajador = tipoPrestatario === 'trabajador';
    const mostrarDescuentoNomina = esTrabajador && formulario.valores.prestatarioRef;

    // Manejar búsqueda de trabajadores
    const handleBuscarTrabajador = (e) => {
        const valor = e.target.value;
        setBusquedaTrabajador(valor);
        if (onBuscarTrabajador && valor.length >= 2) {
            onBuscarTrabajador(valor);
        }
    };

    // Manejar selección de trabajador
    const handleSeleccionarTrabajador = (trabajador) => {
        setTrabajadorSeleccionado(trabajador);
        setBusquedaTrabajador('');
        if (onSeleccionarTrabajador) {
            onSeleccionarTrabajador(trabajador);
        }
        // Actualizar formulario con datos del trabajador
        formulario.manejarCambio({
            target: { name: 'prestatarioRef', value: trabajador._id }
        });
        formulario.manejarCambio({
            target: { name: 'prestatario.nombre', value: trabajador.nombreCompleto || `${trabajador.nombre} ${trabajador.apellido}` }
        });
        formulario.manejarCambio({
            target: { name: 'prestatario.documento', value: trabajador.documento || '' }
        });
        formulario.manejarCambio({
            target: { name: 'prestatario.telefono', value: trabajador.telefono || '' }
        });
        formulario.manejarCambio({
            target: { name: 'prestatario.email', value: trabajador.email || '' }
        });
    };

    // Limpiar trabajador seleccionado
    const handleLimpiarTrabajador = () => {
        setTrabajadorSeleccionado(null);
        formulario.manejarCambio({
            target: { name: 'prestatarioRef', value: null }
        });
        formulario.manejarCambio({
            target: { name: 'prestatario.nombre', value: '' }
        });
        formulario.manejarCambio({
            target: { name: 'prestatario.documento', value: '' }
        });
        formulario.manejarCambio({
            target: { name: 'prestatario.telefono', value: '' }
        });
        formulario.manejarCambio({
            target: { name: 'prestatario.email', value: '' }
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">
                            {prestamoEditando ? 'Editar Préstamo' : 'Nuevo Préstamo'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors"
                        >
                            <span className="text-2xl">&times;</span>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <form onSubmit={onSubmit} className="p-6">
                    {/* Tipo de Prestatario */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-6">
                            👤 Tipo de Prestatario
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CampoPrestamos
                                name="tipoPrestatario"
                                label="Tipo de Prestatario"
                                type="select"
                                value={tipoPrestatario}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores.tipoPrestatario}
                                options={opcionesTipoPrestatario}
                                required
                            />
                        </div>

                        {/* Buscador de Trabajadores */}
                        {esTrabajador && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="text-md font-medium text-blue-800 mb-3">
                                    Seleccionar Trabajador
                                </h4>

                                {trabajadorSeleccionado ? (
                                    <div className="flex items-center justify-between bg-white p-3 rounded-md border border-blue-300">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                                                {(trabajadorSeleccionado.nombre || '?')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">
                                                    {trabajadorSeleccionado.nombreCompleto || `${trabajadorSeleccionado.nombre} ${trabajadorSeleccionado.apellido}`}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {trabajadorSeleccionado.cargo || 'Sin cargo'} - {trabajadorSeleccionado.documento || 'Sin documento'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleLimpiarTrabajador}
                                            className="text-red-500 hover:text-red-700 px-3 py-1 rounded border border-red-300 hover:bg-red-50"
                                        >
                                            Cambiar
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={busquedaTrabajador}
                                            onChange={handleBuscarTrabajador}
                                            placeholder="Buscar por nombre, documento o cargo..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />

                                        {loadingTrabajadores && (
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                            </div>
                                        )}

                                        {/* Lista de trabajadores */}
                                        {trabajadores.length > 0 && busquedaTrabajador.length >= 2 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                {trabajadores.map((trabajador) => (
                                                    <button
                                                        key={trabajador._id}
                                                        type="button"
                                                        onClick={() => handleSeleccionarTrabajador(trabajador)}
                                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                                                                {(trabajador.nombre || '?')[0].toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-800">
                                                                    {trabajador.nombreCompleto || `${trabajador.nombre} ${trabajador.apellido}`}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {trabajador.cargo || 'Sin cargo'} | {trabajador.documento || 'Sin documento'}
                                                                    {trabajador.sueldoBase && (
                                                                        <span className="ml-2 text-green-600">
                                                                            S/ {trabajador.sueldoBase.toLocaleString()}
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {busquedaTrabajador.length >= 2 && trabajadores.length === 0 && !loadingTrabajadores && (
                                            <p className="mt-2 text-sm text-gray-500">
                                                No se encontraron trabajadores
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Información del Prestatario (para particulares u otros) */}
                        {!esTrabajador && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <CampoPrestamos
                                    name="prestatario.nombre"
                                    label="Nombre del Prestatario"
                                    value={formulario.valores.prestatario?.nombre || ''}
                                    onChange={formulario.manejarCambio}
                                    error={formulario.errores['prestatario.nombre']}
                                    required
                                    placeholder="Nombre completo"
                                />

                                <CampoPrestamos
                                    name="prestatario.tipoDocumento"
                                    label="Tipo de Documento"
                                    type="select"
                                    value={formulario.valores.prestatario?.tipoDocumento || 'DNI'}
                                    onChange={formulario.manejarCambio}
                                    error={formulario.errores['prestatario.tipoDocumento']}
                                    options={opcionesTipoDocumento}
                                />

                                <CampoPrestamos
                                    name="prestatario.documento"
                                    label="Número de Documento"
                                    value={formulario.valores.prestatario?.documento || ''}
                                    onChange={formulario.manejarCambio}
                                    error={formulario.errores['prestatario.documento']}
                                    placeholder="Ej: 12345678"
                                />

                                <CampoPrestamos
                                    name="prestatario.telefono"
                                    label="Teléfono"
                                    value={formulario.valores.prestatario?.telefono || ''}
                                    onChange={formulario.manejarCambio}
                                    error={formulario.errores['prestatario.telefono']}
                                    placeholder="Ej: 987654321"
                                />

                                <CampoPrestamos
                                    name="prestatario.email"
                                    label="Email"
                                    type="email"
                                    value={formulario.valores.prestatario?.email || ''}
                                    onChange={formulario.manejarCambio}
                                    error={formulario.errores['prestatario.email']}
                                    placeholder="ejemplo@correo.com"
                                />

                                <CampoPrestamos
                                    name="prestatario.direccion"
                                    label="Dirección"
                                    value={formulario.valores.prestatario?.direccion || ''}
                                    onChange={formulario.manejarCambio}
                                    error={formulario.errores['prestatario.direccion']}
                                    placeholder="Dirección completa"
                                />
                            </div>
                        )}
                    </div>

                    {/* Información de la Entidad Financiera */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-6">
                            🏦 Entidad Financiera
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <CampoPrestamos
                                name="entidadFinanciera.nombre"
                                label="Nombre de la Entidad"
                                value={formulario.valores.entidadFinanciera?.nombre || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores['entidadFinanciera.nombre']}
                                required
                                placeholder="Ej: Banco de Crédito del Perú"
                            />

                            <CampoPrestamos
                                name="entidadFinanciera.codigo"
                                label="Código de la Entidad"
                                value={formulario.valores.entidadFinanciera?.codigo || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores['entidadFinanciera.codigo']}
                                placeholder="Ej: BCP"
                            />

                            <CampoPrestamos
                                name="entidadFinanciera.tipo"
                                label="Tipo de Entidad"
                                type="select"
                                value={formulario.valores.entidadFinanciera?.tipo || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores['entidadFinanciera.tipo']}
                                options={opcionesTipoEntidad}
                            />
                        </div>
                    </div>

                    {/* Información del Préstamo */}
                    <div className="mt-6 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                            💰 Detalles del Préstamo
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <CampoPrestamos
                                name="tipoCredito"
                                label="Tipo de Crédito"
                                type="select"
                                value={formulario.valores.tipoCredito || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores.tipoCredito}
                                required
                                options={tiposPrestamo}
                            />

                            <CampoPrestamos
                                name="montoSolicitado"
                                label="Monto Solicitado"
                                type="number"
                                value={formulario.valores.montoSolicitado || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores.montoSolicitado}
                                required
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                            />

                            <CampoPrestamos
                                name="tasaInteres.porcentaje"
                                label="Tasa de Interés (%)"
                                type="number"
                                value={formulario.valores.tasaInteres?.porcentaje || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores['tasaInteres.porcentaje']}
                                required
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                max="100"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <CampoPrestamos
                                name="tasaInteres.tipo"
                                label="Tipo de Tasa"
                                type="select"
                                value={formulario.valores.tasaInteres?.tipo || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores['tasaInteres.tipo']}
                                options={opcionesTipoInteres}
                            />

                            <CampoPrestamos
                                name="tasaInteres.periodo"
                                label="Período de Tasa"
                                type="select"
                                value={formulario.valores.tasaInteres?.periodo || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores['tasaInteres.periodo']}
                                options={opcionesPeriodoInteres}
                            />

                            <CampoPrestamos
                                name="plazo.cantidad"
                                label="Plazo"
                                type="number"
                                value={formulario.valores.plazo?.cantidad || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores['plazo.cantidad']}
                                required
                                placeholder="12"
                                min="1"
                            />

                            <CampoPrestamos
                                name="plazo.unidad"
                                label="Unidad de Plazo"
                                type="select"
                                value={formulario.valores.plazo?.unidad || ''}
                                onChange={formulario.manejarCambio}
                                error={formulario.errores['plazo.unidad']}
                                options={opcionesUnidadPlazo}
                            />
                        </div>
                    </div>

                    {/* Descuento de Nómina (solo para trabajadores) */}
                    {mostrarDescuentoNomina && (
                        <div className="mt-6 space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                                💼 Descuento de Nómina
                            </h3>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start gap-2">
                                    <span className="text-yellow-600">⚠️</span>
                                    <p className="text-sm text-yellow-800">
                                        Al habilitar el descuento de nómina, las cuotas del préstamo se descontarán
                                        automáticamente del sueldo del trabajador según la configuración establecida.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <input
                                    type="checkbox"
                                    id="descuentoNomina.aplicable"
                                    name="descuentoNomina.aplicable"
                                    checked={formulario.valores.descuentoNomina?.aplicable || false}
                                    onChange={(e) => formulario.manejarCambio({
                                        target: {
                                            name: 'descuentoNomina.aplicable',
                                            value: e.target.checked
                                        }
                                    })}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="descuentoNomina.aplicable" className="text-gray-700 font-medium">
                                    Aplicar descuento de nómina
                                </label>
                            </div>

                            {formulario.valores.descuentoNomina?.aplicable && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <CampoPrestamos
                                        name="descuentoNomina.tipoDescuento"
                                        label="Tipo de Descuento"
                                        type="select"
                                        value={formulario.valores.descuentoNomina?.tipoDescuento || 'cuota_completa'}
                                        onChange={formulario.manejarCambio}
                                        error={formulario.errores['descuentoNomina.tipoDescuento']}
                                        options={opcionesTipoDescuento}
                                    />

                                    {formulario.valores.descuentoNomina?.tipoDescuento === 'porcentaje' && (
                                        <CampoPrestamos
                                            name="descuentoNomina.porcentaje"
                                            label="Porcentaje a Descontar (%)"
                                            type="number"
                                            value={formulario.valores.descuentoNomina?.porcentaje || ''}
                                            onChange={formulario.manejarCambio}
                                            error={formulario.errores['descuentoNomina.porcentaje']}
                                            placeholder="30"
                                            min="1"
                                            max="100"
                                        />
                                    )}

                                    {formulario.valores.descuentoNomina?.tipoDescuento === 'monto_fijo' && (
                                        <CampoPrestamos
                                            name="descuentoNomina.montoFijo"
                                            label="Monto Fijo a Descontar"
                                            type="number"
                                            value={formulario.valores.descuentoNomina?.montoFijo || ''}
                                            onChange={formulario.manejarCambio}
                                            error={formulario.errores['descuentoNomina.montoFijo']}
                                            placeholder="500.00"
                                            step="0.01"
                                            min="0"
                                        />
                                    )}

                                    <CampoPrestamos
                                        name="descuentoNomina.periodoDescuento"
                                        label="Período de Descuento"
                                        type="select"
                                        value={formulario.valores.descuentoNomina?.periodoDescuento || 'mensual'}
                                        onChange={formulario.manejarCambio}
                                        error={formulario.errores['descuentoNomina.periodoDescuento']}
                                        options={opcionesPeriodoDescuento}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Información Adicional */}
                    <div className="mt-6 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                            📝 Información Adicional
                        </h3>

                        <CampoPrestamos
                            name="proposito"
                            label="Propósito del Préstamo"
                            type="textarea"
                            value={formulario.valores.proposito || ''}
                            onChange={formulario.manejarCambio}
                            error={formulario.errores.proposito}
                            placeholder="Describe el propósito del préstamo..."
                            rows={3}
                        />

                        <CampoPrestamos
                            name="observaciones"
                            label="Observaciones"
                            type="textarea"
                            value={formulario.valores.observaciones || ''}
                            onChange={formulario.manejarCambio}
                            error={formulario.errores.observaciones}
                            placeholder="Observaciones adicionales..."
                            rows={3}
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Guardando...' : (prestamoEditando ? 'Actualizar' : 'Crear')} Préstamo
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalPrestamo;
