import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Componente interno para ajustar bounds automáticamente
const FitBoundsComponent = ({ puntos, padding = [30, 30] }) => {
  const map = useMap();

  useEffect(() => {
    const validPuntos = puntos.filter(p => p.coordenadas?.lat && p.coordenadas?.lng);
    if (validPuntos.length === 0) return;

    if (validPuntos.length === 1) {
      // Un solo punto: centrar con zoom alto
      map.setView([validPuntos[0].coordenadas.lat, validPuntos[0].coordenadas.lng], 16);
      return;
    }

    const bounds = L.latLngBounds(
      validPuntos.map(p => [p.coordenadas.lat, p.coordenadas.lng])
    );
    map.fitBounds(bounds, { padding, maxZoom: 16 });
  }, [puntos, map, padding]);

  return null;
};

// Fix para íconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Pin simple de color (usuarios, admins, etc.)
const createColorPin = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 30px; height: 30px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      position: relative; top: -15px; left: -15px;
    "><div style="
      width: 10px; height: 10px;
      background: white; border-radius: 50%;
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(45deg);
    "></div></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -32]
  });
};

// Pin de sucursal con avatares de trabajadores encima
const createSucursalPin = (trabajadores = []) => {
  const color = '#10B981'; // Verde sucursal
  const count = trabajadores.length;

  // Construir los mini-avatares (máximo 3 visibles)
  const visible = trabajadores.slice(0, 3);
  const avatarsHtml = visible.map((t, i) => {
    const initials = (t.nombre || t.email || '?')[0].toUpperCase();
    const offsetX = i * 14; // px de separación horizontal
    if (t.avatar) {
      return `<div style="
        position: absolute;
        bottom: 28px;
        left: ${offsetX - 6}px;
        width: 22px; height: 22px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        overflow: hidden;
        background: #e0e0e0;
        z-index: ${10 + i};
      "><img src="${t.avatar}" alt="${initials}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<span style=\\'display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:9px;font-weight:700;color:#4b5563;background:#dbeafe;\\'>${initials}</span>'" /></div>`;
    }
    // Sin avatar: círculo con inicial
    return `<div style="
      position: absolute;
      bottom: 28px;
      left: ${offsetX - 6}px;
      width: 22px; height: 22px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
      background: #dbeafe;
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; font-weight: 700; color: #1e40af;
      z-index: ${10 + i};
    ">${initials}</div>`;
  }).join('');

  // Badge de cuenta si hay más de 3
  const extraBadge = count > 3 ? `<div style="
    position: absolute; bottom: 28px;
    left: ${3 * 14 - 6}px;
    width: 22px; height: 22px;
    border-radius: 50%;
    border: 2px solid white;
    background: #374151;
    display: flex; align-items: center; justify-content: center;
    font-size: 8px; font-weight: 700; color: white;
    z-index: 14;
  ">+${count - 3}</div>` : '';

  // Ancho total del contenedor (para los avatares)
  const containerW = Math.min(count, 4) * 14 + 16;

  return L.divIcon({
    className: 'custom-marker-sucursal',
    html: `<div style="position:relative; width:${containerW}px; height:56px;">
      ${avatarsHtml}${extraBadge}
      <div style="
        position: absolute; bottom: 0; left: 0;
        background-color: ${color};
        width: 30px; height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      "><div style="
        width: 10px; height: 10px;
        background: white; border-radius: 50%;
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%) rotate(45deg);
      "></div></div>
    </div>`,
    iconSize: [containerW, 56],
    iconAnchor: [15, 56],
    popupAnchor: [0, -58]
  });
};

const ICONOS_ESTATICOS = {
  usuario: createColorPin('#3B82F6'),
  admin: createColorPin('#8B5CF6'),
  super_admin: createColorPin('#EF4444'),
  default: createColorPin('#6B7280'),
};

/**
 * MapaViewer - Componente para visualizar puntos en mapa (solo lectura)
 * 
 * Props:
 * - puntos: Array de { lat, lng, nombre, tipo, detalle, ... }
 * - center: { lat, lng } centro del mapa
 * - zoom: number
 * - height: string
 * - className: string
 * - onPuntoClick: (punto) => void - callback al hacer click en un punto
 */
const MapaViewer = ({
  puntos = [],
  center = null,
  zoom = 13,
  height = '500px',
  className = '',
  onPuntoClick = null,
  fitBounds = false,
  fitBoundsPadding = [30, 30]
}) => {
  // Calcular centro automático si no se provee
  const mapCenter = useMemo(() => {
    if (center) return [center.lat, center.lng];
    
    if (puntos.length > 0) {
      const validPuntos = puntos.filter(p => p.coordenadas?.lat && p.coordenadas?.lng);
      if (validPuntos.length > 0) {
        const avgLat = validPuntos.reduce((sum, p) => sum + p.coordenadas.lat, 0) / validPuntos.length;
        const avgLng = validPuntos.reduce((sum, p) => sum + p.coordenadas.lng, 0) / validPuntos.length;
        return [avgLat, avgLng];
      }
    }
    
    // Default: Lima, Perú
    return [-12.0464, -77.0428];
  }, [center, puntos]);

  // Obtener ícono según tipo
  const getIcon = (punto) => {
    if (punto.tipo === 'sucursal') return createSucursalPin(punto.trabajadores || []);
    if (punto.role === 'super_admin') return ICONOS_ESTATICOS.super_admin;
    if (punto.role === 'admin') return ICONOS_ESTATICOS.admin;
    if (punto.tipo === 'usuario') return ICONOS_ESTATICOS.usuario;
    return ICONOS_ESTATICOS.default;
  };

  // Obtener color de etiqueta de rol
  const getRoleLabel = (role) => {
    switch (role) {
      case 'super_admin': return { text: 'Super Admin', color: 'bg-red-100 text-red-700' };
      case 'admin': return { text: 'Admin', color: 'bg-purple-100 text-purple-700' };
      case 'user': return { text: 'Usuario', color: 'bg-blue-100 text-blue-700' };
      default: return { text: role || '', color: 'bg-gray-100 text-gray-700' };
    }
  };

  if (puntos.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-200 ${className}`} style={{ height }}>
        <MapPin size={48} className="text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">No hay ubicaciones para mostrar</p>
        <p className="text-gray-400 text-sm mt-1">Los puntos aparecerán cuando los usuarios configuren su ubicación</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden border border-gray-200 ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height, width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {fitBounds && <FitBoundsComponent puntos={puntos} padding={fitBoundsPadding} />}

        {puntos.filter(p => p.coordenadas?.lat && p.coordenadas?.lng).map((punto, idx) => {
          const roleLabel = punto.role ? getRoleLabel(punto.role) : null;
          
          return (
            <Marker
              key={`${punto.tipo}-${punto.id || idx}`}
              position={[punto.coordenadas.lat, punto.coordenadas.lng]}
              icon={getIcon(punto)}
              eventHandlers={onPuntoClick ? {
                click: () => onPuntoClick(punto)
              } : {}}
            >
              <Popup minWidth={200}>
                <div style={{ minWidth: '200px', maxWidth: '260px', fontFamily: 'system-ui, sans-serif' }}>
                  {/* Header */}
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#1f2937', marginBottom: '4px' }}>
                    {punto.nombre}
                  </div>

                  {punto.tipo === 'sucursal' ? (
                    <>
                      <span style={{ display:'inline-block', padding:'2px 8px', fontSize:'11px', borderRadius:'9999px', background:'#d1fae5', color:'#065f46', marginBottom:'6px', fontWeight:600 }}>
                        📍 Sucursal
                      </span>

                      {punto.direccion && (
                        <p style={{ fontSize:'12px', color:'#4b5563', margin:'4px 0' }}>📌 {punto.direccion}</p>
                      )}
                      {punto.referencia && (
                        <p style={{ fontSize:'11px', color:'#6b7280', fontStyle:'italic', marginBottom:'6px' }}>Ref: {punto.referencia}</p>
                      )}

                      {/* Trabajadores asignados */}
                      {punto.trabajadores && punto.trabajadores.length > 0 ? (
                        <div style={{ borderTop:'1px solid #e5e7eb', paddingTop:'8px', marginTop:'6px' }}>
                          <p style={{ fontSize:'11px', fontWeight:'600', color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'6px' }}>
                            Trabajadores ({punto.trabajadores.length})
                          </p>
                          {punto.trabajadores.map((t, i) => {
                            const initials = (t.nombre || t.email || '?')[0].toUpperCase();
                            return (
                              <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'5px' }}>
                                {/* Avatar */}
                                <div style={{
                                  width:'28px', height:'28px', borderRadius:'50%',
                                  border:'2px solid #d1fae5', flexShrink:0, overflow:'hidden',
                                  background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center',
                                  fontSize:'11px', fontWeight:'700', color:'#1d4ed8'
                                }}>
                                  {t.avatar
                                    ? <img src={t.avatar} alt={initials} style={{ width:'100%', height:'100%', objectFit:'cover' }}
                                        onError={(e) => { e.target.parentElement.innerHTML = `<span style="font-size:11px;font-weight:700;color:#1d4ed8;">${initials}</span>`; }} />
                                    : initials
                                  }
                                </div>
                                {/* Info */}
                                <div style={{ flex:1, minWidth:0 }}>
                                  <p style={{ fontSize:'12px', fontWeight:'600', color:'#111827', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                                    {t.nombre}
                                  </p>
                                  <p style={{ fontSize:'10px', color:'#9ca3af' }}>
                                    {t.departamento || (t.role === 'admin' ? 'Admin' : 'Usuario')}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p style={{ fontSize:'11px', color:'#f59e0b', background:'#fffbeb', borderRadius:'6px', padding:'4px 8px', marginTop:'4px' }}>
                          ⚠️ Sin trabajadores asignados
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      {roleLabel && (
                        <span style={{ display:'inline-block', padding:'2px 8px', fontSize:'11px', borderRadius:'9999px', marginBottom:'6px' }}
                          className={`${roleLabel.color}`}>
                          {roleLabel.text}
                        </span>
                      )}
                      {punto.email && (
                        <p style={{ fontSize:'12px', color:'#6b7280', margin:'3px 0' }}>✉️ {punto.email}</p>
                      )}
                      {punto.departamento && (
                        <p style={{ fontSize:'12px', color:'#6b7280' }}>🏢 {punto.departamento}</p>
                      )}
                      {punto.direccion && (
                        <p style={{ fontSize:'12px', color:'#4b5563', marginTop:'4px' }}>📌 {punto.direccion}</p>
                      )}
                      {punto.referencia && (
                        <p style={{ fontSize:'11px', color:'#6b7280', fontStyle:'italic' }}>Ref: {punto.referencia}</p>
                      )}
                      {punto.ultimaActualizacion && (
                        <p style={{ fontSize:'11px', color:'#9ca3af', marginTop:'4px' }}>
                          Actualizado: {new Date(punto.ultimaActualizacion).toLocaleDateString('es-PE')}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapaViewer;
