import { createClient, parseXmlResponse } from '../../common/test/helpers.js';

describe('Terminal Procedures Publication API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get_tpp')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('should return a JSON object with links for the US region', async () => {
    const result = await client.callTool({
      name: 'get_tpp',
      arguments: {
        geoname: 'US'
      }
    });
    console.warn(JSON.stringify(result));
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('editionDate');
    expect(data).toHaveProperty('regions');
    expect(Array.isArray(data.regions)).toBe(true);
    for (const region of data.regions) {
      expect(region).toHaveProperty('region');
      expect(region).toHaveProperty('url');
    }
  });

  test('should handle a valid request for the next edition', async () => {
    const result = await client.callTool({
      name: 'get_tpp',
      arguments: {
        geoname: 'US',
        edition: 'next'
      }
    });
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('editionDate');
    expect(data).toHaveProperty('regions');
    expect(Array.isArray(data.regions)).toBe(true);
    expect(data.regions.length).toBeGreaterThan(0);
  });

  test('should return an error for an invalid edition', async () => {
    const result = await client.callTool({
      name: 'get_tpp',
      arguments: {
        geoname: 'US',
        edition: 'invalid_edition'
      }
    });
    expect(result.isError).toBeTruthy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toMatch(/Invalid value for edition/);
  });

  test('should handle a request for a specific state (Virginia)', async () => {
    const result = await client.callTool({
      name: 'get_tpp',
      arguments: {
        geoname: 'VA'
      }
    });
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('regions');
    expect(Array.isArray(data.regions)).toBe(true);
    expect(data.regions).toEqual(expect.arrayContaining([expect.objectContaining({ region: 'NE3' })]));
  }, 15_000);
}); 