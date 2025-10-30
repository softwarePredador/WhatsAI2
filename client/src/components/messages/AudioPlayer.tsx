import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Download } from 'lucide-react';
import { audioManager } from '../../utils/audioManager';

interface AudioPlayerProps {
  mediaUrl: string;
  fromMe: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ mediaUrl, fromMe }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const audioIdRef = useRef<string>(`audio-${Math.random().toString(36).substr(2, 9)}`);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!waveformRef.current) return;

    // Criar WaveSurfer instance
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: fromMe ? '#ffffff80' : '#00000040',
      progressColor: fromMe ? '#ffffff' : '#128C7E',
      cursorColor: fromMe ? '#ffffff' : '#128C7E',
      barWidth: 2,
      barRadius: 3,
      barGap: 2,
      height: 32,
      normalize: true,
      backend: 'WebAudio',
      minPxPerSec: 1,
    });

    wavesurferRef.current = wavesurfer;

    // Carregar áudio
    wavesurfer.load(mediaUrl);

    // Eventos
    wavesurfer.on('ready', () => {
      setIsLoading(false);
      const durationSeconds = wavesurfer.getDuration();
      setDuration(formatTime(durationSeconds));
    });

    wavesurfer.on('play', () => {
      setIsPlaying(true);
      // Notificar o gerenciador que este áudio está tocando
      audioManager.play(audioIdRef.current, () => {
        wavesurfer.pause();
      });
    });

    wavesurfer.on('pause', () => {
      setIsPlaying(false);
      // Notificar o gerenciador que este áudio foi pausado
      audioManager.pause(audioIdRef.current);
    });

    wavesurfer.on('finish', () => {
      setIsPlaying(false);
      audioManager.pause(audioIdRef.current);
    });

    wavesurfer.on('audioprocess', () => {
      const time = wavesurfer.getCurrentTime();
      setCurrentTime(formatTime(time));
    });

    wavesurfer.on('error', (error) => {
      console.error('WaveSurfer error:', error);
      setIsLoading(false);
    });

    return () => {
      // Limpar ao desmontar
      audioManager.pause(audioIdRef.current);
      wavesurfer.destroy();
    };
  }, [mediaUrl, fromMe]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const handleDownload = async () => {
    try {
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = 'audio.mp3';
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
        disabled={isLoading}
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          fromMe 
            ? 'bg-white/20 hover:bg-white/30 text-white' 
            : 'bg-[#128C7E] hover:bg-[#0F7A6A] text-white'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={isPlaying ? 'Pausar' : 'Reproduzir'}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause size={14} fill="currentColor" />
        ) : (
          <Play size={14} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      {/* Waveform */}
      <div className="flex-1 min-w-0">
        <div ref={waveformRef} className="w-full" />
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
        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-opacity ${
          fromMe ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-gray-600'
        }`}
        title="Baixar áudio"
      >
        <Download size={14} />
      </button>
    </div>
  );
};
