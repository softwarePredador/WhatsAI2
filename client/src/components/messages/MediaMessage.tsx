import React, { useState } from 'react';
import { Play, Pause, Download, Image as ImageIcon, File, Music, AlertCircle, Loader } from 'lucide-react';

interface MediaMessageProps {
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio' | 'document' | 'sticker';
  fileName?: string;
  caption?: string;
}

export const MediaMessage: React.FC<MediaMessageProps> = ({
  mediaUrl,
  mediaType,
  fileName,
  caption
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implementar controle de áudio/vídeo
  };

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      // Criar link temporário para download
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = fileName || 'arquivo';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const renderMediaContent = () => {
    switch (mediaType) {
      case 'image':
        return (
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Loader className="animate-spin text-gray-500" size={24} />
              </div>
            )}
            {hasError ? (
              <div className="flex items-center justify-center w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="text-center">
                  <AlertCircle className="mx-auto text-red-500 mb-2" size={24} />
                  <p className="text-xs text-gray-500">Erro ao carregar</p>
                </div>
              </div>
            ) : (
              <img
                src={mediaUrl}
                alt={caption || 'Imagem'}
                className={`max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${isLoading ? 'hidden' : ''}`}
                onClick={() => setShowImageModal(true)}
                onError={() => {
                  console.error('Erro ao carregar imagem:', mediaUrl);
                  setHasError(true);
                  setIsLoading(false);
                }}
                onLoad={() => {
                  setIsLoading(false);
                  setHasError(false);
                }}
              />
            )}
            {caption && (
              <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">{caption}</p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="relative">
            <video
              src={mediaUrl}
              controls
              className="max-w-full max-h-64 rounded-lg"
              onError={() => {
                console.error('Erro ao carregar vídeo:', mediaUrl);
                setHasError(true);
              }}
            >
              Seu navegador não suporta a tag video.
            </video>
            {caption && (
              <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">{caption}</p>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg max-w-xs">
            <button
              onClick={handlePlayPause}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Music size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Áudio
                </span>
              </div>
              <audio
                src={mediaUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                className="w-full mt-2"
                controls
              />
            </div>
          </div>
        );

      case 'document':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg max-w-xs">
            <File size={24} className="text-blue-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {fileName || 'Documento'}
              </p>
              <p className="text-xs text-gray-500">Documento</p>
            </div>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isDownloading ? "Baixando..." : "Baixar arquivo"}
            >
              {isDownloading ? (
                <Loader className="animate-spin" size={16} />
              ) : (
                <Download size={16} />
              )}
            </button>
          </div>
        );

      case 'sticker':
        return (
          <div className="relative">
            <img
              src={mediaUrl}
              alt="Sticker"
              className="w-24 h-24 object-contain"
              onError={(e) => {
                console.error('Erro ao carregar sticker:', mediaUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        );

      default:
        return (
          <div className="flex items-center space-x-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <ImageIcon size={20} className="text-gray-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Mídia não suportada
            </span>
          </div>
        );
    }
  };

  return (
    <>
      {renderMediaContent()}

      {/* Modal para visualizar imagem em tamanho maior */}
      {showImageModal && mediaType === 'image' && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={mediaUrl}
              alt={caption || 'Imagem ampliada'}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-colors"
            >
              ✕
            </button>
            {caption && (
              <p className="absolute bottom-4 left-4 right-4 text-white bg-black bg-opacity-50 p-2 rounded">
                {caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};