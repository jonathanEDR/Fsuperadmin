// Archivo de prueba para verificar exportaciones
console.log('Test service loading...');

export const testCatalogo = {
  test: () => {
    console.log('Test service working');
    return 'OK';
  }
};

export default testCatalogo;
