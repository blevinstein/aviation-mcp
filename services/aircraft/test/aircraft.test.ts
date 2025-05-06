import fetch from 'node-fetch';
import * as aircraftModule from '../src/index.js';

jest.mock('node-fetch', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('API Ninjas Aircraft Integration', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, API_NINJA_KEY: 'test-key' };
    mockedFetch.mockReset();
  });
  afterEach(() => {
    process.env = OLD_ENV;
    jest.clearAllMocks();
  });

  it('should return aircraft data for valid parameters', async () => {
    const mockResponse = { manufacturer: 'Gulfstream', model: 'G550' };
    mockedFetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify([mockResponse]),
    } as any);
    const args = { manufacturer: 'Gulfstream', model: 'G550' };
    const result = await (aircraftModule as any).handleSearchAircraft(args);
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Gulfstream');
  });

  it('should throw error if no search parameters are provided', async () => {
    await expect((aircraftModule as any).handleSearchAircraft({})).rejects.toThrow('At least one search parameter');
  });

  it('should throw error if API key is missing', async () => {
    process.env.API_NINJA_KEY = '';
    await expect((aircraftModule as any).handleSearchAircraft({ manufacturer: 'Cessna' })).rejects.toThrow('API_NINJA_KEY is required');
  });

  it('should throw error on non-200 response', async () => {
    mockedFetch.mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'Forbidden',
    } as any);
    await expect((aircraftModule as any).handleSearchAircraft({ manufacturer: 'Cessna' })).rejects.toThrow('Aircraft API Error (403): Forbidden');
  });
}); 