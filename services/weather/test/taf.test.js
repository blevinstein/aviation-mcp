import { parseXmlResponse } from '../../common/test/helpers.js';
import { createWeatherClient } from './helpers.js';

describe('TAF API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createWeatherClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get-taf')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('should retrieve TAF data for a single station', async () => {
    const result = await client.callTool({
      name: 'get-taf',
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
    
    expect(response.data[0].TAF).toBeDefined();
    expect(response.data[0].TAF[0].station_id[0]).toBe('KJFK');
    expect(response.data[0].TAF[0].forecast).toBeDefined();
  });

  test('should retrieve TAF data for multiple stations', async () => {
    const result = await client.callTool({
      name: 'get-taf',
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
    
    expect(response.data[0].TAF).toBeDefined();
    const stations = response.data[0].TAF.map(taf => taf.station_id[0]);
    expect(stations).toContain('KJFK');
    expect(stations).toContain('KLAX');
  });

  test('should handle invalid station', async () => {
    const result = await client.callTool({
      name: 'get-taf',
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
    
    expect(response.data[0].$).toBeDefined();
    expect(response.data[0].$.num_results).toBe('0');
    expect(response.data[0].TAF).toBeUndefined();
  });

  test('should handle historical data request', async () => {
    const result = await client.callTool({
      name: 'get-taf',
      arguments: {
        ids: 'KJFK',
        format: 'xml',
        hours_before: 3
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const xml = result.content[0].text;
    const parsedResponse = await parseXmlResponse(xml);
    const response = parsedResponse.response;
    
    expect(response.data[0].TAF).toBeDefined();
    expect(response.data[0].TAF[0].station_id[0]).toBe('KJFK');
  });
}); 