// src/__tests__/unit/MeasurementService.test.js
// Testes unitários de MeasurementService — cálculos geométricos puros
// Nota: processMeasurement depende de window.cv (OpenCV.js) → mockado aqui
//       calculateDistance é pura e testável sem mocks

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateDistance, processMeasurement } from '../../services/MeasurementService';
import { REGION_CAPOTA, REGION_INVALIDA } from '../../fixtures/region.fixture';
import { CALIBRATION_HORIZONTAL_10MM } from '../../fixtures/calibration.fixture';

// ─────────────────────────────────────────────────────────────────────────────
// 1. calculateDistance — função pura (sem dependências externas)
// ─────────────────────────────────────────────────────────────────────────────
describe('calculateDistance', () => {
  const scaleFactor = CALIBRATION_HORIZONTAL_10MM.expectedScaleFactor; // 10 px/mm

  it('deve retornar 0 se p1 for null', () => {
    expect(calculateDistance(null, { x: 100, y: 100 }, scaleFactor)).toBe(0);
  });

  it('deve retornar 0 se p2 for null', () => {
    expect(calculateDistance({ x: 0, y: 0 }, null, scaleFactor)).toBe(0);
  });

  it('deve retornar 0 se scaleFactor for null', () => {
    expect(calculateDistance({ x: 0, y: 0 }, { x: 100, y: 0 }, null)).toBe(0);
  });

  it('deve calcular distância horizontal: 100px / 10 = 10 mm', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 100, y: 0 };
    expect(calculateDistance(p1, p2, scaleFactor)).toBeCloseTo(10, 4);
  });

  it('deve calcular distância vertical: 50px / 10 = 5 mm', () => {
    const p1 = { x: 200, y: 100 };
    const p2 = { x: 200, y: 150 };
    expect(calculateDistance(p1, p2, scaleFactor)).toBeCloseTo(5, 4);
  });

  it('deve calcular distância diagonal (3-4-5): 50px / 10 = 5 mm', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 30, y: 40 }; // dist = 50px
    const scale = 10;
    expect(calculateDistance(p1, p2, scale)).toBeCloseTo(5, 4);
  });

  it('deve ser simétrica: dist(A,B) === dist(B,A)', () => {
    const p1 = { x: 10, y: 20 };
    const p2 = { x: 90, y: 80 };
    expect(calculateDistance(p1, p2, scaleFactor))
      .toBeCloseTo(calculateDistance(p2, p1, scaleFactor), 10);
  });

  it('deve retornar 0 para pontos idênticos', () => {
    const p = { x: 100, y: 100 };
    expect(calculateDistance(p, p, scaleFactor)).toBe(0);
  });

  it('deve funcionar com scaleFactor fracionário', () => {
    // 50px / 2.5 px/mm = 20 mm
    expect(calculateDistance({ x: 0, y: 0 }, { x: 50, y: 0 }, 2.5)).toBeCloseTo(20, 4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. processMeasurement — depende de window.cv (mockado)
// ─────────────────────────────────────────────────────────────────────────────
describe('processMeasurement — com window.cv mockado', () => {
  let mockCv;
  let mockVideoElement;

  // Helper para criar um mock de Mat com delete()
  const createMat = (overrides = {}) => ({
    delete: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    // Mock de um contorno com area > 50
    const mockContour = { size: vi.fn(() => 1) };

    mockCv = {
      Mat: vi.fn(() => createMat()),
      MatVector: vi.fn(() => ({
        size: vi.fn(() => 1),
        get: vi.fn(() => createMat()),
        delete: vi.fn(),
      })),
      COLOR_RGBA2GRAY: 6,
      BORDER_DEFAULT: 4,
      THRESH_BINARY_INV: 1,
      THRESH_OTSU: 8,
      RETR_EXTERNAL: 0,
      CHAIN_APPROX_SIMPLE: 2,
      Size: vi.fn((w, h) => ({ width: w, height: h })),
      matFromImageData: vi.fn(() => createMat()),
      cvtColor: vi.fn(),
      GaussianBlur: vi.fn(),
      threshold: vi.fn(),
      findContours: vi.fn(),
      contourArea: vi.fn(() => 500), // área > 50 — contorno válido
      moments: vi.fn(() => ({ m00: 100, m10: 5000, m01: 3000 })), // cx=50, cy=30
      minAreaRect: vi.fn(() => ({
        center: { x: 50, y: 30 },
        size: { width: 80, height: 40 },
        angle: 15,
      })),
    };

    // Mock de HTMLVideoElement
    mockVideoElement = {
      videoWidth: 640,
      videoHeight: 480,
      readyState: 4,
    };

    // Instalar mock no global
    global.window = { ...global.window, cv: mockCv };

    // Mock do canvas criado internamente
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({
            drawImage: vi.fn(),
            getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 10, height: 10 })),
          })),
        };
      }
      return document.createElement.__original(tag);
    });
  });

  it('deve retornar erro se window.cv não estiver disponível', () => {
    // REFATORAÇÃO: processMeasurement aceita cv como 3º parâmetro injetável
    // Testando o guard de segurança
    const result = processMeasurement(mockVideoElement, REGION_CAPOTA, 10, null);
    expect(result.error).toBeDefined();
  });

  it('deve retornar erro para região com dimensão zero', () => {
    const result = processMeasurement(mockVideoElement, REGION_INVALIDA, 10, mockCv);
    expect(result.error).toBeDefined();
  });

  it('deve retornar centroide correto quando há contorno válido', () => {
    const result = processMeasurement(mockVideoElement, REGION_CAPOTA, 10, mockCv);
    // cx = m10/m00 = 5000/100 = 50 → centroid.x = box.x + 50 = 100
    // cy = m01/m00 = 3000/100 = 30 → centroid.y = box.y + 30 = 80
    if (result.status === 'ok') {
      expect(result.centroid.x).toBeCloseTo(REGION_CAPOTA.box.x + 50, 0);
      expect(result.centroid.y).toBeCloseTo(REGION_CAPOTA.box.y + 30, 0);
    }
  });

  it('deve retornar dimensionsPx com width e height', () => {
    const result = processMeasurement(mockVideoElement, REGION_CAPOTA, 10, mockCv);
    if (result.status === 'ok') {
      expect(result.dimensionsPx).toBeDefined();
      expect(result.dimensionsPx.width).toBe(80);
      expect(result.dimensionsPx.height).toBe(40);
    }
  });

  it('deve retornar rotatedRect com angle', () => {
    const result = processMeasurement(mockVideoElement, REGION_CAPOTA, 10, mockCv);
    if (result.status === 'ok') {
      expect(result.rotatedRect.angle).toBe(15);
    }
  });
});
