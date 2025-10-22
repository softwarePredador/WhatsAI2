import { useEffect, useCallback } from 'react';
import { UserSettings, STORAGE_KEY } from '../types/settings';
import toast from 'react-hot-toast';

/**
 * Hook para gerenciar notificações push do navegador
 * 
 * Funcionalidades:
 * - Pedir permissão quando toggle de Push Notifications for ativado
 * - Disparar notificações nativas do navegador
 * - Fallback para toast se permissão negada
 */
export const useNotifications = () => {
  // Verificar se push notifications estão habilitadas
  const isPushEnabled = useCallback((): boolean => {
    try {
      const settingsStr = localStorage.getItem(STORAGE_KEY);
      if (!settingsStr) return false;
      
      const settings: UserSettings = JSON.parse(settingsStr);
      return settings.notifications.push ?? false;
    } catch {
      return false;
    }
  }, []);

  // Pedir permissão para notificações
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('⚠️ Este navegador não suporta notificações push');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      toast.error('Permissão de notificações negada. Habilite nas configurações do navegador.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Notificações push habilitadas! 🔔');
        return true;
      } else {
        toast.error('Permissão de notificações negada.');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao pedir permissão:', error);
      return false;
    }
  }, []);

  // Disparar notificação push
  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isPushEnabled()) {
      return;
    }

    if (!('Notification' in window)) {
      console.warn('⚠️ Notificações não suportadas');
      return;
    }

    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/logo.png',
          badge: '/logo.png',
          ...options,
        });
      } catch (error) {
        console.error('❌ Erro ao enviar notificação:', error);
      }
    } else if (Notification.permission === 'default') {
      // Pedir permissão se ainda não foi perguntado
      requestPermission().then((granted) => {
        if (granted) {
          new Notification(title, {
            icon: '/logo.png',
            badge: '/logo.png',
            ...options,
          });
        }
      });
    }
  }, [isPushEnabled, requestPermission]);

  // Observar mudanças nas configurações de localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const enabled = isPushEnabled();
      
      // Se habilitou push notifications, pedir permissão
      if (enabled && Notification.permission === 'default') {
        requestPermission();
      }
    };

    // Escutar evento customizado disparado quando settings mudam
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChange', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleStorageChange);
    };
  }, [isPushEnabled, requestPermission]);

  return {
    sendNotification,
    requestPermission,
    isPushEnabled: isPushEnabled(),
    isSupported: 'Notification' in window,
    permission: 'Notification' in window ? Notification.permission : 'denied',
  };
};
