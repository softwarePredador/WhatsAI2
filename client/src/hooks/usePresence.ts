import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socketService';

interface PresenceData {
  contactId: string;
  status: 'available' | 'unavailable' | 'composing';
  isTyping: boolean;
  isOnline: boolean;
}

interface ContactPresence {
  status: 'online' | 'offline' | 'typing';
  lastSeen?: Date;
}

export const usePresence = (instanceId: string) => {
  const [presences, setPresences] = useState<Map<string, ContactPresence>>(new Map());

  const updatePresence = useCallback((data: PresenceData) => {
    setPresences(prev => {
      const newPresences = new Map(prev);
      const contactId = data.contactId.replace('@s.whatsapp.net', '');

      newPresences.set(contactId, {
        status: data.isTyping ? 'typing' : (data.isOnline ? 'online' : 'offline'),
        lastSeen: data.isOnline ? undefined : new Date()
      });

      return newPresences;
    });
  }, []);

  const getPresence = useCallback((remoteJid: string): ContactPresence => {
    const contactId = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
    return presences.get(contactId) || { status: 'offline', lastSeen: new Date() };
  }, [presences]);

  useEffect(() => {
    if (!instanceId) return;

    const handlePresenceUpdate = (data: PresenceData) => {
      console.log('🟢 [Presence] Received update:', data);
      updatePresence(data);
    };

    socketService.on('presence:update', handlePresenceUpdate);

    return () => {
      socketService.off('presence:update', handlePresenceUpdate);
    };
  }, [instanceId, updatePresence]);

  return {
    getPresence,
    presences
  };
};