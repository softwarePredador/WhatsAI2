import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AudioPlayer } from './AudioPlayer';

// Mock for global Audio
window.HTMLMediaElement.prototype.play = vi.fn();
window.HTMLMediaElement.prototype.pause = vi.fn();
window.HTMLMediaElement.prototype.load = vi.fn();

// Mock WaveSurfer
vi.mock('wavesurfer.js', () => ({
  default: {
    create: vi.fn(() => {
      const callbacks: any = {};
      return {
        load: vi.fn((loadUrl) => {
          if (loadUrl.includes('missing-audio')) {
            // Simulate error for missing files
            setTimeout(() => callbacks.error && callbacks.error(new Error('Not found')), 100);
          } else {
            // Simulate ready for existing files
            setTimeout(() => callbacks.ready && callbacks.ready(), 100);
          }
        }),
        play: vi.fn(),
        pause: vi.fn(),
        playPause: vi.fn(() => {
          // Simulate calling HTML audio play for MediaElement backend
          window.HTMLMediaElement.prototype.play();
        }),
        isPlaying: vi.fn(() => false),
        getDuration: vi.fn(() => 120), // 2 minutes
        getCurrentTime: vi.fn(() => 30), // 30 seconds
        on: vi.fn((event, callback) => {
          callbacks[event] = callback;
        }),
        unAll: vi.fn(),
        destroy: vi.fn(),
      };
    }),
  },
}));

// Mock fetch for audio HEAD and GET with Response objects
beforeAll(() => {
  global.fetch = vi.fn((input, init) => {
    const url = typeof input === 'string' ? input : '';
    if (url.includes('test-audio.mp3') || url.includes('test-audio.ogg')) {
      if (init && init.method === 'HEAD') {
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      // Simulate audio file fetch
      return Promise.resolve(new Response(new Blob(), { status: 200 }));
    }
    // Simulate missing audio
    return Promise.resolve(new Response(null, { status: 404 }));
  });
});

afterAll(() => {
  vi.resetAllMocks();
});

describe('AudioPlayer', () => {
  it('renders and plays MP3 audio', async () => {
  render(<AudioPlayer mediaUrl="/api/media/audio/test-audio.mp3" fromMe={false} />);
  const playButton = screen.getByRole('button', { name: /reproduzir/i });
  expect(playButton).toBeInTheDocument();
  // Wait for loading spinner to disappear (button enabled)
  await waitFor(() => expect(playButton).not.toBeDisabled());
  fireEvent.click(playButton);
  await waitFor(() => expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled());
  });

  it('renders and plays OGG audio (backward compatibility)', async () => {
  render(<AudioPlayer mediaUrl="/api/media/audio/test-audio.ogg" fromMe={false} />);
  const playButton = screen.getByRole('button', { name: /reproduzir/i });
  expect(playButton).toBeInTheDocument();
  await waitFor(() => expect(playButton).not.toBeDisabled());
  fireEvent.click(playButton);
  await waitFor(() => expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled());
  });

  it('shows error if audio is missing', async () => {
    render(<AudioPlayer mediaUrl="/api/media/audio/missing-audio.mp3" fromMe={false} />);
    expect(await screen.findByText('Áudio não encontrado ou indisponível')).toBeInTheDocument();
  });
});
