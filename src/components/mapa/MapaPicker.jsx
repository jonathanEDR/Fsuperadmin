import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search, X } from 'lucide-react';

// Fix para íconos de Leaflet en build de Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Ícono personalizado para el marcador del usuario
const userIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Componente interno para manejar clicks en el mapa
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    }
  });
  return null;
}

// Componente para centrar el mapa
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

/**
 * MapaPicker - Componente reutilizable para seleccionar ubicación en mapa
 * 
 * Props:
 * - initialPosition: { lat, lng } posición inicial del marcador
 * - onLocationChange: (location) => void - callback cuando cambia la ubicación
 * - height: string - altura del mapa (default: '400px')
 * - zoom: number - zoom inicial (default: 15)
 * - editable: boolean - si permite mover el marcador (default: true)
 * - showSearch: boolean - mostrar buscador de dirección (default: true)
 * - showMyLocation: boolean - mostrar botón de mi ubicación (default: true)
 * - className: string - clases CSS adicionales
 */
const MapaPicker = ({
  initialPosition = null,
  onLocationChange,
  height = '400px',
  zoom = 15,
  editable = true,
  showSearch = true,
  showMyLocation = true,
  className = ''
}) => {
  // Centro por defecto: Lima, Perú
  const defaultCenter = { lat: -12.0464, lng: -77.0428 };
  const [position, setPosition] = useState(initialPosition || null);
  const [mapCenter, setMapCenter] = useState(initialPosition || defaultCenter);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [geolocating, setGeolocating] = useState(false);
  const [error, setError] = useState('');
  const searchTimeout = useRef(null);

  // Actualizar posición cuando cambian las props
  useEffect(() => {
    if (initialPosition && initialPosition.lat && initialPosition.lng) {
      setPosition(initialPosition);
      setMapCenter(initialPosition);
    }
  }, [initialPosition?.lat, initialPosition?.lng]);

  // Handler para seleccionar ubicación haciendo click
  const handleLocationSelect = useCallback((latlng) => {
    if (!editable) return;
    
    const newPos = { lat: latlng.lat, lng: latlng.lng };
    setPosition(newPos);
    
    if (onLocationChange) {
      onLocationChange(newPos);
    }
  }, [editable, onLocationChange]);

  // Obtener ubicación actual del navegador
  const handleGetMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }

    setGeolocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setPosition(newPos);
        setMapCenter(newPos);
        setGeolocating(false);

        if (onLocationChange) {
          onLocationChange(newPos);
        }
      },
      (err) => {
        setGeolocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Permiso de ubicación denegado. Habilita la ubicación en tu navegador.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Ubicación no disponible.');
            break;
          case err.TIMEOUT:
            setError('Tiempo de espera agotado para obtener ubicación.');
            break;
          default:
            setError('Error al obtener ubicación.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [onLocationChange]);

  // Buscar dirección con Nominatim (OpenStreetMap - gratuito)
  const handleSearch = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=pe&accept-language=es`
      );
      const data = await response.json();
      setSearchResults(data.map(item => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      })));
    } catch {
      setError('Error al buscar dirección');
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounce para la búsqueda
  const handleSearchInput = useCallback((value) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => handleSearch(value), 500);
  }, [handleSearch]);

  // Seleccionar resultado de búsqueda
  const handleSelectSearchResult = useCallback((result) => {
    const newPos = { lat: result.lat, lng: result.lng };
    setPosition(newPos);
    setMapCenter(newPos);
    setSearchResults([]);
    setSearchQuery(result.name.split(',')[0]); // Solo nombre corto

    if (onLocationChange) {
      onLocationChange(newPos);
    }
  }, [onLocationChange]);

  return (
    <div className={`relative rounded-lg overflow-hidden border border-gray-200 ${className}`}>
      {/* Barra de herramientas superior */}
      <div className="bg-white border-b border-gray-200 p-2 flex items-center gap-2 flex-wrap">
        {showSearch && (
          <div className="relative flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar dirección..."
                className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Resultados de búsqueda */}
            {searchResults.length > 0 && (
              <div className="absolute z-[1000] mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSearchResult(result)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0"
                  >
                    <MapPin size={12} className="inline mr-1 text-red-500" />
                    {result.name}
                  </button>
                ))}
              </div>
            )}

            {searching && (
              <div className="absolute z-[1000] mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 p-3 text-sm text-gray-500 text-center">
                Buscando...
              </div>
            )}
          </div>
        )}

        {showMyLocation && (
          <button
            onClick={handleGetMyLocation}
            disabled={geolocating}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            <Navigation size={14} className={geolocating ? 'animate-pulse' : ''} />
            {geolocating ? 'Obteniendo...' : 'Mi ubicación'}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-3 py-1.5 text-sm text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Mapa */}
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={zoom}
        style={{ height, width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {editable && <MapClickHandler onLocationSelect={handleLocationSelect} />}
        <RecenterMap center={mapCenter ? [mapCenter.lat, mapCenter.lng] : null} />
        
        {position && (
          <Marker
            position={[position.lat, position.lng]}
            icon={userIcon}
            draggable={editable}
            eventHandlers={editable ? {
              dragend: (e) => {
                const marker = e.target;
                const pos = marker.getLatLng();
                const newPos = { lat: pos.lat, lng: pos.lng };
                setPosition(newPos);
                if (onLocationChange) onLocationChange(newPos);
              }
            } : {}}
          />
        )}
      </MapContainer>

      {/* Instrucciones */}
      {editable && (
        <div className="bg-gray-50 border-t border-gray-200 px-3 py-1.5 text-xs text-gray-500 flex items-center gap-1">
          <MapPin size={12} />
          Haz click en el mapa o arrastra el marcador para seleccionar tu ubicación
        </div>
      )}

      {/* Coordenadas actuales */}
      {position && (
        <div className="bg-blue-50 border-t border-blue-200 px-3 py-1 text-xs text-blue-700 font-mono">
          📍 {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
};

export default MapaPicker;
