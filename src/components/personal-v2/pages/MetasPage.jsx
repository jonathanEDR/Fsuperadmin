/**
 * Página de Metas y Bonificaciones
 * Gestión de metas por sucursal
 */

import React from 'react';
import { useOutletContext } from 'react-router-dom';
import MetasSucursal from '../components/MetasSucursal';

function MetasPage() {
  const { basePath } = useOutletContext();

  return <MetasSucursal />;
}

export default MetasPage;
