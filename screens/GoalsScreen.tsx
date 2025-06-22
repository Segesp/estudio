
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import useLocalStorage from '../hooks/useLocalStorage';
import { Goal } from '../types';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Card from '../components/Card';
import { PlusIcon, TrashIcon, EditIcon, CheckCircleIcon, TargetIcon, ChatBubbleLeftEllipsisIcon } from '../ui-assets'; // Import ChatBubbleLeftEllipsisIcon

const GoalsScreen: React.FC = () => {
  const [goals, setGoals] = useLocalStorage<Goal[]>('goals', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentGoalText, setCurrentGoalText] = useState('');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const handleAddOrUpdateGoal = () => {
    if (!currentGoalText.trim()) {
      alert('La meta no puede estar vacía.');
      return;
    }

    if (editingGoal) {
      setGoals(prev => prev.map(g => g.id === editingGoal.id ? { ...g, text: currentGoalText } : g));
    } else {
      const newGoal: Goal = {
        id: Date.now().toString(),
        text: currentGoalText,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setGoals(prev => [newGoal, ...prev]);
    }
    closeModal();
  };

  const openModalForNew = () => {
    setEditingGoal(null);
    setCurrentGoalText('');
    setIsModalOpen(true);
  };

  const openModalForEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setCurrentGoalText(goal.text);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
    setCurrentGoalText('');
  };

  const handleDeleteGoal = (id: string) => {
    if (window.confirm('¿Seguro que quieres eliminar esta meta?')) {
      setGoals(prev => prev.filter(g => g.id !== id));
    }
  };

  const toggleCompleteGoal = (id: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };
  
  const pendingGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);
  const totalGoals = goals.length;
  const completionPercentage = totalGoals > 0 ? (completedGoals.length / totalGoals) * 100 : 0;

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
         <div className="flex items-center">
          <TargetIcon className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mr-2" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Mis Metas</h1>
        </div>
        <Button onClick={openModalForNew} size="sm" leftIcon={<PlusIcon className="w-4 h-4"/>}>
          Nueva Meta
        </Button>
      </header>

      {totalGoals > 0 && (
        <Card className="bg-cyan-50 dark:bg-slate-800 border border-cyan-200 dark:border-cyan-700/50">
          <div className="text-center">
            <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{completionPercentage.toFixed(0)}%</p>
            <p className="text-sm text-cyan-500 dark:text-cyan-300">de metas completadas</p>
          </div>
        </Card>
      )}

      <div className="text-center">
        <Link to="/reflections">
          <Button variant="ghost" size="sm" leftIcon={<ChatBubbleLeftEllipsisIcon className="w-4 h-4" />}>
            Ver Mis Reflexiones
          </Button>
        </Link>
      </div>


      {goals.length === 0 && (
        <Card className="text-center py-8 mt-4">
          <TargetIcon className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Aún no has definido ninguna meta.</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">¡Establecer metas es el primer paso hacia el éxito!</p>
          <Button onClick={openModalForNew} className="mt-4">Crear mi primera meta</Button>
        </Card>
      )}

      {pendingGoals.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">Metas Pendientes ({pendingGoals.length})</h2>
          <div className="space-y-3">
            {pendingGoals.map(goal => (
              <Card key={goal.id} className={`flex items-center justify-between transition-all ${goal.completed ? 'opacity-60 bg-slate-50 dark:bg-slate-800' : 'bg-white dark:bg-slate-700'}`}>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={goal.completed}
                    onChange={() => toggleCompleteGoal(goal.id)}
                    className="mr-3 h-5 w-5 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500 cursor-pointer dark:bg-slate-600 dark:border-slate-500 dark:focus:ring-cyan-400 dark:checked:bg-cyan-500"
                    aria-labelledby={`goal-text-${goal.id}`}
                  />
                  <p id={`goal-text-${goal.id}`} className={`text-slate-700 dark:text-slate-200 ${goal.completed ? 'line-through text-slate-500 dark:text-slate-400' : ''}`}>{goal.text}</p>
                </div>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => openModalForEdit(goal)} aria-label="Editar meta">
                    <EditIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteGoal(goal.id)} className="text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-700/50 dark:text-rose-400" aria-label="Eliminar meta">
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
      
      {completedGoals.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">Metas Completadas ({completedGoals.length})</h2>
          <div className="space-y-3">
            {completedGoals.map(goal => (
              <Card key={goal.id} className={`flex items-center justify-between opacity-70 bg-emerald-50 dark:bg-emerald-900/30`}>
                <div className="flex items-center">
                   <CheckCircleIcon className="w-5 h-5 text-emerald-500 dark:text-emerald-400 mr-3" />
                  <p className={`text-slate-700 line-through text-slate-500 dark:text-slate-300 dark:text-slate-400`}>{goal.text}</p>
                </div>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => toggleCompleteGoal(goal.id)} className="text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-600" aria-label="Marcar meta como pendiente">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                    </svg>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteGoal(goal.id)} className="text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-700/50 dark:text-rose-400" aria-label="Eliminar meta completada">
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}


      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingGoal ? "Editar Meta" : "Nueva Meta"}>
        <div>
          <label htmlFor="goalText" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción de la meta</label>
          <textarea
            id="goalText"
            value={currentGoalText}
            onChange={(e) => setCurrentGoalText(e.target.value)}
            rows={3}
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-cyan-400 dark:focus:border-cyan-400"
            placeholder="Ej: Terminar el capítulo 3 de Psicología Cognitiva"
            aria-label="Descripción de la meta"
          />
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
          <Button onClick={handleAddOrUpdateGoal}>{editingGoal ? "Guardar Cambios" : "Añadir Meta"}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default GoalsScreen;
