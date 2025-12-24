import { searchMemoryBlocks } from '../../src/utils/memory-search';
import type { MemoryBlock } from '../../src/types';

const mockBlocks: MemoryBlock[] = [
  { id: '1', label: 'user_context', value: 'John is a software engineer working on React projects' },
  { id: '2', label: 'active_topics', value: 'Currently building a Chrome extension' },
  { id: '3', label: 'facts', value: 'Prefers TypeScript over JavaScript' },
  { id: '4', label: 'conversation_patterns', value: 'Likes concise responses' },
];

describe('searchMemoryBlocks', () => {
  it('excludes conversation_patterns from results', () => {
    const results = searchMemoryBlocks(mockBlocks, '');
    expect(results.find(b => b.label === 'conversation_patterns')).toBeUndefined();
  });

  it('returns matching blocks for relevant query', () => {
    const results = searchMemoryBlocks(mockBlocks, 'React');
    expect(results.some(b => b.label === 'user_context')).toBe(true);
  });

  it('returns all searchable blocks when no query provided', () => {
    const results = searchMemoryBlocks(mockBlocks, '');
    expect(results.length).toBe(3);
  });

  it('returns all blocks as fallback when no matches found', () => {
    const results = searchMemoryBlocks(mockBlocks, 'xyznonexistent123');
    expect(results.length).toBe(3);
  });
});
