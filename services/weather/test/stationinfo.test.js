import { parseXmlResponse } from '../../common/test/helpers.js';
import { createClient } from '../../common/test/helpers.js';

describe('Station Info API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get_station_info')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('retrieves station info for specific stations', async () => {
    const result = await client.callTool({
      name: 'get_station_info',
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
      
      // If stations are found, verify their structure
      if (data.stations && data.stations.length > 0) {
        const station = data.stations[0];
        expect(station).toHaveProperty('id');
        expect(station).toHaveProperty('latitude');
        expect(station).toHaveProperty('longitude');
        expect(station).toHaveProperty('elevation');
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

  test('retrieves stations within bounding box', async () => {
    const result = await client.callTool({
      name: 'get_station_info',
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
      
      // If stations are found, verify their structure
      if (data.stations && data.stations.length > 0) {
        const station = data.stations[0];
        expect(station).toHaveProperty('id');
        expect(station).toHaveProperty('latitude');
        expect(station).toHaveProperty('longitude');
        expect(station).toHaveProperty('elevation');
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

  test('handles invalid station IDs', async () => {
    const result = await client.callTool({
      name: 'get_station_info',
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