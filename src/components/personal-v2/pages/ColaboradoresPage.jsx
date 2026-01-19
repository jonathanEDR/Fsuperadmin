/**
 * Página de Colaboradores (Personal)
 * Lista de colaboradores con estadísticas y acciones
 */

import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import useGestionPersonal from '../hooks/useGestionPersonal';
import ColaboradoresTable from '../components/ColaboradoresTable';
import RegistroModal from '../components/RegistroModal';
import BonificacionAdelantoModal from '../components/BonificacionAdelantoModal';
import DescuentoModal from '../components/DescuentoModal';

function ColaboradoresPage() {
  const { basePath } = useOutletContext();
  const navigate = useNavigate();
  
  const {
    state,
    actions,
    selectors
  } = useGestionPersonal();

  const {
    colaboradores,
    estadisticasBulk,
    pagosRealizados,
    modalState,
    error
  } = state;

  const {
    crearRegistro,
    abrirModal,
    cerrarModal,
    formatearMoneda
  } = actions;
  
  // Estado para modal de bonificación/adelanto
  const [modalBonificacion, setModalBonificacion] = useState({
    isOpen: false,
    colaborador: null
  });
  
  // 🆕 Estado para modal de descuento
  const [modalDescuento, setModalDescuento] = useState({
    isOpen: false,
    colaborador: null
  });
  
  // Handlers para modal de bonificación/adelanto
  const abrirModalBonificacion = (colaborador) => {
    setModalBonificacion({ isOpen: true, colaborador });
  };
  
  const cerrarModalBonificacion = () => {
    setModalBonificacion({ isOpen: false, colaborador: null });
  };
  
  const crearBonificacionAdelanto = async (data) => {
    try {
      await crearRegistro({
        colaboradorUserId: data.colaboradorUserId,
        fechaDeGestion: data.fechaDeGestion,
        descripcion: data.descripcion,
        adelanto: data.tipo === 'adelanto' ? data.monto : 0,
        bonificacion: data.tipo === 'bonificacion' ? data.monto : 0,
        descripcionBonificacion: data.tipo === 'bonificacion' ? data.descripcion : '',
        incluirDatosCobros: false,
        incluirPagoDiario: false
      });
      cerrarModalBonificacion();
    } catch (error) {
      console.error('Error al crear bonificación/adelanto:', error);
    }
  };
  
  // 🆕 Handlers para modal de descuento
  const abrirModalDescuento = (colaborador) => {
    setModalDescuento({ isOpen: true, colaborador });
  };
  
  const cerrarModalDescuento = () => {
    setModalDescuento({ isOpen: false, colaborador: null });
  };
  
  const crearDescuento = async (data) => {
    try {
      // Registrar como faltante directo (manual)
      await crearRegistro({
        colaboradorUserId: data.colaboradorUserId,
        fechaDeGestion: data.fechaDeGestion,
        descripcion: data.descripcion,
        faltante: data.monto, // Se registra como faltante
        monto: 0,
        adelanto: 0,
        bonificacion: 0,
        incluirDatosCobros: false,
        incluirPagoDiario: false
      });
      cerrarModalDescuento();
    } catch (error) {
      console.error('Error al crear descuento:', error);
    }
  };
  
  // Navegar al detalle de colaborador
  const handleMostrarDetalle = (colaborador) => {
    navigate(`${basePath}/colaborador/${colaborador.clerk_id}`);
  };

  return (
    <>
      {/* Mensaje de error */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {/* Tabla de Colaboradores */}
      <ColaboradoresTable
        colaboradores={colaboradores}
        estadisticasBulk={estadisticasBulk}
        pagosRealizados={pagosRealizados}
        onAbrirModal={abrirModal}
        onAbrirModalBonificacion={abrirModalBonificacion}
        onAbrirModalDescuento={abrirModalDescuento}
        onMostrarDetalle={handleMostrarDetalle}
        formatearMoneda={formatearMoneda}
        loading={selectors.isLoading}
      />

      {/* Modal para crear registro */}
      <RegistroModal
        isOpen={modalState.isOpen}
        onClose={cerrarModal}
        onSubmit={crearRegistro}
        colaborador={modalState.selectedColaborador}
        loading={selectors.isLoading}
      />

      {/* Modal para bonificación/adelanto */}
      <BonificacionAdelantoModal
        isOpen={modalBonificacion.isOpen}
        onClose={cerrarModalBonificacion}
        onSubmit={crearBonificacionAdelanto}
        colaborador={modalBonificacion.colaborador}
        loading={selectors.isLoading}
      />

      {/* 🆕 Modal para descuento/faltante */}
      <DescuentoModal
        isOpen={modalDescuento.isOpen}
        onClose={cerrarModalDescuento}
        onSubmit={crearDescuento}
        colaborador={modalDescuento.colaborador}
        loading={selectors.isLoading}
      />
    </>
  );
}

export default ColaboradoresPage;
