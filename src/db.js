// src/db.js
// Armazenamento persistente em IndexedDB para imagens de treinamento
// Mantém os dados entre recarregamentos de página (F5) e sessões do navegador

const DB_NAME = 'iAuto_Inspection_DB';
const DB_VERSION = 1;
const STORE_NAME = 'training_images';

let dbInstance = null;

// Fallback em memória caso o ambiente não suporte IndexedDB (ex.: SSR ou testes)
let inMemoryFallback = [];

const isIndexedDBSupported = () => {
    return typeof window !== 'undefined' && 'indexedDB' in window;
};

/**
 * Inicializa e abre a conexão com o banco de dados IndexedDB
 */
export const openDB = () => {
    if (!isIndexedDBSupported()) {
        return Promise.resolve(null);
    }

    if (dbInstance) {
        return Promise.resolve(dbInstance);
    }

    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('model', 'model', { unique: false });
                store.createIndex('label', 'label', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;

            dbInstance.onclose = () => {
                dbInstance = null;
            };

            resolve(dbInstance);
        };

        request.onerror = (event) => {
            console.error('Erro ao abrir IndexedDB:', event.target.error);
            reject(event.target.error);
        };
    });
};

/**
 * Salva uma nova imagem capturada para o modelo e rótulo especificados
 */
export const saveImage = async (model, label, url) => {
    const newImage = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        model,
        label,
        url,
        timestamp: Date.now()
    };

    if (!isIndexedDBSupported()) {
        inMemoryFallback.push(newImage);
        return Promise.resolve(newImage.id);
    }

    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.add(newImage);

            request.onsuccess = () => resolve(newImage.id);
            request.onerror = (e) => {
                console.error('Erro ao salvar imagem no IndexedDB:', e.target.error);
                reject(e.target.error);
            };
        });
    } catch (err) {
        inMemoryFallback.push(newImage);
        return Promise.resolve(newImage.id);
    }
};

/**
 * Retorna todas as imagens gravadas para um modelo específico
 */
export const getImagesByModel = async (modelName) => {
    if (!isIndexedDBSupported()) {
        return Promise.resolve(inMemoryFallback.filter(img => img.model === modelName));
    }

    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('model');
            const request = index.getAll(IDBKeyRange.only(modelName));

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = (e) => {
                console.error('Erro ao buscar imagens por modelo:', e.target.error);
                reject(e.target.error);
            };
        });
    } catch (err) {
        return Promise.resolve(inMemoryFallback.filter(img => img.model === modelName));
    }
};

/**
 * Retorna todas as imagens de todos os modelos
 */
export const getAllImages = async () => {
    if (!isIndexedDBSupported()) {
        return Promise.resolve([...inMemoryFallback]);
    }

    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        return Promise.resolve([...inMemoryFallback]);
    }
};

/**
 * Remove todas as imagens pertencentes a um modelo (exclusão de modelo)
 */
export const deleteImagesByModel = async (modelName) => {
    if (!isIndexedDBSupported()) {
        inMemoryFallback = inMemoryFallback.filter(img => img.model !== modelName);
        return Promise.resolve();
    }

    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('model');
            const request = index.openCursor(IDBKeyRange.only(modelName));

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };

            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        inMemoryFallback = inMemoryFallback.filter(img => img.model !== modelName);
        return Promise.resolve();
    }
};

/**
 * Limpa todo o repositório de imagens
 */
export const clearAllImages = async () => {
    if (!isIndexedDBSupported()) {
        inMemoryFallback = [];
        return Promise.resolve();
    }

    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        inMemoryFallback = [];
        return Promise.resolve();
    }
};

/**
 * Atualiza o nome do modelo e seus respectivos rótulos (renomeação de modelo)
 */
export const updateModelName = async (oldName, newName) => {
    if (!isIndexedDBSupported()) {
        inMemoryFallback = inMemoryFallback.map(img => {
            if (img.model === oldName) {
                const updated = { ...img, model: newName };
                if (updated.label && updated.label.includes(oldName)) {
                    updated.label = updated.label.replace(oldName, newName);
                }
                return updated;
            }
            return img;
        });
        return Promise.resolve();
    }

    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('model');
            const request = index.openCursor(IDBKeyRange.only(oldName));

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const updateData = cursor.value;
                    updateData.model = newName;
                    if (updateData.label && updateData.label.includes(oldName)) {
                        updateData.label = updateData.label.replace(oldName, newName);
                    }
                    cursor.update(updateData);
                    cursor.continue();
                } else {
                    resolve();
                }
            };

            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        return Promise.resolve();
    }
};

/**
 * Insere múltiplas imagens de uma única vez
 */
export const bulkInsertImages = async (images) => {
    const imagesWithTimestamp = images.map(img => ({
        ...img,
        id: img.id || `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: img.timestamp || Date.now()
    }));

    if (!isIndexedDBSupported()) {
        inMemoryFallback.push(...imagesWithTimestamp);
        return Promise.resolve();
    }

    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            imagesWithTimestamp.forEach(img => {
                store.put(img);
            });

            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        inMemoryFallback.push(...imagesWithTimestamp);
        return Promise.resolve();
    }
};

/**
 * Remove todas as imagens de um rótulo específico (exclusão de uma região específica)
 */
export const deleteImagesByLabel = async (label) => {
    if (!isIndexedDBSupported()) {
        inMemoryFallback = inMemoryFallback.filter(img => img.label !== label);
        return Promise.resolve();
    }

    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('label');
            const request = index.openCursor(IDBKeyRange.only(label));

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };

            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        inMemoryFallback = inMemoryFallback.filter(img => img.label !== label);
        return Promise.resolve();
    }
};
