import { createClient } from '../../common/test/helpers.js';

describe('Feature API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get_feature')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('retrieves features within bounding box', async () => {
    const result = await client.callTool({
      name: 'get_feature',
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
      
      // If features are found, verify their structure
      if (data.length > 0) {
        const feature = data[0];
        expect(feature).toHaveProperty('ind');
        expect(feature).toHaveProperty('name');
        expect(feature).toHaveProperty('type');
        expect(feature).toHaveProperty('lat');
        expect(feature).toHaveProperty('lon');
        expect(feature).toHaveProperty('elev');
        expect(feature).toHaveProperty('prior');
      }
    } catch (error) {
      fail('Response was not valid JSON: ' + error.message);
    }
  });

  test('handles invalid bounding box gracefully', async () => {
    const result = await client.callTool({
      name: 'get_feature',
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
        name: 'get_feature',
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
}); 