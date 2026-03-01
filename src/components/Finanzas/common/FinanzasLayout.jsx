import React, { memo } from 'react';
import { Loader2 } from 'lucide-react';
import FinanzasNavigation from './FinanzasNavigation';
import { useFinanzasDashboard } from '../hooks/useFinanzasDashboard';

/**
 * Layout unificado para todos los módulos de finanzas
 * Incluye navegación global y contexto compartido
 */
const FinanzasLayout = memo(({ 
    children, 
    currentModule = '',
    showStats = false,
    title = '',
    actions = null,
    loading = false 
}) => {
    
    // Hook para estadísticas globales (solo si se requieren)
    const { estadisticas, loading: statsLoading } = useFinanzasDashboard(showStats);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navegación global de finanzas */}
            <FinanzasNavigation 
                currentModule={currentModule}
                showStats={showStats}
                estadisticas={estadisticas}
            />

            {/* Contenido principal */}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                {/* Header del módulo específico */}
                {title && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 py-4 sm:py-6">
                        <div>
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                                {title}
                            </h2>
                        </div>
                        
                        {/* Acciones específicas del módulo */}
                        {actions && (
                            <div className="flex items-center">
                                {actions}
                            </div>
                        )}
                    </div>
                )}

                {/* Contenido del módulo */}
                <main className={loading ? 'opacity-50 pointer-events-none' : ''}>
                    {children}
                </main>
            </div>

            {/* Loading overlay global */}
            {loading && (
                <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 shadow-xl">
                        <div className="flex items-center space-x-3">
                            <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
                            <span className="text-gray-700 font-medium">Cargando...</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

FinanzasLayout.displayName = 'FinanzasLayout';

export default FinanzasLayout;
