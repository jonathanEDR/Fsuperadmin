import React from 'react';
import Toast from './Toast';

const ToastContainer = ({ toasts, onRemoveToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="transform transition-all duration-300 ease-in-out"
          style={{
            transform: `translateY(${index * 10}px)`,
            zIndex: 1000 - index
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={0} // Manejamos la duración en el hook
            onClose={() => onRemoveToast(toast.id)}
            visible={toast.visible}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
