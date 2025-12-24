import { formatMemoriesForInjection } from '../../src/utils/memory-injection';
import { MEMORY_HEADER, MEMORY_FOOTER } from '../../src/constants';
import type { MemoryBlock } from '../../src/types';

describe('formatMemoriesForInjection', () => {
  it('returns empty string for empty array', () => {
    expect(formatMemoriesForInjection([])).toBe('');
  });

  it('wraps memories with header and footer', () => {
    const blocks: MemoryBlock[] = [
      { id: '1', label: 'user_context', value: 'Test value' }
    ];
    const result = formatMemoriesForInjection(blocks);
    expect(result).toContain(MEMORY_HEADER);
    expect(result).toContain(MEMORY_FOOTER);
  });

  it('formats block with label in brackets', () => {
    const blocks: MemoryBlock[] = [
      { id: '1', label: 'facts', value: 'User likes coffee' }
    ];
    const result = formatMemoriesForInjection(blocks);
    expect(result).toContain('[facts]');
    expect(result).toContain('User likes coffee');
  });

  it('skips blocks with empty values', () => {
    const blocks: MemoryBlock[] = [
      { id: '1', label: 'empty_block', value: '   ' },
      { id: '2', label: 'valid_block', value: 'Has content' }
    ];
    const result = formatMemoriesForInjection(blocks);
    expect(result).not.toContain('[empty_block]');
  });
});
