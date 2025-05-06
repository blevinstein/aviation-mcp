import { createAircraftClient } from './helpers.js';

describe('API Ninjas Aircraft API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    const connection = await createAircraftClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'search_aircraft')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('should search for a real aircraft (Cessna)', async () => {
    const result = await client.callTool({
      name: 'search_aircraft',
      arguments: { manufacturer: 'Cessna', limit: 2 }
    });
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    const data = JSON.parse(result.content[0].text);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].manufacturer).toMatch(/Cessna/i);
  });

  test('should return error for missing search parameters', async () => {
    const result = await client.callTool({
      name: 'search_aircraft',
      arguments: {}
    });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toMatch(/At least one search parameter/);
  });

  test('should respect the limit parameter', async () => {
    const result = await client.callTool({
      name: 'search_aircraft',
      arguments: { manufacturer: 'Cessna', limit: 1 }
    });
    expect(result.isError).toBeFalsy();
    const data = JSON.parse(result.content[0].text);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
  });
}); 