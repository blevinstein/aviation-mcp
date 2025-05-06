import { createWeatherClient } from './helpers.js';

describe('Obstacle API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createWeatherClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get_obstacle')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('retrieves obstacles within bounding box', async () => {
    const result = await client.callTool({
      name: 'get_obstacle',
      arguments: {
        bbox: '40,-90,45,-85', // Chicago area
        format: 'json'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    // Parse the JSON response
    try {
      const data = JSON.parse(text);
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      
      // If obstacles are found, verify their structure
      if (data.length > 0) {
        const obstacle = data[0];
        expect(obstacle).toHaveProperty('ind');
        expect(obstacle).toHaveProperty('name');
        expect(obstacle).toHaveProperty('type');
        expect(obstacle).toHaveProperty('lat');
        expect(obstacle).toHaveProperty('lon');
        expect(obstacle).toHaveProperty('elev');
        expect(obstacle).toHaveProperty('height');
        expect(obstacle).toHaveProperty('prior');
      }
    } catch (error) {
      fail('Response was not valid JSON: ' + error.message);
    }
  });

  test('handles invalid bounding box gracefully', async () => {
    const result = await client.callTool({
      name: 'get_obstacle',
      arguments: {
        bbox: 'invalid',
        format: 'json'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    // API should return empty response for invalid bbox
    expect(text.trim()).toBe('[]');
  });

  test('returns different formats', async () => {
    const formats = ['json', 'geojson', 'raw'];

    for (const format of formats) {
      const result = await client.callTool({
        name: 'get_obstacle',
        arguments: {
          bbox: '40,-90,45,-85',
          format
        }
      });
      
      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      
      const text = result.content[0].text;
      
      if (format === 'json' || format === 'geojson') {
        try {
          const data = JSON.parse(text);
          expect(data).toBeDefined();
        } catch (error) {
          fail(`Response for format ${format} was not valid JSON: ${error.message}`);
        }
      } else {
        expect(text).toBeDefined();
      }
    }
  });

  test('verifies obstacle data types', async () => {
    const result = await client.callTool({
      name: 'get_obstacle',
      arguments: {
        bbox: '40,-90,45,-85',
        format: 'json'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    try {
      const data = JSON.parse(text);
      expect(data).toBeDefined();
      
      if (data.length > 0) {
        const obstacle = data[0];
        expect(typeof obstacle.ind).toBe('number');
        expect(typeof obstacle.name).toBe('string');
        expect(typeof obstacle.type).toBe('string');
        expect(typeof obstacle.lat).toBe('number');
        expect(typeof obstacle.lon).toBe('number');
        expect(typeof obstacle.elev).toBe('number');
        expect(typeof obstacle.height).toBe('number');
        expect(typeof obstacle.prior).toBe('number');
      }
    } catch (error) {
      fail('Response was not valid JSON: ' + error.message);
    }
  });
}); 