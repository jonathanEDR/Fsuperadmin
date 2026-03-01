import React, { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { CreateNote } from './';

const NoteCreationModal = ({ isOpen, onClose, onNoteCreated }) => {
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div className="h-full flex items-center justify-center">
          <div 
            className={`bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-full max-w-2xl mx-4 relative transform transition-all duration-300 ${
              isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-white/80 p-1.5 rounded-xl transition-colors"
              disabled={isSubmitting}
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Plus className="text-purple-600" size={24} />
              Crear Nueva Nota
            </h2>
            {isSubmitting && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-2xl">
                <Loader2 size={32} className="animate-spin text-purple-500" />
              </div>
            )}
            <CreateNote
              onNoteCreated={handleNoteCreation}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteCreationModal;
