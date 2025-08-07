/**
 * Configuración centralizada para debugging
 */
export const DEBUG_CONFIG = {
    // Control general de debugging
    enabled: process.env.NODE_ENV === 'development',
    
    // Módulos específicos
    modules: {
        prestamos: true,
        formularios: true,
        servicios: false,
        validaciones: false
    },
    
    // Tipos de logs
    types: {
        info: true,
        warning: true,
        error: true,
        debug: false
    }
};

/**
 * Logger centralizado
 */
export const logger = {
    info: (module, message, data = null) => {
        if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.modules[module] && DEBUG_CONFIG.types.info) {
            console.log(`ℹ️ [${module.toUpperCase()}] ${message}`, data || '');
        }
    },
    
    warning: (module, message, data = null) => {
        if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.modules[module] && DEBUG_CONFIG.types.warning) {
            console.warn(`⚠️ [${module.toUpperCase()}] ${message}`, data || '');
        }
    },
    
    error: (module, message, data = null) => {
        if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.modules[module] && DEBUG_CONFIG.types.error) {
            console.error(`❌ [${module.toUpperCase()}] ${message}`, data || '');
        }
    },
    
    debug: (module, message, data = null) => {
        if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.modules[module] && DEBUG_CONFIG.types.debug) {
            console.log(`🔧 [${module.toUpperCase()}] ${message}`, data || '');
        }
    },
    
    success: (module, message, data = null) => {
        if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.modules[module]) {
            console.log(`✅ [${module.toUpperCase()}] ${message}`, data || '');
        }
    }
};

export default logger;
