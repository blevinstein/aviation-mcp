import { parseXmlResponse } from '../../common/test/helpers.js';
import { createWeatherClient } from './helpers.js';

describe('Navaid Info API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createWeatherClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get-navaid-info')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('retrieves navaid info for specific navaids', async () => {
    const result = await client.callTool({
      name: 'get-navaid-info',
      arguments: {
        ids: 'MCI,ORD',
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
      
      // If navaids are found, verify their structure
      if (data.navaids && data.navaids.length > 0) {
        const navaid = data.navaids[0];
        expect(navaid).toHaveProperty('id');
        expect(navaid).toHaveProperty('type');
        expect(navaid).toHaveProperty('latitude');
        expect(navaid).toHaveProperty('longitude');
        expect(navaid).toHaveProperty('elevation');
      }
    } catch (error) {
      // If the response isn't valid JSON, check if it's an XML response
      if (text.includes('<?xml')) {
        const response = await parseXmlResponse(text);
        expect(response).toBeDefined();
      } else {
        // Neither JSON nor XML - fail the test
        fail('Response was neither valid JSON nor XML');
      }
    }
  });

  test('retrieves navaids within bounding box', async () => {
    const result = await client.callTool({
      name: 'get-navaid-info',
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
      
      // If navaids are found, verify their structure
      if (data.navaids && data.navaids.length > 0) {
        const navaid = data.navaids[0];
        expect(navaid).toHaveProperty('id');
        expect(navaid).toHaveProperty('type');
        expect(navaid).toHaveProperty('latitude');
        expect(navaid).toHaveProperty('longitude');
        expect(navaid).toHaveProperty('elevation');
      }
    } catch (error) {
      // If the response isn't valid JSON, check if it's an XML response
      if (text.includes('<?xml')) {
        const response = await parseXmlResponse(text);
        expect(response).toBeDefined();
      } else {
        // Neither JSON nor XML - fail the test
        fail('Response was neither valid JSON nor XML');
      }
    }
  });

  test('handles invalid navaid IDs', async () => {
    const result = await client.callTool({
      name: 'get-navaid-info',
      arguments: {
        ids: 'INVALID',
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
      // API should handle invalid IDs gracefully
      expect(data).toBeDefined();
    } catch (error) {
      // If the response isn't valid JSON, check if it's an XML response
      if (text.includes('<?xml')) {
        const response = await parseXmlResponse(text);
        expect(response).toBeDefined();
      } else {
        // Neither JSON nor XML - fail the test
        fail('Response was neither valid JSON nor XML');
      }
    }
  });
}); 