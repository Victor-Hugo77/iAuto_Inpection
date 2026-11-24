// src/fixtures/inspection.fixture.js
// Fixtures de registros de inspeção para testes de histórico e exportação

export const INSPECTION_APROVADA = {
  id: 'insp-001',
  barcode: 'CAP-POLO-2024-001',
  model_name: 'Polo Track',
  status: 'APROVADO',
  created_at: '2024-11-20T08:30:00.000Z',
  image_url: null,
  details: [
    { name: 'Capota Dianteira', status: 'ok', confidence: 0.95 },
    { name: 'Teto Central',      status: 'ok', confidence: 0.88 },
  ],
};

export const INSPECTION_REPROVADA = {
  id: 'insp-002',
  barcode: 'CAP-POLO-2024-002',
  model_name: 'Polo Track',
  status: 'REPROVADO',
  created_at: '2024-11-20T09:15:00.000Z',
  image_url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgAB', // base64 truncado (válido para teste)
  details: [
    { name: 'Capota Dianteira', status: 'ok',  confidence: 0.90 },
    { name: 'Teto Central',     status: 'bad', confidence: 0.30 },
  ],
};

export const INSPECTION_SEM_IMAGEM = {
  id: 'insp-003',
  barcode: 'CAP-T-CROSS-001',
  model_name: 'T-Cross',
  status: 'APROVADO',
  created_at: '2024-11-21T14:00:00.000Z',
  image_url: null,
  details: [],
};

/** Lista com múltiplas inspeções (para teste de paginação e exportação) */
export const INSPECTION_LIST = [
  INSPECTION_APROVADA,
  INSPECTION_REPROVADA,
  INSPECTION_SEM_IMAGEM,
];

/** Payload para inserção via supabase.from('inspections').insert */
export const NEW_INSPECTION_PAYLOAD = {
  barcode: 'CAP-TAOS-9999',
  model_name: 'Taos',
  status: 'APROVADO',
  image_url: null,
  details: [{ name: 'Capota Dianteira', status: 'ok', confidence: 0.98 }],
};
