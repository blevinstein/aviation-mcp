import { createClient } from '../../common/test/helpers.js';

describe.skip('Precipitation API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get_precipitation')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('should require points array', async () => {
    const result = await client.callTool({
      name: 'get_precipitation',
      arguments: {
        // Missing points array
      }
    });
    
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toContain('At least one point must be provided');
  });

  test('should validate point format', async () => {
    const result = await client.callTool({
      name: 'get_precipitation',
      arguments: {
        points: [
          {
            // Missing lat
            lon: -74.57,
            timeStr: '20230101T120000'
          }
        ],
        clientId: 'test-id',
        clientSecret: 'test-secret'
      }
    });
    
    expect(result.isError).toBeTruthy();
  });
  
  test('should retrieve precipitation data with valid credentials', async () => {
    const result = await client.callTool({
      name: 'get_precipitation',
      arguments: {
        points: [
          {
            lat: 39.45,
            lon: -74.57,
            timeStr: '20230101T120000'
          }
        ],
        includeDescription: true
      }
    });

    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const data = JSON.parse(result.content[0].text);
    expect(data.intensities).toBeDefined();
    expect(Array.isArray(data.intensities)).toBe(true);
    
    // If includeDescription is true, each item should have a code and description
    if (data.intensities.length > 0) {
      expect(data.intensities[0].code).toBeDefined();
      expect(data.intensities[0].description).toBeDefined();
    }
  });
});