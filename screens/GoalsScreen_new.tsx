import React, { useState, useEffect } from 'react';
import { usePersistentSettings } from '../hooks/storage/usePersistentStore';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Card from '../components/Card';
import { PlusIcon, TrashIcon, EditIcon, CheckCircleIcon, TargetIcon, ClockIcon, CalendarDaysIcon } from '../ui-assets';

type GoalCategory = 'short-term' | 'medium-term' | 'long-term' | 'daily';
type GoalPriority = 'low' | 'medium' | 'high';

interface EnhancedGoal {
  id: string;
  text: string;
  description?: string;
  completed: boolean;
  category: GoalCategory;
  priority: GoalPriority;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  subtasks?: {
    id: string;
    text: string;
    completed: boolean;
  }[];
}

const GoalsScreen: React.FC = () => {
  const { getSetting, setSetting } = usePersistentSettings();
  
  const [goals, setGoals] = useState<EnhancedGoal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentGoalText, setCurrentGoalText] = useState('');
  const [currentDescription, setCurrentDescription] = useState('');
  const [currentCategory, setCurrentCategory] = useState<GoalCategory>('short-term');
  const [currentPriority, setCurrentPriority] = useState<GoalPriority>('medium');
  const [currentDueDate, setCurrentDueDate] = useState('');
  const [editingGoal, setEditingGoal] = useState<EnhancedGoal | null>(null);
  const [activeCategory, setActiveCategory] = useState<GoalCategory | 'all'>('all');

  // Cargar metas desde almacenamiento persistente
  useEffect(() => {
    const loadGoals = async () => {
      const savedGoals = await getSetting<EnhancedGoal[]>('enhanced-goals');
      if (savedGoals) {
        setGoals(savedGoals);
      }
    };
    loadGoals();
  }, [getSetting]);

  // Guardar metas cuando cambien
  useEffect(() => {
    setSetting('enhanced-goals', goals);
  }, [goals, setSetting]);

  const getCategoryInfo = (category: GoalCategory) => {
    switch (category) {
      case 'daily':
        return { name: 'Diarias', icon: '📅', color: 'bg-blue-500' };
      case 'short-term':
        return { name: 'Corto Plazo', icon: '⚡', color: 'bg-green-500' };
      case 'medium-term':
        return { name: 'Mediano Plazo', icon: '🎯', color: 'bg-yellow-500' };
      case 'long-term':
        return { name: 'Largo Plazo', icon: '🌟', color: 'bg-purple-500' };
      default:
        return { name: 'General', icon: '📝', color: 'bg-gray-500' };
    }
  };

  const getPriorityColor = (priority: GoalPriority) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-red-500';
      case 'medium':
        return 'border-l-4 border-yellow-500';
      case 'low':
        return 'border-l-4 border-green-500';
    }
  };

  const handleAddOrUpdateGoal = async () => {
    if (!currentGoalText.trim()) {
      alert('La meta no puede estar vacía.');
      return;
    }

    if (editingGoal) {
      setGoals(prev => prev.map(g => g.id === editingGoal.id ? { 
        ...g, 
        text: currentGoalText,
        description: currentDescription,
        category: currentCategory,
        priority: currentPriority,
        dueDate: currentDueDate || undefined
      } : g));
    } else {
      const newGoal: EnhancedGoal = {
        id: Date.now().toString(),
        text: currentGoalText,
        description: currentDescription,
        completed: false,
        category: currentCategory,
        priority: currentPriority,
        dueDate: currentDueDate || undefined,
        createdAt: new Date().toISOString(),
        subtasks: []
      };
      setGoals(prev => [newGoal, ...prev]);
    }
    closeModal();
  };

  const openModalForNew = () => {
    setEditingGoal(null);
    setCurrentGoalText('');
    setCurrentDescription('');
    setCurrentCategory('short-term');
    setCurrentPriority('medium');
    setCurrentDueDate('');
    setIsModalOpen(true);
  };

  const openModalForEdit = (goal: EnhancedGoal) => {
    setEditingGoal(goal);
    setCurrentGoalText(goal.text);
    setCurrentDescription(goal.description || '');
    setCurrentCategory(goal.category);
    setCurrentPriority(goal.priority);
    setCurrentDueDate(goal.dueDate || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
    setCurrentGoalText('');
    setCurrentDescription('');
  };

  const toggleGoalCompletion = (goalId: string) => {
    setGoals(prev => prev.map(g => 
      g.id === goalId 
        ? { 
            ...g, 
            completed: !g.completed,
            completedAt: !g.completed ? new Date().toISOString() : undefined
          }
        : g
    ));
  };

  const deleteGoal = (goalId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta meta?')) {
      setGoals(prev => prev.filter(g => g.id !== goalId));
    }
  };

  const filteredGoals = activeCategory === 'all' 
    ? goals 
    : goals.filter(goal => goal.category === activeCategory);

  const getStats = () => {
    const total = goals.length;
    const completed = goals.filter(g => g.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, pending, completionRate };
  };

  const stats = getStats();

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center">
          <TargetIcon className="w-8 h-8 text-cyan-500 dark:text-cyan-400 mr-2" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Metas y Objetivos</h1>
        </div>
        <Button onClick={openModalForNew} leftIcon={<PlusIcon className="w-4 h-4" />}>
          Nueva Meta
        </Button>
      </header>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{stats.total}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Completadas</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.pending}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Pendientes</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.completionRate}%</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Progreso</p>
        </Card>
      </div>

      {/* Filtros por categoría */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={activeCategory === 'all' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveCategory('all')}
        >
          Todas
        </Button>
        {(['daily', 'short-term', 'medium-term', 'long-term'] as GoalCategory[]).map(category => {
          const info = getCategoryInfo(category);
          return (
            <Button
              key={category}
              variant={activeCategory === category ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveCategory(category)}
              leftIcon={<span>{info.icon}</span>}
            >
              {info.name}
            </Button>
          );
        })}
      </div>

      {/* Lista de metas */}
      {filteredGoals.length === 0 ? (
        <Card className="p-8 text-center">
          <TargetIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {activeCategory === 'all' 
              ? 'No tienes metas creadas aún' 
              : `No tienes metas de ${getCategoryInfo(activeCategory as GoalCategory).name.toLowerCase()}`
            }
          </p>
          <Button onClick={openModalForNew} leftIcon={<PlusIcon className="w-4 h-4" />}>
            Crear primera meta
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredGoals.map((goal) => {
            const categoryInfo = getCategoryInfo(goal.category);
            const isOverdue = goal.dueDate && new Date(goal.dueDate) < new Date() && !goal.completed;
            
            return (
              <Card key={goal.id} className={`p-4 ${getPriorityColor(goal.priority)} ${goal.completed ? 'opacity-75' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <button
                      onClick={() => toggleGoalCompletion(goal.id)}
                      className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        goal.completed 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-slate-300 hover:border-green-500'
                      }`}
                    >
                      {goal.completed && <CheckCircleIcon className="w-3 h-3" />}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{categoryInfo.icon}</span>
                        <span className={`px-2 py-1 text-xs rounded-full text-white ${categoryInfo.color}`}>
                          {categoryInfo.name}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          goal.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                          goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        }`}>
                          {goal.priority === 'high' ? 'Alta' : goal.priority === 'medium' ? 'Media' : 'Baja'}
                        </span>
                      </div>
                      
                      <h3 className={`text-lg font-semibold ${goal.completed ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
                        {goal.text}
                      </h3>
                      
                      {goal.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {goal.description}
                        </p>
                      )}
                      
                      {goal.dueDate && (
                        <div className={`flex items-center gap-1 mt-2 text-sm ${
                          isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          <CalendarDaysIcon className="w-4 h-4" />
                          <span>
                            Vence: {new Date(goal.dueDate).toLocaleDateString('es-ES')}
                            {isOverdue && ' (Vencida)'}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span>Creada: {new Date(goal.createdAt).toLocaleDateString('es-ES')}</span>
                        {goal.completedAt && (
                          <span>Completada: {new Date(goal.completedAt).toLocaleDateString('es-ES')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button onClick={() => openModalForEdit(goal)} size="sm" variant="ghost">
                      <EditIcon className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => deleteGoal(goal.id)} size="sm" variant="ghost">
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal para crear/editar meta */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingGoal ? 'Editar Meta' : 'Nueva Meta'}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="goalText" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Título de la meta *
            </label>
            <input
              type="text"
              id="goalText"
              value={currentGoalText}
              onChange={(e) => setCurrentGoalText(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              placeholder="Ej: Terminar el curso de React"
            />
          </div>
          
          <div>
            <label htmlFor="goalDescription" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              id="goalDescription"
              value={currentDescription}
              onChange={(e) => setCurrentDescription(e.target.value)}
              rows={3}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              placeholder="Describe tu meta con más detalle..."
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="goalCategory" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Categoría
              </label>
              <select
                id="goalCategory"
                value={currentCategory}
                onChange={(e) => setCurrentCategory(e.target.value as GoalCategory)}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              >
                <option value="daily">📅 Diarias</option>
                <option value="short-term">⚡ Corto Plazo</option>
                <option value="medium-term">🎯 Mediano Plazo</option>
                <option value="long-term">🌟 Largo Plazo</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="goalPriority" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Prioridad
              </label>
              <select
                id="goalPriority"
                value={currentPriority}
                onChange={(e) => setCurrentPriority(e.target.value as GoalPriority)}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              >
                <option value="low">🟢 Baja</option>
                <option value="medium">🟡 Media</option>
                <option value="high">🔴 Alta</option>
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor="goalDueDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Fecha límite (opcional)
            </label>
            <input
              type="date"
              id="goalDueDate"
              value={currentDueDate}
              onChange={(e) => setCurrentDueDate(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <Button onClick={closeModal} variant="ghost">
            Cancelar
          </Button>
          <Button onClick={handleAddOrUpdateGoal}>
            {editingGoal ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default GoalsScreen;
