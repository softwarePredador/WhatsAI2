import { useState, useEffect } from 'react';

/**
 * Hook customizado para gerenciar estado com persistência em localStorage
 * @param key - Chave do localStorage
 * @param initialValue - Valor inicial caso não exista no localStorage
 * @returns [value, setValue] - Estado e função para atualizar
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Estado para armazenar o valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Buscar do localStorage
      const item = window.localStorage.getItem(key);
      
      // Parsear JSON ou retornar valor inicial
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Atualizar localStorage quando o valor mudar
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
      console.log(`💾 [localStorage] Saved "${key}":`, storedValue);
      
      // Disparar evento customizado para notificar outros hooks na mesma aba
      window.dispatchEvent(new CustomEvent('localStorageChange', {
        detail: { key, value: storedValue }
      }));
    } catch (error) {
      console.error(`Error saving localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
