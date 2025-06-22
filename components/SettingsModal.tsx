
import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { Theme } from '../types';
import { SunIcon, MoonIcon, CogIcon as ComputerIcon } from '../ui-assets'; // Reusing CogIcon as ComputerIcon for system

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentTheme, onThemeChange }) => {
  const themeOptions: { value: Theme, label: string, icon: React.ReactNode }[] = [
    { value: 'light', label: 'Claro', icon: <SunIcon className="w-5 h-5 mr-2" /> },
    { value: 'dark', label: 'Oscuro', icon: <MoonIcon className="w-5 h-5 mr-2" /> },
    { value: 'system', label: 'Sistema', icon: <ComputerIcon className="w-5 h-5 mr-2" /> },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajustes">
      <div className="space-y-4">
        <div>
          <h4 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">Tema de la Aplicación</h4>
          <div className="space-y-2">
            {themeOptions.map(option => (
              <Button
                key={option.value}
                variant={currentTheme === option.value ? 'primary' : 'secondary'}
                onClick={() => onThemeChange(option.value)}
                className="w-full justify-start"
                leftIcon={option.icon}
              >
                {option.label}
              </Button>
            ))}
          </div>
           <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Seleccionar 'Sistema' usará la configuración de tema de tu dispositivo.
          </p>
        </div>
        {/* Future settings can be added here */}
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={onClose}>Cerrar</Button>
      </div>
    </Modal>
  );
};

export default SettingsModal;
