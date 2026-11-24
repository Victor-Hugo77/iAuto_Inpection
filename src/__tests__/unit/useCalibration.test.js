// src/__tests__/unit/useCalibration.test.js
// Testes unitários do hook de calibração metrológica

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useCalibration } from '../../useCalibration';
import {
  CALIBRATION_HORIZONTAL_10MM,
  CALIBRATION_DIAGONAL_25MM,
  SAVED_SCALE_FACTOR,
} from '../../fixtures/calibration.fixture';

describe('useCalibration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // -------------------------------------------------
  // Estado inicial
  // -------------------------------------------------
  describe('estado inicial', () => {
    it('deve iniciar com calibrationPoints vazio', () => {
      const { result } = renderHook(() => useCalibration());
      expect(result.current.calibrationPoints).toHaveLength(0);
    });

    it('deve iniciar scaleFactor como null se localStorage estiver vazio', () => {
      const { result } = renderHook(() => useCalibration());
      expect(result.current.scaleFactor).toBeNull();
    });

    it('deve restaurar scaleFactor do localStorage ao montar', () => {
      localStorage.setItem('smart_inspector_scale_factor', String(SAVED_SCALE_FACTOR));
      const { result } = renderHook(() => useCalibration());
      expect(result.current.scaleFactor).toBeCloseTo(SAVED_SCALE_FACTOR, 4);
    });
  });

  // -------------------------------------------------
  // addCalibrationPoint
  // -------------------------------------------------
  describe('addCalibrationPoint', () => {
    it('deve adicionar o primeiro ponto corretamente', () => {
      const { result } = renderHook(() => useCalibration());
      const [p1] = CALIBRATION_HORIZONTAL_10MM.points;

      act(() => result.current.addCalibrationPoint(p1.x, p1.y));

      expect(result.current.calibrationPoints).toHaveLength(1);
      expect(result.current.calibrationPoints[0]).toEqual(p1);
    });

    it('deve adicionar segundo ponto sem resetar', () => {
      const { result } = renderHook(() => useCalibration());
      const [p1, p2] = CALIBRATION_HORIZONTAL_10MM.points;

      act(() => result.current.addCalibrationPoint(p1.x, p1.y));
      act(() => result.current.addCalibrationPoint(p2.x, p2.y));

      expect(result.current.calibrationPoints).toHaveLength(2);
    });

    it('deve reiniciar com apenas 1 ponto ao clicar um terceiro', () => {
      const { result } = renderHook(() => useCalibration());
      const [p1, p2] = CALIBRATION_HORIZONTAL_10MM.points;
      const p3 = { x: 500, y: 500 };

      act(() => result.current.addCalibrationPoint(p1.x, p1.y));
      act(() => result.current.addCalibrationPoint(p2.x, p2.y));
      act(() => result.current.addCalibrationPoint(p3.x, p3.y));

      expect(result.current.calibrationPoints).toHaveLength(1);
      expect(result.current.calibrationPoints[0]).toEqual(p3);
    });
  });

  // -------------------------------------------------
  // getPixelDistance
  // -------------------------------------------------
  describe('getPixelDistance', () => {
    it('deve retornar 0 se menos de 2 pontos', () => {
      const { result } = renderHook(() => useCalibration());
      expect(result.current.getPixelDistance()).toBe(0);
    });

    it('deve calcular distância horizontal corretamente (100px)', () => {
      const { result } = renderHook(() => useCalibration());
      const [p1, p2] = CALIBRATION_HORIZONTAL_10MM.points;

      act(() => result.current.addCalibrationPoint(p1.x, p1.y));
      act(() => result.current.addCalibrationPoint(p2.x, p2.y));

      expect(result.current.getPixelDistance()).toBeCloseTo(100, 1);
    });

    it('deve calcular distância diagonal (triângulo 3-4-5: dx=30, dy=40 → 50px)', () => {
      const { result } = renderHook(() => useCalibration());
      const [p1, p2] = CALIBRATION_DIAGONAL_25MM.points;

      act(() => result.current.addCalibrationPoint(p1.x, p1.y));
      act(() => result.current.addCalibrationPoint(p2.x, p2.y));

      expect(result.current.getPixelDistance()).toBeCloseTo(50, 1);
    });
  });

  // -------------------------------------------------
  // computeScaleFactor
  // -------------------------------------------------
  describe('computeScaleFactor', () => {
    it('deve retornar null se menos de 2 pontos', () => {
      const { result } = renderHook(() => useCalibration());
      let factor;
      act(() => { factor = result.current.computeScaleFactor(); });
      expect(factor).toBeNull();
    });

    it('deve retornar null se distância real inválida (zero)', () => {
      const { result } = renderHook(() => useCalibration());
      const [p1, p2] = CALIBRATION_HORIZONTAL_10MM.points;

      act(() => result.current.addCalibrationPoint(p1.x, p1.y));
      act(() => result.current.addCalibrationPoint(p2.x, p2.y));
      act(() => result.current.setRealDistanceInput('0'));

      let factor;
      act(() => { factor = result.current.computeScaleFactor(); });

      expect(factor).toBeNull();
    });

    it('deve retornar null para entrada não numérica', () => {
      const { result } = renderHook(() => useCalibration());
      const [p1, p2] = CALIBRATION_HORIZONTAL_10MM.points;

      act(() => result.current.addCalibrationPoint(p1.x, p1.y));
      act(() => result.current.addCalibrationPoint(p2.x, p2.y));
      act(() => result.current.setRealDistanceInput('abc'));

      let factor;
      act(() => { factor = result.current.computeScaleFactor(); });

      expect(factor).toBeNull();
    });

    it('deve calcular scaleFactor horizontal: 100px / 10mm = 10', () => {
      const { result } = renderHook(() => useCalibration());
      const { points, realDistanceMm, expectedScaleFactor } = CALIBRATION_HORIZONTAL_10MM;

      act(() => result.current.addCalibrationPoint(points[0].x, points[0].y));
      act(() => result.current.addCalibrationPoint(points[1].x, points[1].y));
      act(() => result.current.setRealDistanceInput(String(realDistanceMm)));

      let factor;
      act(() => { factor = result.current.computeScaleFactor(); });

      expect(factor).toBeCloseTo(expectedScaleFactor, 2);
      expect(result.current.scaleFactor).toBeCloseTo(expectedScaleFactor, 2);
    });

    it('deve calcular scaleFactor diagonal: 50px / 25mm = 2', () => {
      const { result } = renderHook(() => useCalibration());
      const { points, realDistanceMm, expectedScaleFactor } = CALIBRATION_DIAGONAL_25MM;

      act(() => result.current.addCalibrationPoint(points[0].x, points[0].y));
      act(() => result.current.addCalibrationPoint(points[1].x, points[1].y));
      act(() => result.current.setRealDistanceInput(String(realDistanceMm)));

      let factor;
      act(() => { factor = result.current.computeScaleFactor(); });

      expect(factor).toBeCloseTo(expectedScaleFactor, 2);
    });

    it('deve persistir scaleFactor no localStorage', () => {
      const { result } = renderHook(() => useCalibration());
      const { points, realDistanceMm } = CALIBRATION_HORIZONTAL_10MM;

      act(() => result.current.addCalibrationPoint(points[0].x, points[0].y));
      act(() => result.current.addCalibrationPoint(points[1].x, points[1].y));
      act(() => result.current.setRealDistanceInput(String(realDistanceMm)));
      act(() => result.current.computeScaleFactor());

      const saved = parseFloat(localStorage.getItem('smart_inspector_scale_factor'));
      expect(saved).toBeCloseTo(CALIBRATION_HORIZONTAL_10MM.expectedScaleFactor, 2);
    });
  });

  // -------------------------------------------------
  // resetCalibration
  // -------------------------------------------------
  describe('resetCalibration', () => {
    it('deve limpar pontos e input após reset', () => {
      const { result } = renderHook(() => useCalibration());
      const [p1, p2] = CALIBRATION_HORIZONTAL_10MM.points;

      act(() => result.current.addCalibrationPoint(p1.x, p1.y));
      act(() => result.current.addCalibrationPoint(p2.x, p2.y));
      act(() => result.current.setRealDistanceInput('10'));
      act(() => result.current.resetCalibration());

      expect(result.current.calibrationPoints).toHaveLength(0);
      expect(result.current.realDistanceInput).toBe('');
    });

    it('deve preservar scaleFactor após reset (apenas limpa o wizard)', () => {
      const { result } = renderHook(() => useCalibration());
      const { points, realDistanceMm } = CALIBRATION_HORIZONTAL_10MM;

      act(() => result.current.addCalibrationPoint(points[0].x, points[0].y));
      act(() => result.current.addCalibrationPoint(points[1].x, points[1].y));
      act(() => result.current.setRealDistanceInput(String(realDistanceMm)));
      act(() => result.current.computeScaleFactor());
      act(() => result.current.resetCalibration());

      expect(result.current.scaleFactor).toBeCloseTo(CALIBRATION_HORIZONTAL_10MM.expectedScaleFactor, 2);
    });
  });
});
