// src/setupTests.js
// Vitest global setup — executado antes de cada arquivo de teste

import '@testing-library/jest-dom';

// --- Polyfills e Mocks Globais ---

// 1. Mock de window.confirm e window.alert (usados no App.jsx)
global.confirm = vi.fn(() => true);
global.alert = vi.fn();

// 2. Mock de localStorage (jsdom já oferece um, mas garantimos reset entre testes)
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

// 3. Mock de navigator.mediaDevices (câmera — não disponível no jsdom)
Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn(), getSettings: () => ({ deviceId: 'cam-001' }) }],
      getVideoTracks: () => [{ getSettings: () => ({ deviceId: 'cam-001' }) }],
    }),
    enumerateDevices: vi.fn().mockResolvedValue([
      { kind: 'videoinput', deviceId: 'cam-001', label: 'Câmera Principal' },
    ]),
  },
});

// 4. Mock de requestAnimationFrame / cancelAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => { cb(0); return 0; });
global.cancelAnimationFrame = vi.fn();

// 5. Mock de URL.createObjectURL (usado em exportação)
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();
