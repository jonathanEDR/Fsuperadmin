import { useMemo } from 'react';

/**
 * Hook para opciones predefinidas del formulario
 * Separado para mejor modularidad y reutilización
 */
export const useFormOptions = () => {
    
    // Opciones predefinidas memoizadas
    const formOptions = useMemo(() => ({
        tiposCuenta: [
            { value: 'corriente', label: 'Cuenta Corriente' },
            { value: 'ahorros', label: 'Cuenta de Ahorros' },
            { value: 'plazo_fijo', label: 'Plazo Fijo' },
            { value: 'inversiones', label: 'Cuenta de Inversiones' }
        ],
        monedas: [
            { value: 'PEN', label: 'Soles (PEN)' },
            { value: 'USD', label: 'Dólares (USD)' },
            { value: 'EUR', label: 'Euros (EUR)' }
        ],
        bancos: [
            { value: 'BCP', label: 'Banco de Crédito del Perú' },
            { value: 'BBVA', label: 'BBVA Continental' },
            { value: 'Interbank', label: 'Interbank' },
            { value: 'Scotiabank', label: 'Scotiabank Perú' },
            { value: 'BanBif', label: 'BanBif' },
            { value: 'Banco_Pichincha', label: 'Banco Pichincha' },
            { value: 'Otro', label: 'Otro Banco' }
        ]
    }), []);
    
    return {
        formOptions
    };
};
