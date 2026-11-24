// src/fixtures/calibration.fixture.js
// Dados de calibração metrológica para testes

/**
 * Par de pontos com 100px de distância horizontal
 * Distância real conhecida: 10 mm
 * scaleFactor esperado: 10 px/mm
 */
export const CALIBRATION_HORIZONTAL_10MM = {
  points: [
    { x: 100, y: 200 },
    { x: 200, y: 200 },
  ],
  realDistanceMm: 10,
  expectedScaleFactor: 10, // 100px / 10mm
};

/**
 * Par de pontos em diagonal
 * dx=30, dy=40 → pixelDist = 50
 * Distância real: 25 mm
 * scaleFactor esperado: 2 px/mm
 */
export const CALIBRATION_DIAGONAL_25MM = {
  points: [
    { x: 0, y: 0 },
    { x: 30, y: 40 },
  ],
  realDistanceMm: 25,
  expectedScaleFactor: 2, // 50px / 25mm
};

/**
 * Fator de escala salvo no localStorage (simula sessão anterior)
 */
export const SAVED_SCALE_FACTOR = 8.5;
