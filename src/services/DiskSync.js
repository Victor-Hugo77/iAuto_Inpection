// src/services/DiskSync.js
// Serviço de sincronização persistente em disco (Sobrevive a desligamento e reinício do PC)
// Salva os dados em data/backup.json via servidor local e sincroniza com IndexedDB e LocalStorage

import { getAllImages, bulkInsertImages } from '../db';

let debounceTimeout = null;

/**
 * Salva todo o estado (modelos, caixas, imagens de treino e calibração) no disco rígido do PC
 */
export const saveBackupToDisk = async () => {
    if (typeof window === 'undefined') return;

    if (debounceTimeout) clearTimeout(debounceTimeout);

    return new Promise((resolve) => {
        debounceTimeout = setTimeout(async () => {
            try {
                // 1. Coletar dados do LocalStorage
                const activeModel = localStorage.getItem('smartinspector_active_model') || null;
                const supabaseStore = localStorage.getItem('supabase_mock_store') || null;
                const scaleFactor = localStorage.getItem('smart_inspector_scale_factor') || null;

                // Coletar todas as configurações de modelos salvas (modelData:*)
                const modelConfigs = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('modelData:')) {
                        modelConfigs[key] = localStorage.getItem(key);
                    }
                }

                // 2. Coletar todas as imagens de treino do IndexedDB
                const images = await getAllImages();

                const backupPayload = {
                    version: 1,
                    timestamp: Date.now(),
                    activeModel,
                    supabaseStore,
                    scaleFactor,
                    modelConfigs,
                    images
                };

                // 3. Enviar para gravação física no disco via servidor local
                const response = await fetch('/api/storage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(backupPayload)
                });

                if (response.ok) {
                    console.log(`[DiskSync] Backup gravado no disco físico com sucesso (${images.length} fotos salvas).`);
                }
                resolve(true);
            } catch (err) {
                // Se a API local não estiver acessível, os dados continuam seguros no IndexedDB e LocalStorage
                console.warn('[DiskSync] Servidor de disco indisponível no momento:', err.message);
                resolve(false);
            }
        }, 600);
    });
};

/**
 * Carrega os dados salvos em disco rígido após reinicialização do PC e restaura LocalStorage + IndexedDB
 */
export const restoreBackupFromDisk = async () => {
    if (typeof window === 'undefined') return null;

    try {
        const response = await fetch('/api/storage');
        if (!response.ok) return null;

        const data = await response.json();
        if (!data || !data.version) return null;

        console.log(`[DiskSync] Restaurando dados do disco rígido gravados em ${new Date(data.timestamp).toLocaleString()}`);

        // 1. Restaurar LocalStorage se necessário
        if (data.supabaseStore && (!localStorage.getItem('supabase_mock_store') || localStorage.getItem('supabase_mock_store') === '{"models":[],"inspections":[],"training_samples":[]}')) {
            localStorage.setItem('supabase_mock_store', data.supabaseStore);
        }

        if (data.scaleFactor && !localStorage.getItem('smart_inspector_scale_factor')) {
            localStorage.setItem('smart_inspector_scale_factor', data.scaleFactor);
        }

        if (data.activeModel && !localStorage.getItem('smartinspector_active_model')) {
            localStorage.setItem('smartinspector_active_model', data.activeModel);
        }

        if (data.modelConfigs) {
            Object.keys(data.modelConfigs).forEach(key => {
                if (!localStorage.getItem(key)) {
                    localStorage.setItem(key, data.modelConfigs[key]);
                }
            });
        }

        // 2. Restaurar Imagens de Treino no IndexedDB se estiver vazio
        if (Array.isArray(data.images) && data.images.length > 0) {
            const currentImages = await getAllImages();
            if (!currentImages || currentImages.length === 0) {
                console.log(`[DiskSync] Restaurando ${data.images.length} imagens no IndexedDB a partir do disco...`);
                await bulkInsertImages(data.images);
            }
        }

        return data;
    } catch (err) {
        console.warn('[DiskSync] Não foi possível ler backup do disco:', err.message);
        return null;
    }
};

/**
 * Exporta manualmente o modelo ativo em arquivo JSON para download (backup manual do usuário)
 */
export const exportModelToFile = async (modelName) => {
    try {
        const rawConfig = localStorage.getItem(`modelData:${modelName}`);
        const config = rawConfig ? JSON.parse(rawConfig) : null;
        const allImages = await getAllImages();
        const modelImages = allImages.filter(img => img.model === modelName);

        const exportData = {
            modelName,
            exportDate: new Date().toISOString(),
            config,
            images: modelImages
        };

        const jsonStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `iauto_modelo_${modelName.toLowerCase().replace(/\s+/g, '_')}_backup.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
    } catch (e) {
        console.error('Erro ao exportar arquivo:', e);
        return false;
    }
};

/**
 * Importa um modelo a partir de um arquivo JSON selecionado pelo usuário
 */
export const importModelFromFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.modelName) {
                    throw new Error('Arquivo de modelo inválido.');
                }

                if (data.config) {
                    localStorage.setItem(`modelData:${data.modelName}`, JSON.stringify(data.config));
                }

                if (Array.isArray(data.images) && data.images.length > 0) {
                    await bulkInsertImages(data.images);
                }

                localStorage.setItem('smartinspector_active_model', data.modelName);

                // Salva imediatamente no disco físico
                await saveBackupToDisk();

                resolve(data);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
        reader.readAsText(file);
    });
};
