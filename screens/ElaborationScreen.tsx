
import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { ElaborationNote } from '../types';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Card from '../components/Card';
import { PlusIcon, TrashIcon, EditIcon, BrainIcon } from '../ui-assets';

const ElaborationScreen: React.FC = () => {
  const [notes, setNotes] = useLocalStorage<ElaborationNote[]>('elaborationNotes', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentContent, setCurrentContent] = useState('');
  const [editingNote, setEditingNote] = useState<ElaborationNote | null>(null);

  const handleAddOrUpdateNote = () => {
    if (!currentTitle.trim() || !currentContent.trim()) {
      alert('El título y el contenido de la nota no pueden estar vacíos.');
      return;
    }

    if (editingNote) {
      setNotes(prev => prev.map(note =>
        note.id === editingNote.id ? { ...note, title: currentTitle, content: currentContent } : note
      ));
    } else {
      const newNote: ElaborationNote = {
        id: Date.now().toString(),
        title: currentTitle,
        content: currentContent,
        createdAt: new Date().toISOString(),
      };
      setNotes(prev => [newNote, ...prev]);
    }
    closeModal();
  };

  const openModalForNew = () => {
    setEditingNote(null);
    setCurrentTitle('');
    setCurrentContent('');
    setIsModalOpen(true);
  };

  const openModalForEdit = (note: ElaborationNote) => {
    setEditingNote(note);
    setCurrentTitle(note.title);
    setCurrentContent(note.content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    setCurrentTitle('');
    setCurrentContent('');
  };

  const handleDeleteNote = (id: string) => {
    if (window.confirm('¿Seguro que quieres eliminar esta nota de elaboración?')) {
      setNotes(prev => prev.filter(note => note.id !== id));
    }
  };

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center">
          <BrainIcon className="w-8 h-8 text-violet-500 dark:text-violet-400 mr-2" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Notas de Elaboración</h1>
        </div>
        <Button onClick={openModalForNew} size="sm" leftIcon={<PlusIcon className="w-4 h-4"/>}>
          Nueva Nota
        </Button>
      </header>

      {notes.length === 0 && (
        <Card className="text-center py-8 mt-4">
          <BrainIcon className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Aún no tienes notas de elaboración.</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">Crea notas para profundizar en tus estudios.</p>
          <Button onClick={openModalForNew} className="mt-4">Crear mi primera nota</Button>
        </Card>
      )}

      <div className="space-y-4">
        {notes.map(note => (
          <Card key={note.id}>
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-1">{note.title}</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
              Creado: {new Date(note.createdAt).toLocaleDateString()}
            </p>
            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap mb-3">{note.content}</p>
            <div className="flex items-center justify-end space-x-2 border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
              <Button variant="ghost" size="sm" onClick={() => openModalForEdit(note)} aria-label="Editar nota">
                <EditIcon className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteNote(note.id)} className="text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-700/50 dark:text-rose-400" aria-label="Eliminar nota">
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingNote ? "Editar Nota" : "Nueva Nota de Elaboración"}>
        <div className="space-y-4">
          <div>
            <label htmlFor="noteTitle" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
            <input
              type="text"
              id="noteTitle"
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-cyan-400 dark:focus:border-cyan-400"
              placeholder="Ej: Concepto Clave de Neurociencia"
            />
          </div>
          <div>
            <label htmlFor="noteContent" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contenido</label>
            <textarea
              id="noteContent"
              value={currentContent}
              onChange={(e) => setCurrentContent(e.target.value)}
              rows={5}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-cyan-400 dark:focus:border-cyan-400"
              placeholder="Explica el concepto con tus propias palabras, haz conexiones, responde '¿por qué?' y '¿cómo?'..."
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
          <Button onClick={handleAddOrUpdateNote}>{editingNote ? "Guardar Cambios" : "Crear Nota"}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default ElaborationScreen;
