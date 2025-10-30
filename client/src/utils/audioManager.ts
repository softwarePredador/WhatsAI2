/**
 * Audio Manager - Gerencia reprodução de múltiplos áudios
 * Garante que apenas um áudio toca por vez
 */

type AudioInstance = {
  id: string;
  pause: () => void;
};

class AudioManager {
  private currentAudio: AudioInstance | null = null;

  /**
   * Registra um novo áudio como ativo
   * Para o áudio anterior se houver
   */
  play(id: string, pauseFn: () => void) {
    // Se já existe um áudio tocando e não é o mesmo
    if (this.currentAudio && this.currentAudio.id !== id) {
      this.currentAudio.pause();
    }

    // Registra o novo áudio ativo
    this.currentAudio = { id, pause: pauseFn };
  }

  /**
   * Remove o áudio ativo quando for pausado
   */
  pause(id: string) {
    if (this.currentAudio?.id === id) {
      this.currentAudio = null;
    }
  }

  /**
   * Para o áudio atual se houver
   */
  stopCurrent() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }
}

// Singleton global
export const audioManager = new AudioManager();
