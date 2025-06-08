import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import CreateNote from '../Pages/Createnote';

const NoteCreationModal = ({ isOpen, onClose, onNoteCreated, userRole }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleNoteCreation = async (note) => {
    setIsSubmitting(true);
    try {
      await onNoteCreated(note);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}>
        <div className="h-full flex items-center justify-center">
          <div 
            className={`bg-white rounded-lg p-6 w-full max-w-2xl mx-4 relative transform transition-all duration-300 ${
              isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              disabled={isSubmitting}
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Plus className="text-purple-600" size={24} />
              Crear Nueva Nota
            </h2>
            {isSubmitting && (
              <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            )}
            <CreateNote
              onNoteCreated={handleNoteCreation}
              userRole={userRole}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteCreationModal;
