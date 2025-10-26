import { useEffect, useState } from 'react';
import { UserSettings, DEFAULT_SETTINGS, STORAGE_KEY } from '../types/settings';

/**
 * Hook para gerenciar o tema da aplicação (light/dark/auto)
 * Usa data-theme do DaisyUI para aplicar tema
 */
export function useTheme() {
  // Carregar settings diretamente do localStorage para forçar reatividade
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(() => {
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      const settings: UserSettings = item ? JSON.parse(item) : DEFAULT_SETTINGS;
      return settings.appearance.theme;
    } catch {
      return DEFAULT_SETTINGS.appearance.theme;
    }
  });

  // Escutar mudanças no localStorage (evento customizado)
  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.key === STORAGE_KEY) {
        const newSettings = customEvent.detail.value as UserSettings;
        console.log('🔔 [Theme] Detected settings change, new theme:', newSettings.appearance.theme);
        setTheme(newSettings.appearance.theme);
      }
    };

    window.addEventListener('localStorageChange', handleStorageChange);
    
    return () => {
      window.removeEventListener('localStorageChange', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    
    console.log('🎨 [Theme] useEffect triggered! Current theme:', theme, 'Type:', typeof theme);
    
    // Função para aplicar o tema usando data-theme do DaisyUI
    const applyTheme = (themeName: 'light' | 'dark') => {
      // Usar os temas padrão do DaisyUI customizados
      root.setAttribute('data-theme', themeName);

      // Gerenciar classe 'dark' para Tailwind dark: utilities
      if (themeName === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
        // Garantir que não há classe dark residual
        root.classList.remove('dark');
      }

      console.log(`${themeName === 'dark' ? '🌙' : '☀️'} [Theme] ${themeName} mode APPLIED - data-theme:`, root.getAttribute('data-theme'), 'has dark class:', root.classList.contains('dark'));
    };

    // Aplicar tema baseado na configuração
    if (theme === 'dark') {
      applyTheme('dark');
    } else if (theme === 'light') {
      applyTheme('light');
    } else if (theme === 'auto') {
      // Detectar preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
      console.log(`🔄 [Theme] Auto mode - Using ${prefersDark ? 'dark' : 'light'} (system preference)`);
      
      // Listener para mudanças na preferência do sistema
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
        console.log(`🔄 [Theme] System preference changed to ${e.matches ? 'dark' : 'light'}`);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [theme]);

  return theme;
}
