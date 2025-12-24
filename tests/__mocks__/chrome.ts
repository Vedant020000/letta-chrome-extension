/**
 * Chrome API mocks for testing
 */

// In-memory storage
let syncStorage: Record<string, unknown> = {};
let localStorage: Record<string, unknown> = {};

export const chrome = {
  storage: {
    sync: {
      get: jest.fn((keys: string[], callback: (result: Record<string, unknown>) => void) => {
        const result: Record<string, unknown> = {};
        keys.forEach(key => {
          if (syncStorage[key] !== undefined) {
            result[key] = syncStorage[key];
          }
        });
        callback(result);
      }),
      set: jest.fn((items: Record<string, unknown>, callback?: () => void) => {
        Object.assign(syncStorage, items);
        callback?.();
      }),
      remove: jest.fn((keys: string[], callback?: () => void) => {
        keys.forEach(key => delete syncStorage[key]);
        callback?.();
      }),
    },
    local: {
      get: jest.fn((keys: string[], callback: (result: Record<string, unknown>) => void) => {
        const result: Record<string, unknown> = {};
        keys.forEach(key => {
          if (localStorage[key] !== undefined) {
            result[key] = localStorage[key];
          }
        });
        callback(result);
      }),
      set: jest.fn((items: Record<string, unknown>, callback?: () => void) => {
        Object.assign(localStorage, items);
        callback?.();
      }),
      remove: jest.fn((keys: string[], callback?: () => void) => {
        keys.forEach(key => delete localStorage[key]);
        callback?.();
      }),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
};

// Helper to reset storage between tests
export function resetMockStorage() {
  syncStorage = {};
  localStorage = {};
}

// Helper to set mock storage data
export function setMockSyncStorage(data: Record<string, unknown>) {
  syncStorage = { ...data };
}

export function setMockLocalStorage(data: Record<string, unknown>) {
  localStorage = { ...data };
}

// Set global chrome
(global as unknown as { chrome: typeof chrome }).chrome = chrome;
