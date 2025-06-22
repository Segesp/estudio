
import { useState, useCallback, useEffect } from 'react';

type NotificationPermission = "default" | "denied" | "granted";

interface UseNotificationsReturn {
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  showNotification: (title: string, options?: NotificationOptions) => void;
}

function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (!("Notification" in window)) {
      console.warn("Este navegador no soporta notificaciones de escritorio.");
      setPermission("denied"); // Treat as denied if not supported
      return;
    }
    setPermission(Notification.permission as NotificationPermission);
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!("Notification" in window)) {
      return "denied";
    }
    const result = await Notification.requestPermission();
    setPermission(result as NotificationPermission);
    return result as NotificationPermission;
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!("Notification" in window)) {
      console.warn("Notificaciones no soportadas.");
      return;
    }

    if (permission === "granted") {
      new Notification(title, { ...options, lang: 'es' });
    } else if (permission === "default") {
      requestPermission().then(currentPermission => {
        if (currentPermission === "granted") {
          new Notification(title, { ...options, lang: 'es' });
        }
      });
    } else {
      // console.log("Permiso de notificación denegado.");
      // Optionally, inform the user they need to enable notifications in browser settings
    }
  }, [permission, requestPermission]);

  return { permission, requestPermission, showNotification };
}

export default useNotifications;
