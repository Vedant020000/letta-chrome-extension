import { getSettings, saveSettings, resetSettings } from '../../src/utils/storage';
import { resetMockStorage, setMockSyncStorage } from '../__mocks__/chrome';
import { DEFAULT_SETTINGS } from '../../src/types';

beforeEach(() => {
  resetMockStorage();
});

describe('getSettings', () => {
  it('returns default settings when storage is empty', async () => {
    const settings = await getSettings();
    expect(settings.apiKey).toBe('');
  });

  it('merges stored settings with defaults', async () => {
    setMockSyncStorage({ letta_settings: { apiKey: 'test-key' } });
    const settings = await getSettings();
    expect(settings.apiKey).toBe('test-key');
  });
});

describe('saveSettings', () => {
  it('updates specific settings while preserving others', async () => {
    const updated = await saveSettings({ apiKey: 'new-key' });
    expect(updated.apiKey).toBe('new-key');
    expect(updated.baseUrl).toBe(DEFAULT_SETTINGS.baseUrl);
  });
});

describe('resetSettings', () => {
  it('restores all settings to defaults', async () => {
    await saveSettings({ apiKey: 'custom-key', debug: true });
    const reset = await resetSettings();
    expect(reset).toEqual(DEFAULT_SETTINGS);
  });
});
