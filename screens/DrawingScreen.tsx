
import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { DrawingPrompt } from '../types';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Card from '../components/Card';
import { PlusIcon, TrashIcon, EditIcon, PaintBrushIcon } from '../ui-assets';

const DrawingScreen: React.FC = () => {
  const [prompts, setPrompts] = useLocalStorage<DrawingPrompt[]>('drawingPrompts', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentConcept, setCurrentConcept] = useState('');
  const [currentNotes, setCurrentNotes] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [editingPrompt, setEditingPrompt] = useState<DrawingPrompt | null>(null);

  const handleAddOrUpdatePrompt = () => {
    if (!currentConcept.trim()) {
      alert('El concepto a dibujar no puede estar vacío.');
      return;
    }

    if (editingPrompt) {
      setPrompts(prev => prev.map(prompt =>
        prompt.id === editingPrompt.id ? { ...prompt, concept: currentConcept, notes: currentNotes, imageUrl: currentImageUrl } : prompt
      ));
    } else {
      const newPrompt: DrawingPrompt = {
        id: Date.now().toString(),
        concept: currentConcept,
        notes: currentNotes,
        imageUrl: currentImageUrl,
        createdAt: new Date().toISOString(),
      };
      setPrompts(prev => [newPrompt, ...prev]);
    }
    closeModal();
  };

  const openModalForNew = () => {
    setEditingPrompt(null);
    setCurrentConcept('');
    setCurrentNotes('');
    setCurrentImageUrl('');
    setIsModalOpen(true);
  };

  const openModalForEdit = (prompt: DrawingPrompt) => {
    setEditingPrompt(prompt);
    setCurrentConcept(prompt.concept);
    setCurrentNotes(prompt.notes || '');
    setCurrentImageUrl(prompt.imageUrl || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPrompt(null);
    setCurrentConcept('');
    setCurrentNotes('');
    setCurrentImageUrl('');
  };

  const handleDeletePrompt = (id: string) => {
    if (window.confirm('¿Seguro que quieres eliminar esta idea de dibujo?')) {
      setPrompts(prev => prev.filter(prompt => prompt.id !== id));
    }
  };

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center">
          <PaintBrushIcon className="w-8 h-8 text-pink-500 dark:text-pink-400 mr-2" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dibujo Generativo</h1>
        </div>
        <Button onClick={openModalForNew} size="sm" leftIcon={<PlusIcon className="w-4 h-4"/>}>
          Nueva Idea
        </Button>
      </header>
       <p className="text-sm text-slate-600 dark:text-slate-300 -mt-4">
        Guarda conceptos para dibujar, notas y enlaces a tus bocetos.
      </p>

      {prompts.length === 0 && (
        <Card className="text-center py-8 mt-4">
          <PaintBrushIcon className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Aún no tienes ideas para dibujar.</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">Añade conceptos que quieras representar visualmente.</p>
          <Button onClick={openModalForNew} className="mt-4">Añadir mi primera idea</Button>
        </Card>
      )}

      <div className="space-y-4">
        {prompts.map(prompt => (
          <Card key={prompt.id}>
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-1">{prompt.concept}</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
              Creado: {new Date(prompt.createdAt).toLocaleDateString()}
            </p>
            {prompt.notes && <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap mb-2">Notas: {prompt.notes}</p>}
            {prompt.imageUrl && (
              <a 
                href={prompt.imageUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 underline break-all"
              >
                Ver Imagen del Dibujo (URL externa)
              </a>
            )}
            <div className="flex items-center justify-end space-x-2 border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
              <Button variant="ghost" size="sm" onClick={() => openModalForEdit(prompt)} aria-label="Editar idea de dibujo">
                <EditIcon className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDeletePrompt(prompt.id)} className="text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-700/50 dark:text-rose-400" aria-label="Eliminar idea de dibujo">
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingPrompt ? "Editar Idea de Dibujo" : "Nueva Idea para Dibujar"}>
        <div className="space-y-4">
          <div>
            <label htmlFor="promptConcept" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Concepto a Dibujar</label>
            <input
              type="text"
              id="promptConcept"
              value={currentConcept}
              onChange={(e) => setCurrentConcept(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-cyan-400 dark:focus:border-cyan-400"
              placeholder="Ej: Ciclo del agua, Mapa conceptual de X"
            />
          </div>
          <div>
            <label htmlFor="promptNotes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas Adicionales (opcional)</label>
            <textarea
              id="promptNotes"
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              rows={3}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-cyan-400 dark:focus:border-cyan-400"
              placeholder="Ideas clave, elementos a incluir..."
            />
          </div>
          <div>
            <label htmlFor="promptImageUrl" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL de la Imagen del Dibujo (opcional)</label>
            <input
              type="url"
              id="promptImageUrl"
              value={currentImageUrl}
              onChange={(e) => setCurrentImageUrl(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-cyan-400 dark:focus:border-cyan-400"
              placeholder="https://ejemplo.com/mi-dibujo.png"
            />
             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Pega aquí un enlace a una imagen de tu dibujo (ej. subida a Imgur, Google Drive, etc.).
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
          <Button onClick={handleAddOrUpdatePrompt}>{editingPrompt ? "Guardar Cambios" : "Añadir Idea"}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default DrawingScreen;
