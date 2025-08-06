# Módulo de Préstamos - Documentación

## 📋 Descripción General

El módulo de Préstamos es una implementación modular y escalable para la gestión integral de préstamos financieros. Sigue el patrón de arquitectura establecido en el módulo CuentasBancarias, proporcionando una estructura mantenible y reutilizable.

## 🏗️ Arquitectura

### Estructura de Archivos
```
src/components/Finanzas/Prestamos/
├── index.js                     # Barrel exports
├── prestamosConfig.js          # Configuración centralizada
├── PrestamosCore.jsx           # Hook principal con lógica de negocio
├── TablaPrestamos.jsx          # Componente tabla + tarjetas resumen
├── ModalPrestamo.jsx           # Modal crear/editar préstamo
├── ModalCalculadoraCuota.jsx   # Modal calculadora de cuotas
├── ModalTablaAmortizacion.jsx  # Modal tabla de amortización
└── README.md                   # Esta documentación
```

### Patrón de Diseño
- **Separación de responsabilidades**: Cada componente tiene una función específica
- **Hook personalizado**: `usePrestamos` centraliza toda la lógica de estado y negocio
- **Configuración centralizada**: `prestamosConfig.js` contiene todas las configuraciones
- **Barrel exports**: `index.js` facilita las importaciones

## 🔧 Componentes Principales

### 1. `usePrestamos` (Hook Principal)
**Ubicación**: `PrestamosCore.jsx`

**Responsabilidades**:
- Gestión de estado (préstamos, modales, formularios)
- Operaciones CRUD (crear, leer, actualizar, eliminar)
- Manejo de modales y navegación
- Cálculos financieros (cuotas, amortización)
- Comunicación con APIs

**Estado expuesto**:
```javascript
const {
    // Estado de datos
    prestamos, loading, error,
    
    // Estado de modales
    modalPrestamo, modalCalculadora, modalAmortizacion,
    prestamoEditando, calculoCuota, tablaAmortizacion,
    
    // Funciones CRUD
    handleCrear, handleEditar, handleEliminar, handleGuardar,
    
    // Funciones de modales
    abrirModalCrear, abrirModalEditar, cerrarModalPrestamo,
    abrirCalculadora, cerrarCalculadora,
    abrirAmortizacion, cerrarAmortizacion,
    
    // Funciones de cálculo
    calcularCuota, generarTablaAmortizacion
} = usePrestamos();
```

### 2. `TablaPrestamos`
**Propósito**: Componente principal que combina tabla de datos con tarjetas de resumen.

**Características**:
- Tarjetas de estadísticas financieras
- Tabla responsiva con acciones
- Cálculos automáticos de totales
- Mensajes de estado vacío personalizado

**Props**:
```javascript
{
    prestamos: Array,          // Lista de préstamos
    loading: Boolean,          // Estado de carga
    onEdit: Function,          // Callback para editar
    onDelete: Function,        // Callback para eliminar
    onVerAmortizacion: Function // Callback para ver amortización
}
```

### 3. `ModalPrestamo`
**Propósito**: Modal para crear y editar préstamos.

**Características**:
- Formulario multi-sección (entidad, prestatario, préstamo)
- Validaciones en tiempo real
- Autocompletado y sugerencias
- Manejo de estado editando vs creando

### 4. `ModalCalculadoraCuota`
**Propósito**: Calculadora financiera para simular cuotas.

**Características**:
- Cálculos matemáticos precisos
- Resultados en tiempo real
- Validación de parámetros
- Formateo de moneda peruano

### 5. `ModalTablaAmortizacion`
**Propósito**: Visualización detallada de amortización.

**Características**:
- Tabla cronológica de pagos
- Resumen de totales
- Opción de exportación (PDF/Excel)
- Información del préstamo

## ⚙️ Configuración (`prestamosConfig.js`)

### Estructura de Configuración
```javascript
// Valores por defecto para formularios
export const valoresDefecto = { ... }

// Reglas de validación
export const validacionesPrestamo = { ... }

// Definición de columnas de tabla
export const columnasPrestamos = [ ... ]

// Columnas para tabla de amortización
export const columnasAmortizacion = [ ... ]

// Opciones de selección
export const tiposPrestamo = [ ... ]
export const estadosPrestamo = [ ... ]
export const tiposEntidadFinanciera = [ ... ]
export const tiposDocumento = [ ... ]

// Configuración de colores
export const estadosColor = { ... }
```

## 🎨 Integración con UI

### Importación Simplificada
```javascript
// Importación usando barrel exports
import { 
    usePrestamos, 
    TablaPrestamos, 
    ModalPrestamo, 
    ModalCalculadoraCuota, 
    ModalTablaAmortizacion 
} from '../components/Finanzas/Prestamos';
```

### Uso en Página Principal
```javascript
const PrestamosPage = () => {
    const {
        prestamos, loading,
        modalPrestamo, abrirModalCrear,
        // ... otros valores del hook
    } = usePrestamos();

    return (
        <div>
            <TablaPrestamos 
                prestamos={prestamos}
                loading={loading}
                onEdit={abrirModalEditar}
                // ... otras props
            />
            
            <ModalPrestamo 
                isOpen={modalPrestamo}
                onClose={cerrarModalPrestamo}
                // ... otras props
            />
            
            {/* Otros modales */}
        </div>
    );
};
```

## 🔄 Flujo de Datos

### 1. Carga Inicial
1. Hook `usePrestamos` se inicializa
2. `useEffect` ejecuta `cargarPrestamos()`
3. Datos se cargan desde API (`prestamosService`)
4. Estado se actualiza y componentes re-renderizan

### 2. Operaciones CRUD
1. Usuario interactúa con UI (botones, formularios)
2. Función correspondiente del hook es llamada
3. Hook actualiza estado local y ejecuta llamada API
4. Respuesta actualiza estado global
5. UI se re-renderiza con nuevos datos

### 3. Cálculos Financieros
1. Usuario ingresa parámetros en calculadora
2. Hook valida datos de entrada
3. Cálculos se ejecutan (cuota, amortización)
4. Resultados se almacenan en estado
5. Modal muestra resultados formateados

## 📱 Características de UX

### Responsividad
- Grid adaptativo para tarjetas de resumen
- Tabla responsiva con scroll horizontal
- Modales que se ajustan a viewport

### Feedback Visual
- Estados de carga con spinners
- Mensajes de error contextuales
- Confirmaciones de acciones destructivas
- Iconos descriptivos en toda la UI

### Accesibilidad
- Labels semánticos en formularios
- Contraste adecuado en colores
- Navegación por teclado
- Roles ARIA donde corresponde

## 🧪 Testing y Validación

### Validaciones Implementadas
- Campos requeridos en formularios
- Validación de tipos de datos (números, fechas)
- Rangos válidos para montos y tasas
- Formato de documentos de identidad

### Casos de Prueba Sugeridos
1. Crear préstamo con datos válidos
2. Editar préstamo existente
3. Eliminar préstamo con confirmación
4. Calcular cuota con diferentes parámetros
5. Generar tabla de amortización
6. Manejo de errores de red
7. Validación de formularios

## 🚀 Escalabilidad y Mantenimiento

### Ventajas del Patrón Modular
- **Reutilización**: Componentes independientes reutilizables
- **Mantenibilidad**: Cambios aislados no afectan otros módulos
- **Testing**: Cada pieza se puede probar independientemente
- **Colaboración**: Diferentes desarrolladores pueden trabajar en módulos específicos

### Extensiones Futuras
- Reportes y análisis de préstamos
- Integración con sistemas de pagos
- Notificaciones automáticas de vencimientos
- Dashboard de riesgo crediticio
- Módulo de garantías y avales

## 📋 Checklist de Implementación

### ✅ Completado
- [x] Configuración centralizada (`prestamosConfig.js`)
- [x] Hook principal (`PrestamosCore.jsx`)
- [x] Tabla con resumen (`TablaPrestamos.jsx`)
- [x] Modal crear/editar (`ModalPrestamo.jsx`)
- [x] Modal calculadora (`ModalCalculadoraCuota.jsx`)
- [x] Modal amortización (`ModalTablaAmortizacion.jsx`)
- [x] Barrel exports (`index.js`)
- [x] Documentación (`README.md`)

### 🔄 Pendiente de Integración
- [ ] Reemplazar `PrestamosPage.jsx` original con versión modular
- [ ] Actualizar rutas si es necesario
- [ ] Validar integración con servicios backend
- [ ] Testing de funcionamiento completo
- [ ] Ajustes de estilos finales

## 💡 Notas Técnicas

### Dependencias Externas
- React (hooks, components)
- Servicio `prestamosService` (API calls)
- Componente `TablaFinanciera` (tabla base)
- Utilidades de formato de moneda

### Compatibilidad
- Compatible con React 16.8+ (hooks)
- Responsive design para móviles
- Navegadores modernos (ES6+)

### Performance
- Memoización en cálculos complejos
- Lazy loading de componentes modales
- Optimización de re-renders con `useMemo`

---

## 🎯 Siguiente Paso

El módulo está **listo para integración**. Usar `PrestamosPageModular.jsx` como referencia para reemplazar la implementación actual.
