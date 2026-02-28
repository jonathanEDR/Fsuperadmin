/**
 * Página de Colaboradores (Personal)
 * Muestra la lista de colaboradores con:
 * - Días asistidos del mes seleccionado
 * - Adelantos registrados en el mes
 * - Acciones rápidas (Pago Diario, Bono, Descuento, Detalle)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import useGestionPersonal from '../hooks/useGestionPersonal';
import ColaboradoresTable from '../components/ColaboradoresTable';
import RegistroModal from '../components/RegistroModal';
import BonificacionAdelantoModal from '../components/BonificacionAdelantoModal';
import DescuentoModal from '../components/DescuentoModal';
import api from '../../../services/api';

// Helpers de fecha
const getMesActual = () => {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const getMesLabel = (mesStr) => {
  const [y, m] = mesStr.split('-');
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
};

const getRangoMes = (mesStr) => {
  const [y, m] = mesStr.split('-').map(Number);
  const inicio = new Date(y, m - 1, 1);
  const fin = new Date(y, m, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return {
    inicio: `${y}-${pad(m)}-01`,
    fin:    `${y}-${pad(m)}-${pad(fin.getDate())}`
  };
};

function ColaboradoresPage() {
  const { basePath } = useOutletContext();
  const navigate = useNavigate();

  const { state, actions, selectors } = useGestionPersonal();
  const { colaboradores, registros, modalState, error } = state;
  const { crearRegistro, abrirModal, cerrarModal, formatearMoneda } = actions;

  // ── Mes seleccionado ──────────────────────────────────────────────────────
  const [mesSeleccionado, setMesSeleccionado] = useState(getMesActual);

  // ── Asistencias del mes ───────────────────────────────────────────────────
  const [asistenciasMes, setAsistenciasMes] = useState([]);
  const [loadingAsistencias, setLoadingAsistencias] = useState(false);

  const cargarAsistencias = useCallback(async (mes) => {
    setLoadingAsistencias(true);
    try {
      const { inicio, fin } = getRangoMes(mes);
      const res = await api.get('/api/asistencia', {
        params: { fechaInicio: inicio, fechaFin: fin, limit: 1000 }
      });
      setAsistenciasMes(res.data?.data || []);
    } catch (err) {
      console.error('Error cargando asistencias del mes:', err);
      setAsistenciasMes([]);
    } finally {
      setLoadingAsistencias(false);
    }
  }, []);

  useEffect(() => {
    cargarAsistencias(mesSeleccionado);
  }, [mesSeleccionado, cargarAsistencias]);

  // ── Asistencias por colaborador (memoizado) ───────────────────────────────
  const asistenciasPorColab = useMemo(() => {
    const mapa = {};
    asistenciasMes.forEach(a => {
      const id = a.colaboradorUserId;
      if (!mapa[id]) mapa[id] = { presente: 0, tardanza: 0, permiso: 0, ausente: 0 };
      const est = a.estado || '';
      if (est === 'presente')        mapa[id].presente++;
      else if (est === 'tardanza')   mapa[id].tardanza++;
      else if (est === 'permiso' || est === 'falta_justificada') mapa[id].permiso++;
      else if (est === 'ausente')    mapa[id].ausente++;
      else if (est === 'media_jornada') mapa[id].presente++;  // cuenta como asistido
    });
    return mapa;
  }, [asistenciasMes]);

  // ── Adelantos del mes por colaborador (calculado de registros ya cargados) ─
  const adelantosPorColab = useMemo(() => {
    const { inicio, fin } = getRangoMes(mesSeleccionado);
    const desde = new Date(inicio);
    const hasta = new Date(fin + 'T23:59:59');
    const mapa = {};
    (registros || []).forEach(r => {
      if (!r.adelanto || r.adelanto <= 0) return;
      const fecha = new Date(r.fechaDeGestion);
      if (fecha >= desde && fecha <= hasta) {
        const id = r.colaboradorUserId;
        mapa[id] = (mapa[id] || 0) + r.adelanto;
      }
    });
    return mapa;
  }, [registros, mesSeleccionado]);

  // ── Modales ───────────────────────────────────────────────────────────────
  const [modalBonificacion, setModalBonificacion] = useState({ isOpen: false, colaborador: null });
  const [modalDescuento, setModalDescuento] = useState({ isOpen: false, colaborador: null });

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
      setModalBonificacion({ isOpen: false, colaborador: null });
    } catch (err) { console.error(err); }
  };

  const crearDescuento = async (data) => {
    try {
      await crearRegistro({
        colaboradorUserId: data.colaboradorUserId,
        fechaDeGestion: data.fechaDeGestion,
        descripcion: data.descripcion,
        faltante: data.monto,
        monto: 0, adelanto: 0, bonificacion: 0,
        incluirDatosCobros: false, incluirPagoDiario: false
      });
      setModalDescuento({ isOpen: false, colaborador: null });
    } catch (err) { console.error(err); }
  };

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <ColaboradoresTable
        colaboradores={colaboradores}
        asistenciasPorColab={asistenciasPorColab}
        adelantosPorColab={adelantosPorColab}
        mesSeleccionado={mesSeleccionado}
        setMesSeleccionado={setMesSeleccionado}
        mesLabel={getMesLabel(mesSeleccionado)}
        onAbrirModal={abrirModal}
        onAbrirModalBonificacion={(c) => setModalBonificacion({ isOpen: true, colaborador: c })}
        onAbrirModalDescuento={(c) => setModalDescuento({ isOpen: true, colaborador: c })}
        onMostrarDetalle={(c) => navigate(`${basePath}/colaborador/${c.clerk_id}`)}
        formatearMoneda={formatearMoneda}
        loading={selectors.isLoading}
        loadingAsistencias={loadingAsistencias}
      />

      <RegistroModal
        isOpen={modalState.isOpen}
        onClose={cerrarModal}
        onSubmit={crearRegistro}
        colaborador={modalState.selectedColaborador}
        loading={selectors.isLoading}
      />
      <BonificacionAdelantoModal
        isOpen={modalBonificacion.isOpen}
        onClose={() => setModalBonificacion({ isOpen: false, colaborador: null })}
        onSubmit={crearBonificacionAdelanto}
        colaborador={modalBonificacion.colaborador}
        loading={selectors.isLoading}
      />
      <DescuentoModal
        isOpen={modalDescuento.isOpen}
        onClose={() => setModalDescuento({ isOpen: false, colaborador: null })}
        onSubmit={crearDescuento}
        colaborador={modalDescuento.colaborador}
        loading={selectors.isLoading}
      />
    </>
  );
}

export default ColaboradoresPage;

