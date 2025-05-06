import { parseXmlResponse } from '../../common/test/helpers.js';
import { createWeatherClient } from './helpers.js';

describe('METAR API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createWeatherClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get_metar')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('should return METAR data for a single station', async () => {
    const result = await client.callTool({
      name: 'get_metar',
      arguments: {
        ids: 'KJFK',
        format: 'xml'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const xml = result.content[0].text;
    const parsedResponse = await parseXmlResponse(xml);
    const response = parsedResponse.response;
    
    // Check that we got data
    expect(response.data).toBeDefined();
    expect(response.data[0].METAR).toBeDefined();
    
    // Check station identifier
    const metar = response.data[0].METAR[0];
    expect(metar.station_id[0]).toBe('KJFK');
  });

  test('should return METAR data for multiple stations', async () => {
    const result = await client.callTool({
      name: 'get_metar',
      arguments: {
        ids: 'KJFK,KLAX',
        format: 'xml'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const xml = result.content[0].text;
    const parsedResponse = await parseXmlResponse(xml);
    const response = parsedResponse.response;
    
    // Check that we got data for both stations
    expect(response.data).toBeDefined();
    expect(response.data[0].METAR.length).toBe(2);
    
    // Check station identifiers
    const stations = response.data[0].METAR.map(m => m.station_id[0]);
    expect(stations).toContain('KJFK');
    expect(stations).toContain('KLAX');
  });

  test('should handle invalid station', async () => {
    const result = await client.callTool({
      name: 'get_metar',
      arguments: {
        ids: 'INVALID',
        format: 'xml'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const xml = result.content[0].text;
    const parsedResponse = await parseXmlResponse(xml);
    const response = parsedResponse.response;
    
    // Should return empty data array
    expect(response.data[0].$).toBeDefined();
    expect(response.data[0].$.num_results).toBe('0');
    expect(response.data[0].METAR).toBeUndefined();
  });

  test('should handle historical data request', async () => {
    const result = await client.callTool({
      name: 'get_metar',
      arguments: {
        ids: 'KJFK',
        hours: 3,
        mostRecent: false,
        format: 'xml'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const xml = result.content[0].text;
    const parsedResponse = await parseXmlResponse(xml);
    const response = parsedResponse.response;
    
    // Should return multiple observations
    expect(response.data[0].METAR.length).toBeGreaterThan(1);
    
    // All observations should be for the requested station
    const stations = response.data[0].METAR.map(m => m.station_id[0]);
    expect(stations.every(id => id === 'KJFK')).toBe(true);
  });
}); 