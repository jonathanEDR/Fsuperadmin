import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Error Boundary específico para errores de productos
 * Captura errores relacionados con productos null y los maneja graciosamente
 */
class ProductoErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    // Detectar si es un error relacionado con productos
    const isProductoError = error.message && (
      error.message.includes('Cannot read properties of null') ||
      error.message.includes('Cannot read properties of undefined') ||
      error.message.includes('nombre') ||
      error.message.includes('productoId')
    );

    if (isProductoError) {
      return { hasError: true };
    }

    // Si no es error de producto, dejar que otros boundaries lo manejen
    return null;
  }

  componentDidCatch(error, errorInfo) {
    // Solo manejar errores de productos
    const isProductoError = error.message && (
      error.message.includes('Cannot read properties of null') ||
      error.message.includes('Cannot read properties of undefined') ||
      error.message.includes('nombre') ||
      error.message.includes('productoId')
    );

    if (isProductoError) {
      console.error('🛡️ ProductoErrorBoundary: Error de producto capturado:', error);
      console.error('🛡️ ProductoErrorBoundary: Info del error:', errorInfo);
      
      this.setState({
        error,
        errorInfo,
        errorCount: this.state.errorCount + 1
      });

      // Reportar el error para análisis
      if (this.props.onError) {
        this.props.onError(error, errorInfo);
      }
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      // Si han ocurrido muchos errores, mostrar mensaje más severo
      if (this.state.errorCount > 3) {
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-800">
                Error Crítico de Datos
              </h3>
            </div>
            <div className="text-red-700 mb-4">
              <p className="mb-2">
                Se han detectado múltiples errores de datos. Esto puede indicar problemas en la base de datos.
              </p>
              <p className="text-sm">
                Por favor, contacta al administrador del sistema.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar Página
            </button>
          </div>
        );
      }

      // Error boundary normal
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 m-4">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-800">
              Error de Visualización
            </h3>
          </div>
          <div className="text-yellow-700 mb-4">
            <p className="mb-2">
              Hubo un problema al mostrar algunos productos. Esto puede deberse a datos incompletos.
            </p>
            <details className="text-sm">
              <summary className="cursor-pointer font-medium">Ver detalles técnicos</summary>
              <pre className="mt-2 p-2 bg-yellow-100 rounded text-xs overflow-auto">
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          </div>
          <div className="flex gap-2">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Intentar de nuevo
            </button>
            {this.props.fallback && (
              <button
                onClick={() => this.setState({ hasError: false })}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Modo simplificado
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ProductoErrorBoundary;
