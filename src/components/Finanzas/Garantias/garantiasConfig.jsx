import React from 'react';

// ==================== CONFIGURACIÓN DE GARANTÍAS ====================

// ========== COLORES Y ETIQUETAS DE ESTADOS ==========
export const estadosColor = {
    'pendiente_evaluacion': {
        color: 'bg-yellow-100 text-yellow-800',
        label: 'Pendiente de Evaluación',
        icono: '⏳',
        borderColor: 'border-yellow-300'
    },
    'aprobada': {
        color: 'bg-blue-100 text-blue-800',
        label: 'Aprobada',
        icono: '✅',
        borderColor: 'border-blue-300'
    },
    'rechazada': {
        color: 'bg-red-100 text-red-800',
        label: 'Rechazada',
        icono: '❌',
        borderColor: 'border-red-300'
    },
    'activa': {
        color: 'bg-green-100 text-green-800',
        label: 'Activa',
        icono: '🔒',
        borderColor: 'border-green-300'
    },
    'liberada': {
        color: 'bg-gray-100 text-gray-800',
        label: 'Liberada',
        icono: '🔓',
        borderColor: 'border-gray-300'
    },
    'ejecutada': {
        color: 'bg-purple-100 text-purple-800',
        label: 'Ejecutada',
        icono: '⚖️',
        borderColor: 'border-purple-300'
    }
};

// ========== COLORES Y ETIQUETAS DE TIPOS ==========
export const tiposColor = {
    'hipotecaria': {
        color: 'bg-indigo-100 text-indigo-800',
        label: 'Hipotecaria',
        icono: '🏠'
    },
    'vehicular': {
        color: 'bg-cyan-100 text-cyan-800',
        label: 'Vehicular',
        icono: '🚗'
    },
    'fianza_personal': {
        color: 'bg-pink-100 text-pink-800',
        label: 'Fianza Personal',
        icono: '👤'
    },
    'deposito_garantia': {
        color: 'bg-emerald-100 text-emerald-800',
        label: 'Depósito de Garantía',
        icono: '💰'
    },
    'aval_bancario': {
        color: 'bg-violet-100 text-violet-800',
        label: 'Aval Bancario',
        icono: '🏦'
    },
    'prenda': {
        color: 'bg-amber-100 text-amber-800',
        label: 'Prenda',
        icono: '📦'
    },
    'warrant': {
        color: 'bg-teal-100 text-teal-800',
        label: 'Warrant',
        icono: '📜'
    },
    'otra': {
        color: 'bg-slate-100 text-slate-800',
        label: 'Otra',
        icono: '📋'
    }
};

// ========== VALORES INICIALES DE FORMULARIOS ==========
export const formularioInicialGarantia = {
    prestamoId: '',
    tipo: '',
    descripcion: '',
    bien: {
        nombre: '',
        descripcionDetallada: '',
        marca: '',
        modelo: '',
        año: '',
        numeroSerie: '',
        numeroMotor: '',
        numeroChasis: '',
        color: '',
        estado: 'usado_bueno'
    },
    ubicacion: {
        direccion: '',
        distrito: '',
        provincia: '',
        departamento: '',
        codigoPostal: '',
        referencia: ''
    },
    valores: {
        comercial: '',
        tasacion: '',
        realizacion: '',
        seguro: '',
        moneda: 'PEN'
    },
    propietario: {
        nombre: '',
        documento: {
            tipo: 'DNI',
            numero: ''
        },
        email: '',
        telefono: '',
        direccion: '',
        relacion: 'titular'
    },
    informacionLegal: {
        numeroRegistro: '',
        oficina: '',
        folio: '',
        asiento: '',
        partida: '',
        zona: '',
        fechaInscripcion: '',
        vigenciaInscripcion: ''
    },
    observaciones: ''
};

export const formularioInicialSeguro = {
    compania: '',
    numeroPoliza: '',
    tipo: 'todo_riesgo',
    cobertura: '',
    prima: '',
    moneda: 'PEN',
    fechaInicio: '',
    fechaVencimiento: '',
    beneficiario: ''
};

export const filtrosIniciales = {
    estado: '',
    tipo: '',
    prestamoId: '',
    valorMin: '',
    valorMax: '',
    buscar: ''
};

export const paginacionInicial = {
    paginaActual: 1,
    limite: 20
};

// ========== VALIDACIONES DE FORMULARIOS ==========
export const validacionesGarantia = {
    prestamoId: (valor) => !valor ? 'Debe seleccionar un préstamo asociado' : '',
    tipo: (valor) => !valor ? 'El tipo de garantía es requerido' : '',
    descripcion: (valor) => {
        if (!valor) return 'La descripción es requerida';
        if (valor.trim().length < 10) return 'La descripción debe tener al menos 10 caracteres';
        return '';
    },
    'bien.nombre': (valor) => {
        if (!valor) return 'El nombre del bien es requerido';
        if (valor.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres';
        return '';
    },
    'valores.comercial': (valor) => {
        if (!valor) return 'El valor comercial es requerido';
        if (isNaN(valor) || parseFloat(valor) <= 0) return 'Debe ser un monto válido mayor a 0';
        return '';
    },
    'propietario.nombre': (valor) => {
        if (!valor) return 'El nombre del propietario es requerido';
        if (valor.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres';
        return '';
    },
    'propietario.documento.tipo': (valor) => !valor ? 'El tipo de documento es requerido' : '',
    'propietario.documento.numero': (valor) => {
        if (!valor) return 'El número de documento es requerido';
        if (valor.trim().length < 8) return 'El documento debe tener al menos 8 caracteres';
        return '';
    }
};

export const validacionesSeguro = {
    compania: (valor) => !valor ? 'La compañía de seguros es requerida' : '',
    numeroPoliza: (valor) => !valor ? 'El número de póliza es requerido' : '',
    tipo: (valor) => !valor ? 'El tipo de seguro es requerido' : '',
    cobertura: (valor) => {
        if (!valor) return 'El monto de cobertura es requerido';
        if (isNaN(valor) || parseFloat(valor) <= 0) return 'Debe ser un monto válido mayor a 0';
        return '';
    },
    fechaVencimiento: (valor) => !valor ? 'La fecha de vencimiento es requerida' : ''
};

// ========== CONFIGURACIÓN DE COLUMNAS DE TABLA ==========
export const columnasGarantias = [
    {
        key: 'codigo',
        titulo: 'Código',
        ordenable: true,
        render: (valor) => (
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {valor}
            </span>
        )
    },
    {
        key: 'tipo',
        titulo: 'Tipo',
        ordenable: true,
        render: (valor) => {
            const config = tiposColor[valor] || tiposColor.otra;
            return (
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                    <span>{config.icono}</span>
                    <span>{config.label}</span>
                </span>
            );
        }
    },
    {
        key: 'bien.nombre',
        titulo: 'Bien',
        ordenable: true,
        render: (valor, fila) => (
            <div>
                <div className="font-medium text-gray-900">{valor || fila.bien?.nombre || '-'}</div>
                {fila.bien?.marca && (
                    <div className="text-xs text-gray-500">
                        {fila.bien.marca} {fila.bien.modelo && `- ${fila.bien.modelo}`}
                    </div>
                )}
            </div>
        )
    },
    {
        key: 'propietario.nombre',
        titulo: 'Propietario',
        ordenable: true,
        render: (valor, fila) => (
            <div>
                <div className="text-gray-900">{valor || fila.propietario?.nombre || '-'}</div>
                {fila.propietario?.documento && (
                    <div className="text-xs text-gray-500">
                        {fila.propietario.documento.tipo}: {fila.propietario.documento.numero}
                    </div>
                )}
            </div>
        )
    },
    {
        key: 'valores.comercial',
        titulo: 'Valor Comercial',
        ordenable: true,
        render: (valor, fila) => {
            const monto = valor || fila.valores?.comercial || 0;
            const moneda = fila.valores?.moneda || 'PEN';
            const simbolos = { 'PEN': 'S/', 'USD': '$', 'EUR': '€' };
            return (
                <div className="text-right">
                    <div className="font-semibold text-green-600">
                        {simbolos[moneda]} {parseFloat(monto).toLocaleString('es-PE', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </div>
                    {fila.valores?.tasacion && (
                        <div className="text-xs text-gray-500">
                            Tasación: {simbolos[moneda]} {parseFloat(fila.valores.tasacion).toLocaleString('es-PE', {
                                minimumFractionDigits: 2
                            })}
                        </div>
                    )}
                </div>
            );
        }
    },
    {
        key: 'estado',
        titulo: 'Estado',
        ordenable: true,
        render: (valor) => {
            const config = estadosColor[valor] || estadosColor.pendiente_evaluacion;
            return (
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                    <span>{config.icono}</span>
                    <span>{config.label}</span>
                </span>
            );
        }
    },
    {
        key: 'prestamoId',
        titulo: 'Préstamo',
        render: (valor, fila) => {
            if (!valor && !fila.prestamoId) return <span className="text-gray-400">-</span>;
            const prestamo = fila.prestamoId;
            if (typeof prestamo === 'object' && prestamo !== null) {
                return (
                    <div>
                        <div className="font-mono text-xs bg-blue-50 px-2 py-1 rounded text-blue-700">
                            {prestamo.codigo || 'Sin código'}
                        </div>
                        {prestamo.entidadFinanciera?.nombre && (
                            <div className="text-xs text-gray-500 mt-1">
                                {prestamo.entidadFinanciera.nombre}
                            </div>
                        )}
                    </div>
                );
            }
            return (
                <span className="font-mono text-xs bg-blue-50 px-2 py-1 rounded text-blue-700">
                    {valor}
                </span>
            );
        }
    },
    {
        key: 'createdAt',
        titulo: 'Fecha Registro',
        ordenable: true,
        render: (valor) => {
            if (!valor) return '-';
            return (
                <div className="text-sm text-gray-600">
                    {new Date(valor).toLocaleDateString('es-PE')}
                </div>
            );
        }
    }
];

// ========== CONFIGURACIÓN DE ACCIONES DE TABLA ==========
export const accionesGarantias = [
    {
        key: 'ver',
        label: 'Ver',
        icono: '👁️',
        color: 'gray',
        handler: 'verDetalles',
        className: 'bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-md transition-colors',
        tooltip: 'Ver detalles de la garantía',
        siempreVisible: true
    },
    {
        key: 'editar',
        label: 'Editar',
        icono: '✏️',
        color: 'blue',
        handler: 'editarGarantia',
        className: 'bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-md transition-colors',
        tooltip: 'Editar garantía',
        estadosPermitidos: ['pendiente_evaluacion', 'aprobada', 'rechazada']
    },
    {
        key: 'aprobar',
        label: 'Aprobar',
        icono: '✅',
        color: 'green',
        handler: 'aprobarGarantia',
        className: 'bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-md transition-colors',
        tooltip: 'Aprobar garantía',
        estadosPermitidos: ['pendiente_evaluacion']
    },
    {
        key: 'rechazar',
        label: 'Rechazar',
        icono: '❌',
        color: 'red',
        handler: 'rechazarGarantia',
        className: 'bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-md transition-colors',
        tooltip: 'Rechazar garantía',
        estadosPermitidos: ['pendiente_evaluacion', 'aprobada']
    },
    {
        key: 'activar',
        label: 'Activar',
        icono: '🔒',
        color: 'green',
        handler: 'activarGarantia',
        className: 'bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-md transition-colors',
        tooltip: 'Activar garantía',
        estadosPermitidos: ['aprobada']
    },
    {
        key: 'liberar',
        label: 'Liberar',
        icono: '🔓',
        color: 'yellow',
        handler: 'liberarGarantia',
        className: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 p-2 rounded-md transition-colors',
        tooltip: 'Liberar garantía',
        estadosPermitidos: ['activa']
    },
    {
        key: 'ejecutar',
        label: 'Ejecutar',
        icono: '⚖️',
        color: 'purple',
        handler: 'ejecutarGarantia',
        className: 'bg-purple-100 hover:bg-purple-200 text-purple-700 p-2 rounded-md transition-colors',
        tooltip: 'Ejecutar garantía',
        estadosPermitidos: ['activa']
    },
    {
        key: 'eliminar',
        label: 'Eliminar',
        icono: '🗑️',
        color: 'red',
        handler: 'eliminarGarantia',
        className: 'bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-md transition-colors',
        tooltip: 'Eliminar garantía',
        estadosPermitidos: ['pendiente_evaluacion', 'rechazada']
    }
];

// ========== OPCIONES PARA SELECTS ==========
export const opcionesTipoGarantia = [
    { value: 'hipotecaria', label: 'Hipotecaria', descripcion: 'Garantía sobre inmueble' },
    { value: 'vehicular', label: 'Vehicular', descripcion: 'Garantía sobre vehículo' },
    { value: 'fianza_personal', label: 'Fianza Personal', descripcion: 'Garantía personal de tercero' },
    { value: 'deposito_garantia', label: 'Depósito de Garantía', descripcion: 'Depósito en efectivo' },
    { value: 'aval_bancario', label: 'Aval Bancario', descripcion: 'Garantía bancaria' },
    { value: 'prenda', label: 'Prenda', descripcion: 'Garantía sobre bien mueble' },
    { value: 'warrant', label: 'Warrant', descripcion: 'Certificado de depósito' },
    { value: 'otra', label: 'Otra', descripcion: 'Otro tipo de garantía' }
];

export const opcionesEstadoGarantia = [
    { value: 'pendiente_evaluacion', label: 'Pendiente de Evaluación' },
    { value: 'aprobada', label: 'Aprobada' },
    { value: 'rechazada', label: 'Rechazada' },
    { value: 'activa', label: 'Activa' },
    { value: 'liberada', label: 'Liberada' },
    { value: 'ejecutada', label: 'Ejecutada' }
];

export const opcionesTipoDocumento = [
    { value: 'DNI', label: 'DNI' },
    { value: 'CE', label: 'Carnet de Extranjería' },
    { value: 'RUC', label: 'RUC' },
    { value: 'PASAPORTE', label: 'Pasaporte' }
];

export const opcionesRelacionPropietario = [
    { value: 'titular', label: 'Titular' },
    { value: 'conyuge', label: 'Cónyuge' },
    { value: 'familiar', label: 'Familiar' },
    { value: 'tercero', label: 'Tercero' },
    { value: 'empresa', label: 'Empresa' }
];

export const opcionesEstadoBien = [
    { value: 'nuevo', label: 'Nuevo' },
    { value: 'usado_excelente', label: 'Usado - Excelente' },
    { value: 'usado_bueno', label: 'Usado - Bueno' },
    { value: 'usado_regular', label: 'Usado - Regular' },
    { value: 'deteriorado', label: 'Deteriorado' }
];

export const opcionesTipoSeguro = [
    { value: 'todo_riesgo', label: 'Todo Riesgo' },
    { value: 'incendio', label: 'Incendio' },
    { value: 'robo', label: 'Robo' },
    { value: 'responsabilidad_civil', label: 'Responsabilidad Civil' },
    { value: 'vida', label: 'Vida' },
    { value: 'otro', label: 'Otro' }
];

export const opcionesTipoDocumentoGarantia = [
    { value: 'escritura', label: 'Escritura Pública' },
    { value: 'titulo', label: 'Título de Propiedad' },
    { value: 'tarjeta_propiedad', label: 'Tarjeta de Propiedad' },
    { value: 'certificado_registral', label: 'Certificado Registral' },
    { value: 'tasacion', label: 'Informe de Tasación' },
    { value: 'seguro', label: 'Póliza de Seguro' },
    { value: 'otro', label: 'Otro' }
];

export const opcionesMoneda = [
    { value: 'PEN', label: 'Soles (S/)', simbolo: 'S/' },
    { value: 'USD', label: 'Dólares ($)', simbolo: '$' },
    { value: 'EUR', label: 'Euros (€)', simbolo: '€' }
];

// ========== CAMPOS POR TIPO DE GARANTÍA ==========
export const camposPorTipo = {
    hipotecaria: ['ubicacion', 'informacionLegal', 'metraje', 'registrosPublicos'],
    vehicular: ['marca', 'modelo', 'año', 'placa', 'numeroMotor', 'numeroChasis', 'color'],
    fianza_personal: ['garante', 'relacionGarante', 'ingresos'],
    deposito_garantia: ['numeroCuenta', 'banco', 'tipoCuenta'],
    aval_bancario: ['bancoAval', 'montoAval', 'vigencia'],
    prenda: ['descripcionBien', 'ubicacionBien', 'estadoBien'],
    warrant: ['almacen', 'producto', 'cantidad', 'unidad'],
    otra: ['descripcionDetallada']
};

// ========== MENSAJES DE TEXTO ==========
export const mensajes = {
    confirmaciones: {
        aprobar: '¿Estás seguro de que quieres aprobar esta garantía?',
        rechazar: '¿Estás seguro de que quieres rechazar esta garantía? Ingresa el motivo del rechazo.',
        activar: '¿Estás seguro de que quieres activar esta garantía? Esto indica que el préstamo asociado ha sido desembolsado.',
        liberar: '¿Estás seguro de que quieres liberar esta garantía? Ingresa el motivo de la liberación.',
        ejecutar: '¿Estás seguro de que quieres ejecutar esta garantía? Esta acción es irreversible.',
        eliminar: '¿Estás seguro de que quieres eliminar esta garantía? Esta acción no se puede deshacer.'
    },
    exito: {
        crear: 'Garantía creada exitosamente',
        actualizar: 'Garantía actualizada exitosamente',
        aprobar: 'Garantía aprobada exitosamente',
        rechazar: 'Garantía rechazada exitosamente',
        activar: 'Garantía activada exitosamente',
        liberar: 'Garantía liberada exitosamente',
        ejecutar: 'Garantía ejecutada exitosamente',
        eliminar: 'Garantía eliminada exitosamente',
        agregarSeguro: 'Seguro agregado exitosamente'
    },
    error: {
        cargar: 'Error al cargar las garantías',
        crear: 'Error al crear la garantía',
        actualizar: 'Error al actualizar la garantía',
        aprobar: 'Error al aprobar la garantía',
        rechazar: 'Error al rechazar la garantía',
        activar: 'Error al activar la garantía',
        liberar: 'Error al liberar la garantía',
        ejecutar: 'Error al ejecutar la garantía',
        eliminar: 'Error al eliminar la garantía',
        agregarSeguro: 'Error al agregar el seguro'
    },
    info: {
        sinGarantias: 'No hay garantías registradas',
        sinResultados: 'No se encontraron garantías con los filtros aplicados',
        cargando: 'Cargando garantías...'
    }
};

// ========== UTILIDADES DE CONFIGURACIÓN ==========
export const getEstadoConfig = (estado) => {
    return estadosColor[estado] || estadosColor.pendiente_evaluacion;
};

export const getTipoConfig = (tipo) => {
    return tiposColor[tipo] || tiposColor.otra;
};

export const getAccionesDisponibles = (estado) => {
    return accionesGarantias.filter(accion => {
        if (accion.siempreVisible) return true;
        if (!accion.estadosPermitidos) return false;
        return accion.estadosPermitidos.includes(estado);
    });
};

export const formatearMoneda = (monto, moneda = 'PEN') => {
    const simbolos = { 'PEN': 'S/', 'USD': '$', 'EUR': '€' };
    return `${simbolos[moneda] || 'S/'} ${parseFloat(monto || 0).toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

export const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-PE');
};
