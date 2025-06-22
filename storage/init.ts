import { ensurePersistence, getStorageInfo } from './db';
import { settingsAPI } from './api';

export async function initializeStorage(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Solicitar almacenamiento persistente
    const isPersistent = await ensurePersistence();
    
    // Obtener información de almacenamiento
    const storageInfo = await getStorageInfo();
    
    // Guardar información en configuraciones
    await settingsAPI.set('storageInfo', {
      isPersistent,
      lastChecked: Date.now(),
      ...storageInfo,
    });

    // Mostrar información en consola para debugging
    if (storageInfo) {
      const { usage, quota, usagePercent } = storageInfo;
      console.log(`🗄️ Sense DB inicializada:
📊 Almacenamiento: ${(usage / 1024 / 1024).toFixed(2)} MB de ${(quota / 1024 / 1024).toFixed(2)} MB (${usagePercent.toFixed(1)}%)
🔒 Persistente: ${isPersistent ? 'Sí' : 'No'}
💡 Capacidad estimada: ~${Math.floor(quota / 1024 / 1024)} MB disponibles para datos`);

      // Advertir si se está acercando al límite
      if (usagePercent > 80) {
        console.warn('⚠️ Advertencia: El almacenamiento está cerca del límite. Considera limpiar datos antiguos.');
      }
    }

    // Limpiar notificaciones expiradas en el arranque
    const { notificationAPI } = await import('./api');
    await notificationAPI.cleanupExpired();

  } catch (error) {
    console.error('Error inicializando almacenamiento:', error);
  }
}

// Hook para monitorear el almacenamiento
export function useStorageMonitor() {
  const checkStorage = async () => {
    const storageInfo = await getStorageInfo();
    if (storageInfo && storageInfo.usagePercent > 90) {
      // Mostrar notificación de espacio bajo
      const { notificationAPI } = await import('./api');
      await notificationAPI.create({
        type: 'storage_warning',
        title: '⚠️ Espacio de almacenamiento bajo',
        message: `Has usado ${storageInfo.usagePercent.toFixed(1)}% del espacio disponible. Considera limpiar datos antiguos.`,
        priority: 'high',
        category: 'system',
        read: false,
        dismissed: false,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 horas
      });
    }
  };

  return { checkStorage };
}

// Migración de datos desde localStorage (si existen)
export async function migrateFromLocalStorage(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Migrar configuraciones de Pomodoro
    const pomodoroSettings = localStorage.getItem('pomodoro-settings');
    if (pomodoroSettings) {
      await settingsAPI.set('pomodoro-settings', JSON.parse(pomodoroSettings));
      localStorage.removeItem('pomodoro-settings');
      console.log('✅ Migradas configuraciones de Pomodoro');
    }

    // Migrar reflexiones de sesión
    const sessionReflections = localStorage.getItem('sessionReflections');
    if (sessionReflections) {
      const reflections = JSON.parse(sessionReflections);
      const { default: db } = await import('./db');
      await db.reflections.bulkAdd(reflections);
      localStorage.removeItem('sessionReflections');
      console.log('✅ Migradas reflexiones de sesión');
    }

    // Migrar otros datos que puedan existir
    const keys = Object.keys(localStorage);
    const senseKeys = keys.filter(key => 
      key.startsWith('sense-') || 
      key.startsWith('estudio-') ||
      key.includes('flashcard') ||
      key.includes('goal')
    );

    for (const key of senseKeys) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          await settingsAPI.set(key, JSON.parse(value));
          localStorage.removeItem(key);
          console.log(`✅ Migrado: ${key}`);
        }
      } catch (error) {
        console.warn(`Error migrando ${key}:`, error);
      }
    }

    if (senseKeys.length > 0) {
      console.log(`🔄 Migración completada: ${senseKeys.length} elementos migrados a IndexedDB`);
    }

  } catch (error) {
    console.error('Error durante la migración:', error);
  }
}
