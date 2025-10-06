# ✅ Checklist de Pruebas - BusquedaProductos Component

**Fecha:** 6 de octubre, 2025  
**Componente:** BusquedaProductos.jsx  
**Hook:** useProductosVenta.js  
**Estado:** 🧪 Listo para testing

---

## 🚀 Pasos para Ejecutar la Prueba

### 1. Iniciar el Proyecto
```bash
cd my-app
npm run dev
```

### 2. Abrir en el Navegador
- URL: `http://localhost:5173` (o el puerto que use Vite)
- Iniciar sesión con Clerk

### 3. Ir al Dashboard
- La página principal (BienvenidaPage) ahora tiene un **botón flotante morado** en la esquina inferior izquierda
- El botón dice: **"🧪 Test: BusquedaProductos"**

### 4. Abrir el Modal de Prueba
- Click en el botón morado
- Debería abrirse un modal grande con header morado/azul

---

## ✅ Checklist de Validación

### Renderizado Inicial
- [ ] El modal se abre correctamente
- [ ] El header dice "Test - BusquedaProductos Component"
- [ ] Se ve el componente de búsqueda con 2 inputs
- [ ] Se ve la sección azul con "Estado del Hook"
- [ ] Se ve la lista de productos filtrados
- [ ] Se ve la sección verde con "Validaciones Exitosas"

### Carga de Datos
- [ ] El estado "Loading" está en "No" (verde)
- [ ] "Total Productos" muestra un número > 0
- [ ] "Total Categorías" muestra un número ≥ 0
- [ ] La lista de productos muestra productos reales

### Funcionalidad de Búsqueda
- [ ] El input de búsqueda tiene el icono 🔍 (Search)
- [ ] Escribir en el input filtra productos en tiempo real
- [ ] Búsqueda por nombre funciona
- [ ] Búsqueda por código funciona (si los productos tienen código)
- [ ] La búsqueda NO es case-sensitive (mayúsculas/minúsculas)
- [ ] El contador de productos filtrados se actualiza

### Funcionalidad de Categorías
- [ ] El selector tiene el icono 🔽 (Filter)
- [ ] El selector muestra "Todas las categorías" por defecto
- [ ] El selector lista todas las categorías disponibles
- [ ] Seleccionar una categoría filtra productos
- [ ] Volver a "Todas las categorías" muestra todos los productos
- [ ] El contador de productos filtrados se actualiza

### Combinación de Filtros
- [ ] Búsqueda + Categoría funcionan juntos
- [ ] Los filtros son acumulativos (AND, no OR)
- [ ] Limpiar búsqueda mantiene el filtro de categoría
- [ ] Cambiar categoría mantiene el texto de búsqueda

### Performance y Optimización
- [ ] No hay lag al escribir en la búsqueda
- [ ] El filtrado es instantáneo (<100ms)
- [ ] No hay errores en la consola del navegador
- [ ] No hay warnings de React
- [ ] React DevTools muestra que BusquedaProductos usa React.memo

### Información del Estado
- [ ] "Término de búsqueda" muestra el texto actual (o "(vacío)")
- [ ] "Categoría seleccionada" muestra el nombre de la categoría (o "(todas)")
- [ ] Los valores se actualizan en tiempo real

### UI/UX
- [ ] El diseño se ve bien en pantalla grande (desktop)
- [ ] El diseño se ve bien en móvil (responsive)
- [ ] Los iconos se muestran correctamente
- [ ] Los colores son consistentes con el diseño
- [ ] El modal se puede cerrar con el botón X
- [ ] El botón "Cerrar" funciona

---

## 🐛 Errores Comunes y Soluciones

### Error: "Cannot find module 'lucide-react'"
**Solución:**
```bash
npm install lucide-react
```

### Error: No se cargan productos
**Verificar:**
1. Backend está corriendo en el puerto correcto
2. Variable de entorno `VITE_BACKEND_URL` está configurada
3. Usuario está autenticado con Clerk
4. El endpoint `/api/productos` responde correctamente

**Test rápido:**
```bash
# En otra terminal
curl http://localhost:5000/api/productos -H "Authorization: Bearer YOUR_TOKEN"
```

### Error: No se cargan categorías
- Las categorías son opcionales
- Si no hay categorías, el selector solo mostrará "Todas las categorías"
- Esto NO es un error

### Warning: "Can't perform a React state update on an unmounted component"
- Puede ocurrir si cierras el modal mientras está cargando
- No es crítico para la prueba
- Se puede resolver agregando cleanup en useEffect (mejora futura)

---

## 📊 Resultados Esperados

### ✅ Prueba EXITOSA si:
1. El modal se abre sin errores
2. Los datos se cargan correctamente
3. La búsqueda filtra productos en tiempo real
4. El selector de categorías funciona
5. Los filtros se combinan correctamente
6. No hay errores en consola
7. El performance es bueno (sin lag)

### ❌ Prueba FALLIDA si:
1. El modal no se abre
2. Los datos no cargan
3. El filtrado no funciona
4. Hay errores en consola
5. Hay lag significativo (>500ms)
6. Los componentes no se renderizan

---

## 📸 Screenshots Recomendados

Toma screenshots de:
1. **Modal cerrado** - Botón flotante visible
2. **Modal abierto** - Vista completa inicial
3. **Búsqueda activa** - Texto en input + productos filtrados
4. **Categoría seleccionada** - Selector con categoría + productos filtrados
5. **Ambos filtros** - Búsqueda + Categoría activos
6. **Console limpia** - Sin errores

---

## 🔍 Debugging Avanzado

### Abrir React DevTools
1. F12 → Tab "Components"
2. Buscar "TestModal"
3. Ver props de "BusquedaProductos"
4. Verificar que React.memo está activo

### Ver Re-renders
1. React DevTools → Settings
2. Activar "Highlight updates when components render"
3. Escribir en la búsqueda
4. BusquedaProductos NO debería iluminarse si las props no cambian

### Ver Network Requests
1. F12 → Tab "Network"
2. Abrir el modal
3. Verificar requests a `/api/productos` y `/api/categories`
4. Ver status codes (deben ser 200)

---

## ✅ Reporte de Resultados

Después de probar, reporta:

### Funcionó ✅
- [ ] Todo funciona perfectamente
- [ ] Algunas cosas funcionan (especificar cuáles)

### No Funcionó ❌
- [ ] No se abre el modal
- [ ] No cargan datos
- [ ] Filtros no funcionan
- [ ] Errores en consola (copiar errores)

### Observaciones
```
(Escribe aquí cualquier comentario, sugerencia o problema encontrado)
```

---

## 🎯 Próximo Paso Después de la Prueba

### Si todo funciona ✅
✅ **Patrón validado**  
→ Crear los 4 componentes UI restantes con confianza

### Si hay problemas menores ⚠️
🔧 **Ajustar y re-probar**  
→ Corregir issues específicos  
→ Validar nuevamente

### Si hay problemas mayores ❌
🔄 **Revisar arquitectura**  
→ Analizar el problema de raíz  
→ Ajustar el patrón si es necesario  
→ Re-validar antes de continuar

---

**🚀 ¡Listos para probar!**

1. Ejecuta `npm run dev`
2. Abre el navegador
3. Click en el botón morado 🧪
4. Completa el checklist
5. Reporta resultados

