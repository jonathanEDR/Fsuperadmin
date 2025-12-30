# Módulo de Préstamos - Documentación

## Descripción General

El módulo de Préstamos permite la gestión integral de dos tipos de préstamos:
- **Préstamos Recibidos**: Dinero que recibes de un banco o financiera (INGRESO a caja)
- **Préstamos Otorgados**: Dinero que prestas a trabajadores, clientes o terceros (EGRESO de caja)

## Estructura de Archivos

```
src/components/Finanzas/Prestamos/
├── index.js                        # Barrel exports consolidado
├── prestamosConfig.jsx             # Configuración centralizada
├── PrestamosOptimizado.jsx         # Componente principal
├── hooks/
│   ├── usePrestamoForm.js          # Hook para gestión de formularios
│   ├── usePrestamosData.js         # Hook para datos y CRUD
│   └── usePrestamosModals.js       # Hook para gestión de modales
├── components/
│   ├── PrestamosTable.jsx          # Tabla de préstamos
│   ├── PrestamosFilters.jsx        # Filtros avanzados
│   └── PrestamosResumen.jsx        # Tarjetas de resumen
├── ModalPrestamo.jsx               # Modal para préstamos RECIBIDOS
├── ModalPrestamoOtorgado.jsx       # Modal para préstamos OTORGADOS
├── ModalCalculadoraCuota.jsx       # Calculadora de cuotas
├── ModalTablaAmortizacion.jsx      # Modal tabla de amortización
├── ModalDetallesPrestamo.jsx       # Modal detalles del préstamo
├── TablaPrestamosEspecifica.jsx    # Tabla genérica reutilizable
├── TablaAmortizacion.jsx           # Componente tabla amortización
├── CampoPrestamos.jsx              # Componente de campo reutilizable
└── README.md                       # Esta documentación
```

## Arquitectura

### Hooks Especializados

#### `usePrestamoForm`
Gestión de formularios con validación y transformación de datos.

```javascript
const {
    formData,
    errors,
    isSubmitting,
    manejarCambio,
    validateForm,
    transformToBackend,
    transformFromBackend,
    resetForm
} = usePrestamoForm();
```

#### `usePrestamosData`
Gestión de datos, operaciones CRUD y búsqueda de trabajadores.

```javascript
const {
    prestamosData,
    resumenPrestamos,
    filtros,
    paginacionInfo,
    crearPrestamo,
    actualizarPrestamo,
    cancelarPrestamo,
    trabajadores,
    buscarTrabajadores
} = usePrestamosData();
```

#### `usePrestamosModals`
Control de estado de modales y cálculos.

```javascript
const {
    modalAbierto,
    modalPrestamoOtorgado,
    modalCalculadora,
    abrirModalNuevo,
    abrirModalPrestamoOtorgado,
    cerrarModal,
    calcularCuota
} = usePrestamosModals();
```

## Flujo de Préstamos

### Préstamo Recibido (de banco/financiera)
1. Usuario hace clic en "Préstamo Recibido"
2. Se abre `ModalPrestamo.jsx`
3. Se configura `tipoPrestatario = 'interno'`
4. Al guardar, se crea automáticamente un **INGRESO** en movimientos de caja

### Préstamo Otorgado (a trabajador/tercero)
1. Usuario hace clic en "Préstamo Otorgado"
2. Se abre `ModalPrestamoOtorgado.jsx`
3. Se configura `tipoPrestatario = 'trabajador' | 'particular' | etc.`
4. Se configura `entidadFinanciera = 'Caja Propia'`
5. Al guardar, se crea automáticamente un **EGRESO** en movimientos de caja

## Integración con Movimientos de Caja

La integración automática se realiza en el backend:
- `prestamosService.js` → detecta el tipo de préstamo
- `movimientosCajaFinanzasService.js` → registra el movimiento correspondiente

| Tipo Prestatario | Tipo Movimiento | Categoría |
|------------------|-----------------|-----------|
| `interno` | INGRESO | `prestamo_recibido` |
| `trabajador`, `particular`, `cliente`, `proveedor`, `otro` | EGRESO | `prestamo_otorgado` |

## Uso

```javascript
import {
    PrestamosOptimizado,
    usePrestamoForm,
    usePrestamosData,
    usePrestamosModals
} from '../components/Finanzas/Prestamos';

// En PrestamosPage.jsx
const PrestamosPage = () => {
    return (
        <FinanzasLayout>
            <PrestamosOptimizado />
        </FinanzasLayout>
    );
};
```

## Validaciones

### Préstamo Recibido
- Entidad financiera requerida
- Monto solicitado > 0
- Tasa de interés > 0
- Plazo en meses > 0
- Nombre del prestatario requerido

### Préstamo Otorgado
- Monto a prestar > 0
- Plazo > 0
- Nombre del prestatario requerido
- Entidad financiera se auto-configura como "Caja Propia"

## Configuración

Ver `prestamosConfig.jsx` para:
- Valores por defecto de formularios
- Reglas de validación
- Definición de columnas de tabla
- Estados y colores
- Acciones disponibles

## Performance

- Hooks memoizados con `useCallback` y `useMemo`
- Componentes memoizados con `React.memo`
- Separación de responsabilidades para evitar re-renders innecesarios
- ~70% menos complejidad que versión legacy
