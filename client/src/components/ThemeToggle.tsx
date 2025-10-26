import { Moon, Sun, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';
import { UserSettings, STORAGE_KEY } from '../types/settings';

type Theme = 'light' | 'dark' | 'auto';

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('auto');
  const [isOpen, setIsOpen] = useState(false);

  // Carregar tema atual
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      const settings: UserSettings = item ? JSON.parse(item) : { appearance: { theme: 'auto' } };
      setTheme(settings.appearance.theme);
    } catch {
      setTheme('auto');
    }
  }, []);

  // Função para alterar tema
  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);

    // Atualizar localStorage
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      const settings: UserSettings = item ? JSON.parse(item) : { appearance: { theme: 'auto' } };
      settings.appearance.theme = newTheme;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

      // Disparar evento customizado para notificar outros componentes
      window.dispatchEvent(new CustomEvent('localStorageChange', {
        detail: { key: STORAGE_KEY, value: settings }
      }));
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    }

    setIsOpen(false);
  };

  // Ícone atual baseado no tema
  const getCurrentIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-5 w-5" />;
      case 'dark':
        return <Moon className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-2 rounded-full border transition-colors duration-300 bg-base-200/60 border-base-300 hover:border-primary"
        aria-label="Alternar tema"
      >
        {getCurrentIcon()}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 rounded-box shadow-lg z-50 bg-base-100 border border-base-300">
          <div className="py-1">
            <button
              onClick={() => changeTheme('light')}
              className={`flex items-center w-full px-4 py-2 text-sm hover:bg-base-200 ${
                theme === 'light' ? 'text-primary font-medium' : 'text-base-content'
              }`}
            >
              <Sun className="h-4 w-4 mr-3" />
              Claro
            </button>
            <button
              onClick={() => changeTheme('dark')}
              className={`flex items-center w-full px-4 py-2 text-sm hover:bg-base-200 ${
                theme === 'dark' ? 'text-primary font-medium' : 'text-base-content'
              }`}
            >
              <Moon className="h-4 w-4 mr-3" />
              Escuro
            </button>
            <button
              onClick={() => changeTheme('auto')}
              className={`flex items-center w-full px-4 py-2 text-sm hover:bg-base-200 ${
                theme === 'auto' ? 'text-primary font-medium' : 'text-base-content'
              }`}
            >
              <Monitor className="h-4 w-4 mr-3" />
              Automático
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeToggle;