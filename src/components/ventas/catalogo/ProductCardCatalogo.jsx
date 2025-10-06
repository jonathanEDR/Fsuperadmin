import React, { useState } from 'react';
import { Plus, Minus, ShoppingCart, Package, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const ProductCardCatalogo = ({ 
  producto, 
  onAgregarCarrito, 
  cargando = false,
  yaEnCarrito = false,
  cantidadEnCarrito = 0
}) => {
  const [cantidad, setCantidad] = useState(1);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [expandido, setExpandido] = useState(false); // Nuevo estado para colapsar/expandir
  const [cantidadInput, setCantidadInput] = useState('1'); // Estado temporal para el input

  // Detectar si es móvil
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

  // Función para determinar el color del stock
  const getStockStatus = (cantidadRestante) => {
    if (cantidadRestante === 0) {
      return {
        color: 'text-red-600 bg-red-100',
        icon: '🔴',
        texto: 'Agotado'
      };
    }
    if (cantidadRestante <= 5) {
      return {
        color: 'text-orange-600 bg-orange-100',
        icon: '🟠',
        texto: `${cantidadRestante} disponibles`
      };
    }
    if (cantidadRestante <= 10) {
      return {
        color: 'text-yellow-600 bg-yellow-100',
        icon: '🟡',
        texto: `${cantidadRestante} disponibles`
      };
    }
    return {
      color: 'text-green-600 bg-green-100',
      icon: '🟢',
      texto: `${cantidadRestante} disponibles`
    };
  };

  const stockStatus = getStockStatus(producto.cantidadRestante || 0);
  const stockDisponible = (producto.cantidadRestante || 0) - cantidadEnCarrito;
  const puedeAgregar = stockDisponible > 0 && cantidad <= stockDisponible;

  // Toggle para expandir/colapsar en móvil
  const handleToggleExpandir = () => {
    if (isMobile) {
      setExpandido(!expandido);
    }
  };

  const handleIncrementar = () => {
    if (cantidad < stockDisponible) {
      const nuevaCantidad = cantidad + 1;
      setCantidad(nuevaCantidad);
      setCantidadInput(nuevaCantidad.toString());
    }
  };

  const handleDecrementar = () => {
    if (cantidad > 1) {
      const nuevaCantidad = cantidad - 1;
      setCantidad(nuevaCantidad);
      setCantidadInput(nuevaCantidad.toString());
    }
  };

  const handleAgregarCarrito = () => {
    if (puedeAgregar && !cargando) {
      onAgregarCarrito(producto, cantidad);
      // Resetear cantidad después de agregar
      setCantidad(1);
      setCantidadInput('1');
    }
  };

  const handleCantidadDirecta = (e) => {
    const inputValue = e.target.value;
    setCantidadInput(inputValue); // Permitir vacío temporalmente
    
    // Solo actualizar cantidad si hay un valor válido
    if (inputValue === '' || inputValue === '0') {
      return; // Permitir vacío mientras escribe
    }
    
    const valor = parseInt(inputValue);
    if (!isNaN(valor)) {
      const cantidadMaxima = Math.max(1, stockDisponible);
      setCantidad(Math.min(Math.max(1, valor), cantidadMaxima));
    }
  };

  const handleBlurInput = () => {
    // Al salir del input, si está vacío o es 0, establecer en 1
    if (cantidadInput === '' || cantidadInput === '0' || parseInt(cantidadInput) < 1) {
      setCantidad(1);
      setCantidadInput('1');
    } else {
      // Sincronizar con el valor validado
      setCantidadInput(cantidad.toString());
    }
  };

  return isMobile && !expandido ? (
    // Vista colapsada para móvil (80-90px)
    <div 
      onClick={handleToggleExpandir}
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #ffffff, #faf5ff)',
        borderRadius: '8px',
        border: '2px solid #8b5cf6',
        boxShadow: '0 2px 6px rgba(139, 92, 246, 0.15)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        opacity: stockDisponible <= 0 ? 0.6 : 1,
        cursor: 'pointer',
        minHeight: '85px',
        maxHeight: '90px',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      {/* Fila 1: Título, Precio, Stock */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '16px', flexShrink: 0 }}>🍕</span>
          <h3 
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: 0,
              lineHeight: '1.2',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {producto.nombre}
          </h3>
        </div>
        
        <div 
          style={{
            backgroundColor: '#8b5cf6',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 'bold',
            flexShrink: 0,
            minWidth: '60px',
            textAlign: 'center'
          }}
        >
          S/ {producto.precio?.toFixed(2)}
        </div>
      </div>

      {/* Fila 2: Stock badge y botón Agregar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}
      >
        <div 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: stockStatus.color.includes('green') ? '#d1fae5' : 
                          stockStatus.color.includes('orange') ? '#fed7aa' : 
                          stockStatus.color.includes('yellow') ? '#fef3c7' : '#fee2e2',
            color: stockStatus.color.includes('green') ? '#065f46' : 
                   stockStatus.color.includes('orange') ? '#9a3412' : 
                   stockStatus.color.includes('yellow') ? '#92400e' : '#991b1b'
          }}
        >
          <span>{stockStatus.icon}</span>
          <span>{stockStatus.texto}</span>
        </div>

        {stockDisponible > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAgregarCarrito();
            }}
            disabled={cargando}
            style={{
              padding: '8px 16px',
              backgroundColor: cargando ? '#e5e7eb' : '#8b5cf6',
              color: cargando ? '#9ca3af' : '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: cargando ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              minWidth: '90px'
            }}
          >
            {cargando ? (
              <span style={{ fontSize: '11px' }}>...</span>
            ) : (
              <>
                <Plus size={14} />
                <span>Agregar</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Indicador expandir */}
      <div 
        style={{
          position: 'absolute',
          bottom: '2px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#8b5cf6',
          fontSize: '10px',
          opacity: 0.6
        }}
      >
        <ChevronDown size={16} />
      </div>

      {/* Badge de cantidad en carrito */}
      {cantidadEnCarrito > 0 && (
        <div 
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '22px',
            height: '22px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            fontSize: '11px',
            fontWeight: 'bold',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)'
          }}
        >
          {cantidadEnCarrito}
        </div>
      )}
    </div>
  ) : (
    // Vista expandida (móvil y desktop)
    <div 
      onClick={isMobile ? handleToggleExpandir : undefined}
      style={{
        position: 'relative',
        cursor: isMobile ? 'pointer' : 'default',
        background: 'linear-gradient(135deg, #ffffff, #faf5ff, #ffffff)',
        borderRadius: '8px',
        border: '2px solid #8b5cf6',
        boxShadow: '0 2px 8px rgba(139, 92, 246, 0.15)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        opacity: stockDisponible <= 0 ? 0.6 : 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: isMobile ? '240px' : '180px',
        maxHeight: isMobile ? '280px' : '200px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.border = '2px solid #f97316';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(249, 115, 22, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.border = '2px solid #8b5cf6';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.15)';
      }}
    >
      {/* Header compacto */}
      <div 
        style={{
          padding: isMobile ? '10px 12px' : '8px 10px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}
      >
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '4px'
          }}
        >
          <div style={{ flex: 1, paddingRight: '8px' }}>
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '8px' : '6px',
                marginBottom: isMobile ? '4px' : '2px'
              }}
            >
              <span style={{ fontSize: isMobile ? '16px' : '14px' }}>🍕</span>
              <h3 
                style={{
                    
                  fontSize: isMobile ? '15px' : '13px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  margin: 0,
                  lineHeight: '1.1',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {producto.nombre}
              </h3>
            </div>
            
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '8px' : '6px',
                margin: 0,
                marginBottom: isMobile ? '2px' : '1px',
                flexWrap: isMobile ? 'nowrap' : 'wrap'
              }}
            >
              <span
                style={{
                  fontSize: isMobile ? '13px' : '11px',
                  color: '#6b7280',
                  fontWeight: '500',
                  opacity: 0.9
                }}
              >
                Personal
              </span>
              
              {isMobile && (
                <div 
                  style={{
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                    minWidth: '60px',
                    textAlign: 'center'
                  }}
                >
                  S/ {producto.precio?.toFixed(2)}
                </div>
              )}
              
              {producto.categoryName && (
                <span
                  style={{
                    backgroundColor: '#ede9fe',
                    color: '#6b21a8',
                    padding: isMobile ? '4px 10px' : '2px 6px',
                    borderRadius: '8px',
                    fontSize: isMobile ? '11px' : '8px',
                    fontWeight: '600'
                  }}
                >
                  {producto.categoryName}
                </span>
              )}
              <span
                style={{
                  fontSize: isMobile ? '11px' : '9px',
                  color: '#9ca3af',
                  fontWeight: '500',
                  marginLeft: isMobile ? 'auto' : '2px'
                }}
              >
                #{producto.codigoProducto}
              </span>
            </div>
          </div>
          
          {!isMobile && (
            <div 
              style={{
                backgroundColor: '#8b5cf6',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                flexShrink: 0,
                minWidth: '50px',
                textAlign: 'center'
              }}
            >
              S/ {producto.precio?.toFixed(2)}
            </div>
          )}
        </div>

        {/* Info adicional compacta eliminada, ahora va junto a 'Personal' */}
      </div>

      {/* Contenido principal */}
      <div 
        style={{
          flex: 1,
          padding: isMobile ? '10px 12px' : '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        {/* Stock status compacto */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            marginBottom: isMobile ? '8px' : '6px'
          }}
        >
          <div 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              padding: isMobile ? '3px 8px' : '2px 6px',
              borderRadius: '8px',
              fontSize: isMobile ? '11px' : '9px',
              fontWeight: '600',
              backgroundColor: stockStatus.color.includes('green') ? '#d1fae5' : 
                            stockStatus.color.includes('orange') ? '#fed7aa' : 
                            stockStatus.color.includes('yellow') ? '#fef3c7' : '#fee2e2',
              color: stockStatus.color.includes('green') ? '#065f46' : 
                     stockStatus.color.includes('orange') ? '#9a3412' : 
                     stockStatus.color.includes('yellow') ? '#92400e' : '#991b1b'
            }}
          >
            <span>{stockStatus.icon}</span>
            <span>{stockStatus.texto}</span>
          </div>
        </div>

        {stockDisponible > 0 ? (
          <>
            {/* Controles de cantidad compactos */}
            <div style={{ marginBottom: '6px' }}>
              <label 
                style={{
                  fontSize: isMobile ? '11px' : '9px',
                  fontWeight: '600',
                  color: '#6b7280',
                  display: 'block',
                  marginBottom: '4px'
                }}
              >
                Cantidad
              </label>
              
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  padding: isMobile ? '4px' : '2px',
                  gap: isMobile ? '4px' : '2px',
                  border: '1px solid #e5e7eb'
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDecrementar();
                  }}
                  disabled={cantidad <= 1 || cargando}
                  style={{
                    padding: isMobile ? '6px' : '4px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: cantidad <= 1 || cargando ? '#9ca3af' : '#374151',
                    cursor: cantidad <= 1 || cargando ? 'not-allowed' : 'pointer',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: isMobile ? '28px' : '20px',
                    height: isMobile ? '28px' : '20px'
                  }}
                >
                  <Minus size={isMobile ? 14 : 10} />
                </button>
                
                <input
                  type="number"
                  value={cantidadInput}
                  onChange={handleCantidadDirecta}
                  onBlur={handleBlurInput}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.target.select()}
                  min="1"
                  max={stockDisponible}
                  disabled={cargando}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: isMobile ? '14px' : '11px',
                    fontWeight: 'bold',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#1f2937',
                    outline: 'none',
                    height: isMobile ? '24px' : '18px',
                    padding: 0
                  }}
                />
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleIncrementar();
                  }}
                  disabled={cantidad >= stockDisponible || cargando}
                  style={{
                    padding: isMobile ? '6px' : '4px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: cantidad >= stockDisponible || cargando ? '#9ca3af' : '#374151',
                    cursor: cantidad >= stockDisponible || cargando ? 'not-allowed' : 'pointer',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: isMobile ? '28px' : '20px',
                    height: isMobile ? '28px' : '20px'
                  }}
                >
                  <Plus size={isMobile ? 14 : 10} />
                </button>
              </div>
            </div>

            {/* Subtotal y botón en una línea */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <div 
                style={{
                  flex: 1,
                  padding: isMobile ? '6px 8px' : '4px 6px',
                  backgroundColor: '#ede9fe',
                  border: '1px solid #8b5cf6',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}
              >
                <p 
                  style={{
                    fontSize: isMobile ? '10px' : '8px',
                    color: '#6b7280',
                    margin: '0 0 1px 0'
                  }}
                >
                  Subtotal:
                </p>
                <p 
                  style={{
                    fontSize: isMobile ? '15px' : '13px',
                    fontWeight: 'bold',
                    color: '#6b21a8',
                    margin: 0
                  }}
                >
                  S/ {(producto.precio * cantidad).toFixed(2)}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAgregarCarrito();
                }}
                disabled={cargando}
                style={{
                  padding: isMobile ? '8px 12px' : '6px 8px',
                  backgroundColor: cargando ? '#e5e7eb' : '#ffffff',
                  color: cargando ? '#9ca3af' : '#8b5cf6',
                  border: cargando ? '2px solid #d1d5db' : '2px solid #8b5cf6',
                  borderRadius: '6px',
                  fontSize: isMobile ? '12px' : '10px',
                  fontWeight: '700',
                  cursor: cargando ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobile ? '4px' : '3px',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  minWidth: isMobile ? '80px' : '60px'
                }}
                onMouseEnter={(e) => {
                  if (!cargando) {
                    e.currentTarget.style.backgroundColor = '#8b5cf6';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!cargando) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#8b5cf6';
                  }
                }}
              >
                {cargando ? (
                  <>
                    <div 
                      style={{
                        width: '8px',
                        height: '8px',
                        border: '1px solid #ffffff',
                        borderTop: '1px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}
                    ></div>
                    <span style={{ fontSize: '8px' }}>...</span>
                  </>
                ) : (
                  <>
                    <Plus size={8} />
                    <span>Agregar</span>
                  </>
                )}
              </button>
            </div>

            {/* Indicador en carrito */}
            {cantidadEnCarrito > 0 && (
              <div 
                style={{
                  marginTop: '4px',
                  textAlign: 'center'
                }}
              >
                <span 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '2px 6px',
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                    fontSize: '8px',
                    borderRadius: '8px',
                    border: '1px solid #10b981'
                  }}
                >
                  <ShoppingCart size={8} />
                  {cantidadEnCarrito} en carrito
                </span>
              </div>
            )}
          </>
        ) : (
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              textAlign: 'center'
            }}
          >
            <Package 
              size={20} 
              color="#6b7280" 
              style={{ marginBottom: '4px' }}
            />
            <span 
              style={{
                fontSize: '10px',
                color: '#6b7280',
                fontWeight: '600'
              }}
            >
              Sin stock
            </span>
          </div>
        )}
      </div>

      {/* Badge de cantidad en carrito */}
      {cantidadEnCarrito > 0 && (
        <div 
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: isMobile ? '22px' : '18px',
            height: isMobile ? '22px' : '18px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            fontSize: isMobile ? '11px' : '9px',
            fontWeight: 'bold',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)'
          }}
        >
          {cantidadEnCarrito}
        </div>
      )}

      {/* Mensaje de advertencia para stock bajo */}
      {stockDisponible > 0 && stockDisponible <= 3 && cantidadEnCarrito > 0 && (
        <div 
          style={{
            position: 'absolute',
            bottom: '4px',
            left: '4px',
            right: '4px',
            padding: '2px 4px',
            backgroundColor: '#fed7aa',
            color: '#9a3412',
            fontSize: '8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            border: '1px solid #f97316'
          }}
        >
          <AlertTriangle size={8} />
          Solo {stockDisponible} disponibles
        </div>
      )}

      {/* Botón colapsar en móvil */}
      {isMobile && expandido && (
        <div 
          onClick={handleToggleExpandir}
          style={{
            position: 'absolute',
            bottom: '2px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#8b5cf6',
            fontSize: '10px',
            opacity: 0.6,
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ChevronUp size={16} />
        </div>
      )}
    </div>
  );
};

export default ProductCardCatalogo;
