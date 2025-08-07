/**
 * Utilidades para limpiar y normalizar datos de préstamos
 */

/**
 * Limpia y normaliza un array de préstamos
 */
export const limpiarDatosPrestamos = (prestamos) => {
    if (!Array.isArray(prestamos)) {
        console.warn('⚠️ limpiarDatosPrestamos: Se esperaba un array, recibido:', typeof prestamos);
        return [];
    }

    return prestamos.map((prestamo, index) => {
        const prestamoLimpio = { ...prestamo };

        // 🔧 Normalizar estado
        if (!['aprobado', 'cancelado'].includes(prestamoLimpio.estado)) {
            console.warn(`⚠️ Estado inválido "${prestamoLimpio.estado}" en préstamo ${index}, normalizando a "aprobado"`);
            prestamoLimpio.estado = 'aprobado';
        }

        // 🔧 Asegurar que montoAprobado existe
        if (!prestamoLimpio.montoAprobado && prestamoLimpio.montoSolicitado) {
            prestamoLimpio.montoAprobado = prestamoLimpio.montoSolicitado;
        }

        // 🔧 Asegurar que fechaAprobacion existe si el estado es aprobado
        if (prestamoLimpio.estado === 'aprobado' && !prestamoLimpio.fechaAprobacion) {
            prestamoLimpio.fechaAprobacion = prestamoLimpio.fechaSolicitud || new Date().toISOString();
        }

        return prestamoLimpio;
    });
};

/**
 * Valida que un préstamo tenga la estructura correcta
 */
export const validarEstructuraPrestamo = (prestamo) => {
    const errores = [];

    // Validar campos requeridos
    const camposRequeridos = ['_id', 'codigo', 'montoSolicitado', 'tasaInteres', 'plazoMeses'];
    camposRequeridos.forEach(campo => {
        if (!prestamo[campo]) {
            errores.push(`Campo requerido faltante: ${campo}`);
        }
    });

    // Validar estado
    if (!['aprobado', 'cancelado'].includes(prestamo.estado)) {
        errores.push(`Estado inválido: ${prestamo.estado}`);
    }

    return errores;
};

export default {
    limpiarDatosPrestamos,
    validarEstructuraPrestamo
};
