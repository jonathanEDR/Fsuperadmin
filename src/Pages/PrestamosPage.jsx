import React from 'react';
import { PrestamosOptimizado } from '../components/Finanzas/Prestamos/PrestamosOptimizado';
import FinanzasLayout from '../components/Finanzas/common/FinanzasLayout';

/**
 * Página de Préstamos actualizada
 * Usa el componente PrestamosOptimizado que incluye:
 * - Dos botones separados: "Préstamo Recibido" y "Préstamo Otorgado"
 * - Modales específicos para cada tipo de préstamo
 * - Filtros por tipo de préstamo
 * - Integración con movimientos de caja
 */
const PrestamosPage = () => {
    try {
        return (
            <FinanzasLayout
                currentModule="prestamos"
                title="Gestión de Préstamos"
                loading={false}
                actions={null} // Las acciones están dentro de PrestamosOptimizado
            >
                <PrestamosOptimizado />
            </FinanzasLayout>
        );
    } catch (error) {
        console.error('🚨 Error en PrestamosPage:', error);
        return (
            <FinanzasLayout
                currentModule="prestamos"
                title="Gestión de Préstamos - Error"
                loading={false}
                actions={null}
            >
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <h2 className="font-bold text-lg">Error en la página de préstamos</h2>
                    <p>Por favor, revisa la consola para más detalles.</p>
                    <pre className="mt-2 text-sm">{error.message}</pre>
                </div>
            </FinanzasLayout>
        );
    }
};

export default PrestamosPage;
