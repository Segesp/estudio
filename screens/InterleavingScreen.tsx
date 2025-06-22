
import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { InterleavingPlan } from '../types';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Card from '../components/Card';
import { PlusIcon, TrashIcon, EditIcon, PuzzlePieceIcon } from '../ui-assets';

const InterleavingScreen: React.FC = () => {
  const [plans, setPlans] = useLocalStorage<InterleavingPlan[]>('interleavingPlans', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentName, setCurrentName] = useState('');
  const [currentDescription, setCurrentDescription] = useState('');
  const [editingPlan, setEditingPlan] = useState<InterleavingPlan | null>(null);

  const handleAddOrUpdatePlan = () => {
    if (!currentName.trim() || !currentDescription.trim()) {
      alert('El nombre y la descripción del plan no pueden estar vacíos.');
      return;
    }

    if (editingPlan) {
      setPlans(prev => prev.map(plan =>
        plan.id === editingPlan.id ? { ...plan, name: currentName, description: currentDescription } : plan
      ));
    } else {
      const newPlan: InterleavingPlan = {
        id: Date.now().toString(),
        name: currentName,
        description: currentDescription,
        createdAt: new Date().toISOString(),
      };
      setPlans(prev => [newPlan, ...prev]);
    }
    closeModal();
  };

  const openModalForNew = () => {
    setEditingPlan(null);
    setCurrentName('');
    setCurrentDescription('');
    setIsModalOpen(true);
  };

  const openModalForEdit = (plan: InterleavingPlan) => {
    setEditingPlan(plan);
    setCurrentName(plan.name);
    setCurrentDescription(plan.description);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
    setCurrentName('');
    setCurrentDescription('');
  };

  const handleDeletePlan = (id: string) => {
    if (window.confirm('¿Seguro que quieres eliminar este plan de intercalado?')) {
      setPlans(prev => prev.filter(plan => plan.id !== id));
    }
  };

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center">
          <PuzzlePieceIcon className="w-8 h-8 text-orange-500 dark:text-orange-400 mr-2" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Planes de Intercalado</h1>
        </div>
        <Button onClick={openModalForNew} size="sm" leftIcon={<PlusIcon className="w-4 h-4"/>}>
          Nuevo Plan
        </Button>
      </header>

      {plans.length === 0 && (
        <Card className="text-center py-8 mt-4">
          <PuzzlePieceIcon className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Aún no tienes planes de intercalado.</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">Crea planes para mezclar temas o tipos de problemas.</p>
          <Button onClick={openModalForNew} className="mt-4">Crear mi primer plan</Button>
        </Card>
      )}

      <div className="space-y-4">
        {plans.map(plan => (
          <Card key={plan.id}>
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-1">{plan.name}</h2>
             <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
              Creado: {new Date(plan.createdAt).toLocaleDateString()}
            </p>
            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap mb-3">{plan.description}</p>
            <div className="flex items-center justify-end space-x-2 border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
              <Button variant="ghost" size="sm" onClick={() => openModalForEdit(plan)} aria-label="Editar plan">
                <EditIcon className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDeletePlan(plan.id)} className="text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-700/50 dark:text-rose-400" aria-label="Eliminar plan">
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingPlan ? "Editar Plan" : "Nuevo Plan de Intercalado"}>
        <div className="space-y-4">
          <div>
            <label htmlFor="planName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Plan</label>
            <input
              type="text"
              id="planName"
              value={currentName}
              onChange={(e) => setCurrentName(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-cyan-400 dark:focus:border-cyan-400"
              placeholder="Ej: Repaso Matemáticas y Física Semana 1"
            />
          </div>
          <div>
            <label htmlFor="planDescription" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción (Cómo intercalarás)</label>
            <textarea
              id="planDescription"
              value={currentDescription}
              onChange={(e) => setCurrentDescription(e.target.value)}
              rows={5}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-cyan-400 dark:focus:border-cyan-400"
              placeholder="Ej: Lunes: 30min Álgebra (Problemas tipo A), 20min Cálculo (Flashcards), 15min Álgebra (Problemas tipo B). Martes: ..."
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
          <Button onClick={handleAddOrUpdatePlan}>{editingPlan ? "Guardar Cambios" : "Crear Plan"}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default InterleavingScreen;
