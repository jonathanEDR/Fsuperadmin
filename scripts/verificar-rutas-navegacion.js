// Script de verificación de rutas de navegación
console.log('🔧 VERIFICACIÓN DE RUTAS DE NAVEGACIÓN');
console.log('=====================================');

// Simular diferentes contextos de ruta
const rutas_test = [
    '/super-admin/finanzas',
    '/admin/finanzas', 
    '/finanzas'
];

const accesos = [
    { label: 'Dashboard', to: '' },
    { label: 'Movimientos', to: 'movimientos-caja' },
    { label: 'Cuentas', to: 'cuentas-bancarias' },
    { label: 'Préstamos', to: 'prestamos' }
];

rutas_test.forEach(currentPath => {
    console.log(`\n📍 Contexto: ${currentPath}`);
    
    const baseRoute = currentPath.includes('/super-admin') 
        ? '/super-admin/finanzas' 
        : currentPath.includes('/admin')
        ? '/admin/finanzas'
        : '/finanzas';
    
    console.log(`   Base route: ${baseRoute}`);
    
    accesos.forEach(acceso => {
        const fullPath = acceso.to ? `${baseRoute}/${acceso.to}` : baseRoute;
        console.log(`   ${acceso.label}: ${fullPath}`);
    });
});

console.log('\n✅ Verificación completada');
