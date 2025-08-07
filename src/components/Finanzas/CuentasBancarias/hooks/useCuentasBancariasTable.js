import { useState, useMemo, useCallback } from 'react';

/**
 * Hook especializado para manejar lógica de tabla de cuentas bancarias
 * Gestiona selección, ordenamiento y procesamiento de datos
 */
export const useCuentasBancariasTable = ({ cuentas, onSeleccionChange }) => {
    const [filasSeleccionadas, setFilasSeleccionadas] = useState(new Set());
    const [ordenamiento, setOrdenamiento] = useState({ campo: null, direccion: 'asc' });

    // Asegurar que cuentas sea siempre un array
    const cuentasSeguras = useMemo(() => {
        return Array.isArray(cuentas) ? cuentas : [];
    }, [cuentas]);

    // Manejar selección de fila individual
    const manejarSeleccionFila = useCallback((id) => {
        const nuevasSeleccionadas = new Set(filasSeleccionadas);
        if (nuevasSeleccionadas.has(id)) {
            nuevasSeleccionadas.delete(id);
        } else {
            nuevasSeleccionadas.add(id);
        }
        setFilasSeleccionadas(nuevasSeleccionadas);
        onSeleccionChange?.(Array.from(nuevasSeleccionadas));
    }, [filasSeleccionadas, onSeleccionChange]);

    // Manejar selección de todas las filas
    const manejarSeleccionTodos = useCallback(() => {
        if (filasSeleccionadas.size === cuentasSeguras.length) {
            setFilasSeleccionadas(new Set());
            onSeleccionChange?.([]);
        } else {
            const todasLasIds = new Set(cuentasSeguras.map(cuenta => cuenta.id || cuenta._id));
            setFilasSeleccionadas(todasLasIds);
            onSeleccionChange?.(Array.from(todasLasIds));
        }
    }, [filasSeleccionadas.size, cuentasSeguras, onSeleccionChange]);

    // Manejar ordenamiento
    const manejarOrdenamiento = useCallback((campo) => {
        const nuevaDireccion = 
            ordenamiento.campo === campo && ordenamiento.direccion === 'asc' 
                ? 'desc' 
                : 'asc';
        setOrdenamiento({ campo, direccion: nuevaDireccion });
    }, [ordenamiento]);

    // Ordenar cuentas según criterio actual
    const cuentasOrdenadas = useMemo(() => {
        if (!ordenamiento.campo) {
            return cuentasSeguras;
        }

        return [...cuentasSeguras].sort((a, b) => {
            const valorA = a[ordenamiento.campo];
            const valorB = b[ordenamiento.campo];

            // Manejar valores nulos/undefined
            if (valorA == null && valorB == null) return 0;
            if (valorA == null) return ordenamiento.direccion === 'asc' ? 1 : -1;
            if (valorB == null) return ordenamiento.direccion === 'asc' ? -1 : 1;

            // Ordenamiento específico por tipo de campo
            let comparacion = 0;
            
            switch (ordenamiento.campo) {
                case 'saldoActual':
                    // Ordenamiento numérico para saldo
                    const saldoA = typeof valorA === 'number' ? valorA : parseFloat(valorA) || 0;
                    const saldoB = typeof valorB === 'number' ? valorB : parseFloat(valorB) || 0;
                    comparacion = saldoA - saldoB;
                    break;
                    
                case 'activa':
                    // Ordenamiento booleano (activas primero)
                    comparacion = valorB - valorA;
                    break;
                    
                default:
                    // Ordenamiento alfabético para strings
                    comparacion = String(valorA).localeCompare(String(valorB), 'es', { 
                        numeric: true, 
                        sensitivity: 'base' 
                    });
            }

            return ordenamiento.direccion === 'asc' ? comparacion : -comparacion;
        });
    }, [cuentasSeguras, ordenamiento]);

    // Limpiar selección cuando cambian las cuentas
    const resetearSeleccion = useCallback(() => {
        setFilasSeleccionadas(new Set());
        onSeleccionChange?.([]);
    }, [onSeleccionChange]);

    return {
        cuentasSeguras,
        filasSeleccionadas,
        ordenamiento,
        cuentasOrdenadas,
        manejarSeleccionFila,
        manejarSeleccionTodos,
        manejarOrdenamiento,
        resetearSeleccion
    };
};
