import React, { useState } from 'react';
import { Plus, Minus, ShoppingCart, Package, AlertTriangle } from 'lucide-react';

const ProductCardCatalogo = ({ 
  producto, 
  onAgregarCarrito, 
  cargando = false,
  yaEnCarrito = false,
  cantidadEnCarrito = 0
}) => {
  const [cantidad, setCantidad] = useState(1);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  // Detectar si es móvil
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

  // Función para determinar el color del stock
  const getStockStatus = (cantidadRestante) => {
    if (cantidadRestante === 0) {
      return {
        color: 'text-red-600 bg-red-100',
        icon: '🔴',
        texto: 'Sin stock'
      };
    }
    if (cantidadRestante <= 5) {
      return {
        color: 'text-orange-600 bg-orange-100',
        icon: '🟠',
        texto: 'Stock bajo'
      };
    }
    if (cantidadRestante <= 10) {
      return {
        color: 'text-yellow-600 bg-yellow-100',
        icon: '🟡',
        texto: 'Stock limitado'
      };
    }
    return {
      color: 'text-green-600 bg-green-100',
      icon: '🟢',
      texto: 'Disponible'
    };
  };

  const stockStatus = getStockStatus(producto.cantidadRestante || 0);
  const stockDisponible = (producto.cantidadRestante || 0) - cantidadEnCarrito;
  const puedeAgregar = stockDisponible > 0 && cantidad <= stockDisponible;

  const handleIncrementar = () => {
    if (cantidad < stockDisponible) {
      setCantidad(prev => prev + 1);
    }
  };

  const handleDecrementar = () => {
    if (cantidad > 1) {
      setCantidad(prev => prev - 1);
    }
  };

  const handleAgregarCarrito = () => {
    if (puedeAgregar && !cargando) {
      onAgregarCarrito(producto, cantidad);
      // Resetear cantidad después de agregar
      setCantidad(1);
    }
  };

  const handleCantidadDirecta = (e) => {
    const valor = parseInt(e.target.value) || 1;
    const cantidadMaxima = Math.max(1, stockDisponible);
    setCantidad(Math.min(valor, cantidadMaxima));
  };

  return (
    <div 
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #374151, #4b5563, #374151)',
        borderRadius: '8px',
        border: '2px solid #f97316',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        opacity: stockDisponible <= 0 ? 0.6 : 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: isMobile ? '200px' : '180px',
        maxHeight: isMobile ? '220px' : '200px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(249, 115, 22, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
      }}
    >
      {/* Header compacto */}
      <div 
        style={{
          padding: isMobile ? '10px 12px' : '8px 10px',
          borderBottom: '1px solid #4b5563',
          backgroundColor: 'rgba(0, 0, 0, 0.2)'
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
                  color: '#fbbf24',
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
                  color: '#fbbf24',
                  fontWeight: '500',
                  opacity: 0.8
                }}
              >
                Personal
              </span>
              
              {isMobile && (
                <div 
                  style={{
                    backgroundColor: '#f97316',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                    minWidth: '55px',
                    textAlign: 'center'
                  }}
                >
                  S/ {producto.precio?.toFixed(2)}
                </div>
              )}
              
              {producto.categoryName && (
                <span
                  style={{
                    backgroundColor: '#fbbf24',
                    color: '#1f2937',
                    padding: isMobile ? '3px 8px' : '2px 6px',
                    borderRadius: '8px',
                    fontSize: isMobile ? '10px' : '8px',
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
                backgroundColor: '#f97316',
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
            justifyContent: 'space-between',
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
              fontSize: isMobile ? '1px' : '9px',
              fontWeight: '600',
              backgroundColor: stockStatus.color.includes('green') ? '#065f46' : 
                            stockStatus.color.includes('orange') ? '#ea580c' : 
                            stockStatus.color.includes('yellow') ? '#d97706' : '#dc2626',
              color: stockStatus.color.includes('green') ? '#10b981' : 
                     stockStatus.color.includes('orange') ? '#fb923c' : 
                     stockStatus.color.includes('yellow') ? '#fbbf24' : '#ef4444'
            }}
          >
            <span>{stockStatus.icon}</span>
            <span>{stockStatus.texto}</span>
          </div>
          
          <span 
            style={{
              fontSize: isMobile ? '13px' : '12px',
              color: '#f3f4f6',
              fontWeight: 'bold'
            }}
          >
            Stock: {producto.cantidadRestante || 0}
          </span>
        </div>

        {stockDisponible > 0 ? (
          <>
            {/* Controles de cantidad compactos */}
            <div style={{ marginBottom: '6px' }}>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px'
                }}
              >
                <label 
                  style={{
                    fontSize: '9px',
                    fontWeight: '600',
                    color: '#d1d5db'
                  }}
                >
                  Cantidad
                </label>
                <span 
                  style={{
                    fontSize: isMobile ? '12px' : '11px',
                    color: '#f3f4f6',
                    fontWeight: 'bold'
                  }}
                >
                  Máx: {stockDisponible}
                </span>
              </div>
              
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#4b5563',
                  borderRadius: '6px',
                  padding: '2px',
                  gap: '2px'
                }}
              >
                <button
                  onClick={handleDecrementar}
                  disabled={cantidad <= 1 || cargando}
                  style={{
                    padding: '4px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: cantidad <= 1 || cargando ? '#6b7280' : '#d1d5db',
                    cursor: cantidad <= 1 || cargando ? 'not-allowed' : 'pointer',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px'
                  }}
                >
                  <Minus size={10} />
                </button>
                
                <input
                  type="number"
                  value={cantidad}
                  onChange={handleCantidadDirecta}
                  min="1"
                  max={stockDisponible}
                  disabled={cargando}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: '11px', // igual que subtotal
                    fontWeight: 'bold',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    outline: 'none',
                    height: '18px', // más compacto
                    padding: 0
                  }}
                />
                
                <button
                  onClick={handleIncrementar}
                  disabled={cantidad >= stockDisponible || cargando}
                  style={{
                    padding: '4px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: cantidad >= stockDisponible || cargando ? '#6b7280' : '#d1d5db',
                    cursor: cantidad >= stockDisponible || cargando ? 'not-allowed' : 'pointer',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px'
                  }}
                >
                  <Plus size={10} />
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
                  padding: '4px 6px',
                  backgroundColor: 'rgba(249, 115, 22, 0.1)',
                  border: '1px solid #f97316',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}
              >
                <p 
                  style={{
                    fontSize: '8px',
                    color: '#d1d5db',
                    margin: '0 0 1px 0'
                  }}
                >
                  Subtotal:
                </p>
                <p 
                  style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#f97316',
                    margin: 0
                  }}
                >
                  S/ {(producto.precio * cantidad).toFixed(2)}
                </p>
              </div>

              <button
                onClick={handleAgregarCarrito}
                disabled={cargando}
                style={{
                  padding: '6px 8px',
                  backgroundColor: cargando ? '#6b7280' : '#f97316',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: '600',
                  cursor: cargando ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  minWidth: '60px'
                }}
                onMouseEnter={(e) => {
                  if (!cargando) {
                    e.currentTarget.style.backgroundColor = '#ea580c';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!cargando) {
                    e.currentTarget.style.backgroundColor = '#f97316';
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
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
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
            width: '18px',
            height: '18px',
            backgroundColor: '#f97316',
            color: 'white',
            fontSize: '9px',
            fontWeight: 'bold',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid white',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
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
            backgroundColor: 'rgba(234, 88, 12, 0.9)',
            color: 'white',
            fontSize: '8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px'
          }}
        >
          <AlertTriangle size={8} />
          Solo {stockDisponible} disponibles
        </div>
      )}
    </div>
  );
};

export default ProductCardCatalogo;
