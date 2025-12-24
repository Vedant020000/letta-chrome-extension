import { getLettaService, LettaAPIService } from '../../src/services/letta-api';

describe('getLettaService', () => {
  it('returns same instance for same API key', () => {
    const service1 = getLettaService('test-key');
    const service2 = getLettaService('test-key');
    expect(service1).toBe(service2);
  });

  it('returns new instance for different API key', () => {
    const service1 = getLettaService('key-a');
    const service2 = getLettaService('key-b');
    expect(service1).not.toBe(service2);
  });
});

describe('LettaAPIService', () => {
  it('can be instantiated with API key', () => {
    const service = new LettaAPIService('test-key');
    expect(service).toBeInstanceOf(LettaAPIService);
  });
});
