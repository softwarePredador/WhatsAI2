import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Download } from 'lucide-react';
import { audioManager } from '../../utils/audioManager';

interface AudioPlayerProps {
  mediaUrl: string;
  fromMe: boolean;
}

// Simple request queue to prevent too many concurrent HEAD requests
class RequestQueue {
  private queue: Array<{ fn: () => Promise<any>, resolve: (value: any) => void, reject: (error: any) => void }> = [];
  private running = 0;
  private maxConcurrent = 3; // Limit to 3 concurrent requests

  async add<T>(fn: () => Promise<T>): Promise<T> {
    console.log(`[RequestQueue] Adding request to queue. Current queue length: ${this.queue.length}, running: ${this.running}`);
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  private async process() {
    console.log(`[RequestQueue] Processing queue. Running: ${this.running}, Queue length: ${this.queue.length}`);
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      console.log(`[RequestQueue] Not processing - running: ${this.running}, max: ${this.maxConcurrent}, queue: ${this.queue.length}`);
      return;
    }

    this.running++;
    const item = this.queue.shift()!;
    console.log(`[RequestQueue] Starting execution of queued function. New running count: ${this.running}`);

    try {
      const result = await item.fn();
      console.log(`[RequestQueue] Request completed successfully`);
      item.resolve(result);
    } catch (error) {
      console.error(`[RequestQueue] Request failed:`, error);
      item.reject(error);
    } finally {
      this.running--;
      console.log(`[RequestQueue] Function completed. New running count: ${this.running}`);
      this.process(); // Process next item in queue
    }
  }
}

const requestQueue = new RequestQueue();

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ mediaUrl, fromMe }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioIdRef = useRef<string>(`audio-${Math.random().toString(36).substr(2, 9)}`);
  const isMountedRef = useRef<boolean>(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Generate static waveform bars (visual only)
  const waveformBars = Array.from({ length: 40 }, (_, i) => {
    // Create varied heights for visual effect
    const baseHeight = 20 + Math.sin(i / 3) * 10 + Math.random() * 15;
    return Math.max(10, Math.min(40, baseHeight));
  });

  // Transform Spaces URL to proxy URL
  const getProxyUrl = (url: string): string => {
    console.log('[AudioPlayer] getProxyUrl called with:', url);
    if (url.includes('digitaloceanspaces.com') && url.includes('incoming/audio/')) {
      const pathParts = url.split('incoming/audio/');
      if (pathParts.length > 1) {
        const filename = pathParts[1];
        const proxyUrl = `/api/media/audio/${filename}`;
        console.log('[AudioPlayer] Converted to proxy URL:', proxyUrl);
        return proxyUrl;
      }
    }
    console.log('[AudioPlayer] No conversion needed, returning original URL');
    return url;
  };

  const proxyUrl = getProxyUrl(mediaUrl);
  console.log('[AudioPlayer] Final proxyUrl:', proxyUrl);

  // Ref to track if initialization has started
  const initStartedRef = useRef(false);

  useEffect(() => {
    if (!waveformRef.current || isDestroyed) return;

    // Reset initialization flag when proxyUrl changes (useEffect dependency)
    initStartedRef.current = false;

    // Prevent multiple initializations
    if (wavesurferRef.current) return;

    initStartedRef.current = true;
    isMountedRef.current = true;

    // Pré-fetch do áudio antes de criar o WaveSurfer
    setIsLoading(true);
    setLoadError(null);
    console.log('[AudioPlayer] Starting HEAD request to:', proxyUrl);

    // Function to attempt HEAD request with retry logic
    const attemptHeadRequest = async (retries = 3, delay = 1000): Promise<Response> => {
      console.log(`[AudioPlayer] attemptHeadRequest called for URL: ${proxyUrl}`);
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`[AudioPlayer] HEAD request attempt ${attempt}/${retries} to:`, proxyUrl);
          const response = await fetch(proxyUrl, {
            method: 'HEAD',
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });

          console.log('[AudioPlayer] HEAD response status:', response.status);
          console.log('[AudioPlayer] HEAD response headers:', Object.fromEntries(response.headers.entries()));

          if (!response.ok) {
            console.error(`[AudioPlayer] HEAD request failed with status: ${response.status} on attempt ${attempt}`);
            if (attempt === retries) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
            continue;
          }

          console.log('[AudioPlayer] HEAD request successful on attempt', attempt);
          return response;
        } catch (error) {
          console.error(`[AudioPlayer] HEAD request error on attempt ${attempt}:`, error);

          if (attempt === retries) {
            throw error;
          }

          // Wait before retry with exponential backoff
          const waitTime = delay * Math.pow(2, attempt - 1);
          console.log(`[AudioPlayer] Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      // This should never be reached, but TypeScript needs it
      throw new Error('All retry attempts failed');
    };

    // Use request queue to prevent too many concurrent HEAD requests
    requestQueue.add(() => attemptHeadRequest())
      .then((res: Response) => {
        console.log('[AudioPlayer] HEAD response status:', res.status);
        console.log('[AudioPlayer] HEAD response headers:', Object.fromEntries(res.headers.entries()));
        if (!res.ok) {
          console.error('[AudioPlayer] HEAD request failed with status:', res.status);
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        console.log('[AudioPlayer] HEAD request successful, proceeding with WaveSurfer initialization');
        console.log(`[AudioPlayer] Checking conditions - isMounted: ${isMountedRef.current}, waveformRef exists: ${!!waveformRef.current}`);

        if (!isMountedRef.current) {
          console.log('[AudioPlayer] Component unmounted, aborting WaveSurfer creation');
          return;
        }        // Criar WaveSurfer instance
        const containerEl = waveformRef.current;
        if (!containerEl) {
          console.error('[AudioPlayer] Container element not found! waveformRef.current is null');
          setLoadError('Erro interno: container não encontrado.');
          setIsLoading(false);
          return;
        }
        
        console.log('[AudioPlayer] Creating WaveSurfer instance...');
        console.log('[AudioPlayer] Container element:', containerEl);
        console.log('[AudioPlayer] Container dimensions:', {
          width: containerEl.offsetWidth,
          height: containerEl.offsetHeight,
          clientWidth: containerEl.clientWidth
        });
        
        const wavesurfer = WaveSurfer.create({
          container: containerEl,
          waveColor: fromMe ? '#ffffff80' : '#00000040',
          progressColor: fromMe ? '#ffffff' : '#128C7E',
          cursorColor: fromMe ? '#ffffff' : '#128C7E',
          barWidth: 2,
          barRadius: 3,
          barGap: 2,
          height: 32,
          normalize: true,
          mediaControls: false,
          hideScrollbar: true,
          autoScroll: false,
          dragToSeek: true,
        });

        console.log('[AudioPlayer] WaveSurfer instance created:', wavesurfer);
        wavesurferRef.current = wavesurfer;

        // Carregar áudio only if component is still mounted
        if (isMountedRef.current) {
          wavesurfer.load(proxyUrl);
          console.log('[AudioPlayer] Loading audio into WaveSurfer');
        } else {
          console.log(`[AudioPlayer] Skipping load - mounted: ${isMountedRef.current}`);
        }

        // Eventos
        wavesurfer.on('ready', () => {
          console.log(`[AudioPlayer] WaveSurfer 'ready' event fired for: ${proxyUrl}`);
          console.log('[AudioPlayer] WaveSurfer container after ready:', {
            innerHTML: waveformRef.current?.innerHTML.substring(0, 200),
            childrenCount: waveformRef.current?.children.length,
            firstChildTagName: waveformRef.current?.children[0]?.tagName,
            hasCanvas: !!waveformRef.current?.querySelector('canvas'),
            hasSVG: !!waveformRef.current?.querySelector('svg')
          });
          console.log('[AudioPlayer] WaveSurfer wrapper:', wavesurfer.getWrapper());
          if (!isMountedRef.current || isDestroyed) return;
          setIsLoading(false);
          const durationSeconds = wavesurfer.getDuration();
          setDuration(formatTime(durationSeconds));
          console.log(`[AudioPlayer] Audio ready - duration: ${durationSeconds}s`);
        });

        wavesurfer.on('play', () => {
          console.log(`[AudioPlayer] WaveSurfer 'play' event`);
          if (!isMountedRef.current || isDestroyed) return;
          setIsPlaying(true);
          audioManager.play(audioIdRef.current, () => {
            wavesurfer.pause();
          });
        });

        wavesurfer.on('pause', () => {
          console.log(`[AudioPlayer] WaveSurfer 'pause' event`);
          if (!isMountedRef.current || isDestroyed) return;
          setIsPlaying(false);
          audioManager.pause(audioIdRef.current);
        });

        wavesurfer.on('finish', () => {
          console.log(`[AudioPlayer] WaveSurfer 'finish' event`);
          if (!isMountedRef.current || isDestroyed) return;
          setIsPlaying(false);
          audioManager.pause(audioIdRef.current);
        });

        wavesurfer.on('audioprocess', () => {
          if (!isMountedRef.current || isDestroyed) return;
          const time = wavesurfer.getCurrentTime();
          setCurrentTime(formatTime(time));
        });

        wavesurfer.on('error', (error) => {
          console.error(`[AudioPlayer] WaveSurfer 'error' event for ${proxyUrl}:`, error);
          if (!isMountedRef.current || isDestroyed) return;
          if (error.name === 'AbortError') {
            console.debug('WaveSurfer fetch aborted (expected during cleanup)');
            return;
          }
          console.error('WaveSurfer error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          setIsLoading(false);
          setLoadError('Erro ao carregar áudio.');
        });
      })
      .catch((err) => {
        console.error('[AudioPlayer] HEAD request failed:', err);
        console.error('[AudioPlayer] Error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack
        });
        setIsLoading(false);
        setLoadError(err.message || 'Erro ao carregar áudio.');
      });

    return () => {
      isMountedRef.current = false;
      setIsDestroyed(true);

      // Reset initialization flag for next mount
      initStartedRef.current = false;

      audioManager.pause(audioIdRef.current);

      if (wavesurferRef.current) {
        const ws = wavesurferRef.current;
        wavesurferRef.current = null;

        try {
          ws.unAll();
        } catch (e) {
          console.error('[AudioPlayer] Error during ws.unAll()', e);
        }
        try {
          if (ws.isPlaying()) {
            ws.pause();
          }
        } catch (e) {
          console.error('[AudioPlayer] Error during ws.pause()', e);
        }
        try {
          if (waveformRef.current) {
            waveformRef.current.innerHTML = '';
          }
        } catch (e) {
          console.error('[AudioPlayer] Error clearing waveform container', e);
        }
        try {
          Promise.resolve(ws.destroy()).catch((e) => {
            console.debug('[AudioPlayer] WaveSurfer destroy promise rejected (expected during cleanup)', e);
          });
        } catch (e) {
          console.error('[AudioPlayer] Error during ws.destroy()', e);
        }
      }
    };
  }, [proxyUrl, fromMe]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (wavesurferRef.current && isMountedRef.current && !isDestroyed) {
      wavesurferRef.current.playPause();
    }
  };

  const handleDownload = async () => {
    try {
      const link = document.createElement('a');
      link.href = proxyUrl;
      // Use appropriate extension based on URL or default to mp3 since we convert to MP3
      const extension = proxyUrl.includes('.mp3') ? 'mp3' : 'ogg';
      link.download = `audio.${extension}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar áudio:', error);
    }
  };

  return (
    <div 
      className={`flex items-center gap-2 p-2 rounded-lg max-w-xs ${
        fromMe ? 'bg-[#005C4B]' : 'bg-white'
      }`}
      style={{ minWidth: '250px' }}
    >
      {/* Play/Pause Button */}
      <button
        onClick={handlePlayPause}
        disabled={isLoading || !!loadError}
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          fromMe 
            ? 'bg-white/20 hover:bg-white/30 text-white' 
            : 'bg-[#128C7E] hover:bg-[#0F7A6A] text-white'
        } ${(isLoading || loadError) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={isPlaying ? 'Pausar' : 'Reproduzir'}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : loadError ? (
          <span className="text-xs">!</span>
        ) : isPlaying ? (
          <Pause size={14} fill="currentColor" />
        ) : (
          <Play size={14} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      {/* Waveform ou erro */}
      <div className="flex-1 min-w-0">
        {loadError ? (
          <div className="text-xs text-red-500 px-2">{loadError}</div>
        ) : (
          <div ref={waveformRef} className="w-full" />
        )}
      </div>

      {/* Time Display */}
      <div className={`flex-shrink-0 text-xs font-mono ${
        fromMe ? 'text-white/80' : 'text-gray-600'
      }`}>
        {isPlaying ? currentTime : duration}
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={!!loadError}
        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-opacity ${
          fromMe ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-gray-600'
        } ${(loadError) ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Baixar áudio"
      >
        <Download size={14} />
      </button>
    </div>
  );
};
