import { LETTA_API_BASE_URL, DEFAULT_MODEL } from '../src/constants';

describe('constants', () => {
  it('has correct API base URL', () => {
    expect(LETTA_API_BASE_URL).toBe('https://api.letta.com');
  });

  it('has a default model', () => {
    expect(DEFAULT_MODEL).toBeDefined();
  });
});
