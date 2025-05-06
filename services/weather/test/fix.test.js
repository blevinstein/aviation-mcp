import { parseXmlResponse } from '../../common/test/helpers.js';
import { createWeatherClient } from './helpers.js';

describe('Fix Info API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createWeatherClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get-fix-info')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('retrieves fix info for specific fixes', async () => {
    const result = await client.callTool({
      name: 'get-fix-info',
      arguments: {
        ids: 'BARBQ,ORD',
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
      
      // If fixes are found, verify their structure
      if (data.fixes && data.fixes.length > 0) {
        const fix = data.fixes[0];
        expect(fix).toHaveProperty('id');
        expect(fix).toHaveProperty('latitude');
        expect(fix).toHaveProperty('longitude');
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

  test('retrieves fixes within bounding box', async () => {
    const result = await client.callTool({
      name: 'get-fix-info',
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
      
      // If fixes are found, verify their structure
      if (data.fixes && data.fixes.length > 0) {
        const fix = data.fixes[0];
        expect(fix).toHaveProperty('id');
        expect(fix).toHaveProperty('latitude');
        expect(fix).toHaveProperty('longitude');
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

  test('handles invalid fix IDs', async () => {
    const result = await client.callTool({
      name: 'get-fix-info',
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