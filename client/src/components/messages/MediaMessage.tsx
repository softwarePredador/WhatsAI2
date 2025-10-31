import React, { useState, useRef } from 'react';
import { Download, Image as ImageIcon, File, AlertCircle, Loader } from 'lucide-react';
import { AudioPlayerSimple } from './AudioPlayerSimple';

interface MediaMessageProps {
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio' | 'document' | 'sticker';
  fileName?: string;
  caption?: string;
  fromMe?: boolean;
}

export const MediaMessage: React.FC<MediaMessageProps> = ({
  mediaUrl,
  mediaType,
  fileName,
  caption,
  fromMe = false
}) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-base-200">
                <Loader className="animate-spin text-base-content/60" size={24} />
              </div>
            )}
            {hasError ? (
              <div className="flex items-center justify-center w-32 h-32 rounded-lg bg-base-200">
                <div className="text-center">
                  <AlertCircle className="mx-auto text-error mb-2" size={24} />
                  <p className="text-xs text-base-content/60">Erro ao carregar</p>
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
              <p className="text-sm mt-2 text-base-content">{caption}</p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="relative">
            <video
              ref={videoRef}
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
              <p className="text-sm mt-2 text-base-content">{caption}</p>
            )}
          </div>
        );

      case 'audio':
        return <AudioPlayerSimple mediaUrl={mediaUrl} fromMe={fromMe} />;

      case 'document':
        return (
          <div className="flex items-center space-x-3 p-3 rounded-lg max-w-xs bg-base-200">
            <File size={24} className="text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-base-content">
                {fileName || 'Documento'}
              </p>
              <p className="text-xs text-base-content/60">Documento</p>
            </div>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base-content/60 hover:text-base-content"
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
          <div className="relative inline-block">
            {isLoading && (
              <div className="flex items-center justify-center w-32 h-32">
                <Loader className="animate-spin text-base-content/60" size={24} />
              </div>
            )}
            {hasError ? (
              <div className="flex flex-col items-center justify-center w-32 h-32 rounded-lg bg-base-200">
                <AlertCircle className="text-error mb-2" size={24} />
                <p className="text-xs text-base-content/60">Erro ao carregar</p>
              </div>
            ) : (
              <img
                src={mediaUrl}
                alt="Sticker"
                className={`w-32 h-32 object-contain cursor-pointer hover:scale-105 transition-transform ${isLoading ? 'hidden' : ''}`}
                onError={() => {
                  console.error('Erro ao carregar sticker:', mediaUrl);
                  setHasError(true);
                  setIsLoading(false);
                }}
                onLoad={() => {
                  setIsLoading(false);
                  setHasError(false);
                }}
                onClick={() => setShowImageModal(true)}
              />
            )}
          </div>
        );

      default:
        return (
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-base-200">
            <ImageIcon size={20} className="text-base-content/60" />
            <span className="text-sm text-base-content">
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
          className="fixed inset-0 bg-base-300 bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
              className="absolute top-4 right-4 text-base-content bg-base-100 bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-colors"
            >
              ✕
            </button>
            {caption && (
              <p className="absolute bottom-4 left-4 right-4 text-base-content bg-base-100 bg-opacity-80 p-2 rounded">
                {caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};