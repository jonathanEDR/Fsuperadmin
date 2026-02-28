import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Loader2, DollarSign, Gift, TrendingDown, FileText, Check, X, Clock, Shield } from 'lucide-react';

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

const mesAnterior = (mesStr) => {
  const [y, m] = mesStr.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
};
const mesSiguiente = (mesStr) => {
  const [y, m] = mesStr.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
};
const esMesActual = (mesStr) => {
  const hoy = new Date();
  return mesStr === `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}`;
};

const AvatarColab = ({ nombre, avatar, avatarUrl }) => {
  // Prioridad: 1) avatar_url (Clerk), 2) avatar.url (upload manual), 3) inicial
  const src = avatarUrl || (avatar ? (typeof avatar === 'string' ? avatar : avatar?.url) : null);
  const [imgError, setImgError] = React.useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={nombre}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm"
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm">
      {nombre?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
};

const BadgeAsistencia = ({ data }) => {
  if (!data) return <span className="text-xs text-gray-300 italic">Sin registro</span>;
  const asistidos = (data.presente||0)+(data.tardanza||0)+(data.permiso||0);
  const ausentes  = data.ausente || 0;
  const total     = asistidos + ausentes;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-lg ${
          asistidos > 0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-gray-400 bg-gray-50 border border-gray-100'
        }`}>
          <Check size={12} strokeWidth={3} />
          {asistidos}
          {total > 0 && <span className="text-xs font-normal text-gray-400 ml-0.5">/{total}</span>}
        </span>
        {ausentes > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg text-red-600 bg-red-50 border border-red-100">
            <X size={11} strokeWidth={3} />
            {ausentes}
          </span>
        )}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {(data.presente||0) > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
            <Check size={9} strokeWidth={3}/> {data.presente} presente{data.presente!==1?'s':''}
          </span>
        )}
        {(data.tardanza||0) > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100">
            <Clock size={9}/> {data.tardanza} tardanza{data.tardanza!==1?'s':''}
          </span>
        )}
        {(data.permiso||0) > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">
            <Shield size={9}/> {data.permiso} permiso{data.permiso!==1?'s':''}
          </span>
        )}
      </div>
    </div>
  );
};

const BtnAccion = ({ onClick, icon: Icon, label, variant }) => {
  const styles = {
    success: 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300',
    warning: 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300',
    danger:  'text-red-600 bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300',
    neutral: 'text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300',
  };
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 shadow-none hover:shadow-sm ${styles[variant]}`}
    >
      <Icon size={13} strokeWidth={2.5} />
      {label}
    </button>
  );
};

const ColaboradoresTable = ({
  colaboradores = [],
  asistenciasPorColab = {},
  adelantosPorColab = {},
  mesSeleccionado,
  setMesSeleccionado,
  onAbrirModal,
  onAbrirModalBonificacion,
  onAbrirModalDescuento,
  onMostrarDetalle,
  formatearMoneda,
  loading,
  loadingAsistencias,
}) => {
  const [yStr, mStr] = (mesSeleccionado || '').split('-');
  const nombreMes      = MESES[parseInt(mStr) - 1] || '';
  const estesMesActual = esMesActual(mesSeleccionado);

  const irHoy = () => {
    const hoy = new Date();
    setMesSeleccionado(`${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}`);
  };

  const SelectorMes = () => (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setMesSeleccionado(mesAnterior(mesSeleccionado))}
        className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 text-gray-400 hover:text-gray-600 transition-all"
        title="Mes anterior"
      >
        <ChevronLeft size={16} />
      </button>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-blue-100 shadow-sm">
        <Calendar size={14} className="text-blue-400" />
        <span className="text-sm font-semibold text-gray-700">{nombreMes} {yStr}</span>
        {loadingAsistencias && <Loader2 size={12} className="animate-spin text-blue-400" />}
      </div>
      <button
        onClick={() => setMesSeleccionado(mesSiguiente(mesSeleccionado))}
        disabled={estesMesActual}
        className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 text-gray-400 hover:text-gray-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        title="Mes siguiente"
      >
        <ChevronRight size={16} />
      </button>
      {!estesMesActual && (
        <button
          onClick={irHoy}
          className="text-xs text-blue-600 font-medium px-2.5 py-1.5 rounded-lg border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          Hoy
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-base font-semibold text-gray-800">Colaboradores</h3>
          <SelectorMes />
        </div>
        <div className="p-10 text-center">
          <Loader2 size={24} className="animate-spin text-blue-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Cabecera */}
      <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Colaboradores</h3>
          <p className="text-xs text-gray-400 mt-0.5">{colaboradores.length} colaborador{colaboradores.length !== 1 ? 'es' : ''}</p>
        </div>
        <SelectorMes />
      </div>

      {/* Vista movil - tarjetas */}
      <div className="md:hidden p-3 space-y-3">
        {colaboradores.map((col) => {
          const asist     = asistenciasPorColab[col.clerk_id];
          const adelanto  = adelantosPorColab[col.clerk_id] || 0;
          const asistidos = asist ? (asist.presente||0)+(asist.tardanza||0)+(asist.permiso||0) : null;
          return (
            <div key={col._id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <AvatarColab nombre={col.nombre_negocio} avatar={col.avatar} avatarUrl={col.avatar_url} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-800 truncate">{col.nombre_negocio}</h4>
                  <span className="text-xs text-gray-400 capitalize">{col.role}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                  <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-wide block mb-1">Dias asistidos</span>
                  {asistidos !== null
                    ? <span className="text-xl font-bold text-emerald-700 leading-none">{asistidos}<span className="text-xs font-normal text-gray-400 ml-1">dias</span></span>
                    : <span className="text-xs text-gray-300 italic">Sin datos</span>}
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5">
                  <span className="text-[10px] font-medium text-orange-600 uppercase tracking-wide block mb-1">Adelantos</span>
                  <span className={`text-sm font-bold leading-none ${adelanto > 0 ? 'text-orange-600' : 'text-gray-300'}`}>{formatearMoneda(adelanto)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <BtnAccion onClick={() => onAbrirModal?.(col)} icon={DollarSign} label="Pago Diario" variant="success" />
                <BtnAccion onClick={() => onAbrirModalBonificacion?.(col)} icon={Gift} label="Bono" variant="warning" />
                <BtnAccion onClick={() => onAbrirModalDescuento?.(col)} icon={TrendingDown} label="Descuento" variant="danger" />
                <BtnAccion onClick={() => onMostrarDetalle?.(col)} icon={FileText} label="Detalle" variant="neutral" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Vista desktop - tabla */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50/60 border-b border-gray-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Colaborador</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Dias Asistidos
                <span className="ml-1 normal-case font-normal text-gray-400 text-[11px]"> {nombreMes}</span>
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Adelantos
                <span className="ml-1 normal-case font-normal text-gray-400 text-[11px]"> {nombreMes}</span>
              </th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {colaboradores.map((col) => {
              const asist    = asistenciasPorColab[col.clerk_id];
              const adelanto = adelantosPorColab[col.clerk_id] || 0;
              return (
                <tr key={col._id} className="hover:bg-slate-50/40 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <AvatarColab nombre={col.nombre_negocio} avatar={col.avatar} avatarUrl={col.avatar_url} />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-gray-800">{col.nombre_negocio}</span>
                        <span className="text-xs text-gray-400">{col.email}</span>
                        <span className="text-[10px] text-gray-300 capitalize">{col.role}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <BadgeAsistencia data={asist} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className={`text-sm font-semibold tabular-nums ${adelanto > 0 ? 'text-orange-500' : 'text-gray-300'}`}>
                      {formatearMoneda(adelanto)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 justify-center flex-wrap">
                      <BtnAccion onClick={() => onAbrirModal?.(col)} icon={DollarSign} label="Pago Diario" variant="success" />
                      <BtnAccion onClick={() => onAbrirModalBonificacion?.(col)} icon={Gift} label="Bono" variant="warning" />
                      <BtnAccion onClick={() => onAbrirModalDescuento?.(col)} icon={TrendingDown} label="Descuento" variant="danger" />
                      <BtnAccion onClick={() => onMostrarDetalle?.(col)} icon={FileText} label="Detalle" variant="neutral" />
                    </div>
                  </td>
                </tr>
              );
            })}
            {colaboradores.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-400 italic">
                  No hay colaboradores disponibles
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

ColaboradoresTable.displayName = 'ColaboradoresTable';

export default ColaboradoresTable;