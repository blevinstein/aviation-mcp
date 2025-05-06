import { parseXmlResponse } from '../../common/test/helpers.js';
import { createWeatherClient } from './helpers.js';

describe('Airport Info API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createWeatherClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get-airport-info')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('retrieves airport info for specific airports', async () => {
    const result = await client.callTool({
      name: 'get-airport-info',
      arguments: {
        ids: 'KJFK,KLAX',
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
      
      // If airports are found, verify their structure
      if (data.airports && data.airports.length > 0) {
        const airport = data.airports[0];
        expect(airport).toHaveProperty('id');
        expect(airport).toHaveProperty('name');
        expect(airport).toHaveProperty('latitude');
        expect(airport).toHaveProperty('longitude');
        expect(airport).toHaveProperty('elevation');
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

  test('retrieves airports within bounding box', async () => {
    const result = await client.callTool({
      name: 'get-airport-info',
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
      
      // If airports are found, verify their structure
      if (data.airports && data.airports.length > 0) {
        const airport = data.airports[0];
        expect(airport).toHaveProperty('id');
        expect(airport).toHaveProperty('name');
        expect(airport).toHaveProperty('latitude');
        expect(airport).toHaveProperty('longitude');
        expect(airport).toHaveProperty('elevation');
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

  test('handles invalid airport IDs', async () => {
    const result = await client.callTool({
      name: 'get-airport-info',
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