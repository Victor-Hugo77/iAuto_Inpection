// src/fixtures/region.fixture.js
// Fixtures de Regiões de Interesse (ROI) para testes de componentes automotivos

export const REGION_CAPOTA = {
  id: '1',
  name: 'Capota Dianteira',
  box: { x: 50, y: 50, w: 200, h: 150 },
  samples: 5,
  status: 'ok',
  confidence: 0.92,
};

export const REGION_TETO = {
  id: '2',
  name: 'Teto Central',
  box: { x: 300, y: 100, w: 180, h: 120 },
  samples: 5,
  status: 'bad',
  confidence: 0.45,
};

export const REGION_CAPOTA_SEM_AMOSTRAS = {
  id: '3',
  name: 'Capota Traseira',
  box: { x: 100, y: 300, w: 150, h: 100 },
  samples: 0,
  status: null,
  confidence: 0,
};

export const REGION_INVALIDA = {
  id: 'inv',
  name: 'ROI Inválida',
  box: { x: 0, y: 0, w: 0, h: 0 }, // dimensão zero — deve retornar erro
  samples: 0,
  status: null,
  confidence: 0,
};

/** Lista com todas as regiões aprovadas (usado em saveToHistory) */
export const ALL_REGIONS_OK = [
  { ...REGION_CAPOTA, status: 'ok', confidence: 0.95 },
  { ...REGION_TETO, status: 'ok', confidence: 0.88 },
];

/** Lista com pelo menos uma região reprovada */
export const REGIONS_WITH_FAIL = [
  { ...REGION_CAPOTA, status: 'ok', confidence: 0.90 },
  { ...REGION_TETO, status: 'bad', confidence: 0.30 },
];
