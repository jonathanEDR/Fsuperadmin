import React from 'react';

const ModalAccionRapida = ({ 
  isOpen, 
  onClose, 
  titulo, 
  descripcion, 
  icono, 
  onConfirmar,
  textoConfirmar = "Continuar",
  colorConfirmar = "blue"
}) => {
  if (!isOpen) return null;

  const colores = {
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700", 
    purple: "bg-purple-600 hover:bg-purple-700",
    orange: "bg-orange-600 hover:bg-orange-700"
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="text-3xl mr-3">{icono}</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{titulo}</h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 leading-relaxed">{descripcion}</p>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirmar();
              onClose();
            }}
            className={`px-6 py-2 text-white rounded-lg transition-colors ${colores[colorConfirmar]}`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAccionRapida;
