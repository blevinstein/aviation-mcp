import { parseXmlResponse } from '../../common/test/helpers.js';
import { createWeatherClient } from './helpers.js';

describe('Center Weather Advisory API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createWeatherClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get_cwa')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('should retrieve all CWAs', async () => {
    const result = await client.callTool({
      name: 'get_cwa',
      arguments: {
        format: 'xml'
      }
    });

    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    const response = await parseXmlResponse(text);
    
    // Handle both cases: active or no active CWAs
    if (response.response.data[0].$.num_results === '0') {
      expect(response.response.data[0].CWA).toBeUndefined();
    } else {
      expect(response.response.data[0].CWA).toBeDefined();
      expect(response.response.data[0].CWA[0].cwsu).toBeDefined();
      expect(response.response.data[0].CWA[0].hazard).toBeDefined();
    }
  });

  test('should filter CWAs by location', async () => {
    const result = await client.callTool({
      name: 'get_cwa',
      arguments: {
        loc: 'ZAB',
        format: 'xml'
      }
    });

    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    const response = await parseXmlResponse(text);
    
    // Handle both cases: active or no active CWAs for the location
    if (response.response.data[0].$.num_results === '0') {
      expect(response.response.data[0].CWA).toBeUndefined();
    } else {
      expect(response.response.data[0].CWA).toBeDefined();
      const cwas = response.response.data[0].CWA;
      cwas.forEach(cwa => {
        expect(cwa.cwsu[0]).toBe('ZAB');
      });
    }
  });

  test('should filter CWAs by hazard type', async () => {
    const result = await client.callTool({
      name: 'get_cwa',
      arguments: {
        hazard: 'ts',
        format: 'xml'
      }
    });

    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    const response = await parseXmlResponse(text);
    
    // Handle both cases: active or no active CWAs for the hazard type
    if (response.response.data[0].$.num_results === '0') {
      expect(response.response.data[0].CWA).toBeUndefined();
    } else {
      expect(response.response.data[0].CWA).toBeDefined();
      const cwas = response.response.data[0].CWA;
      cwas.forEach(cwa => {
        expect(cwa.hazard[0].$.type).toBe('TS');
      });
    }
  });

  test('should handle no results', async () => {
    const result = await client.callTool({
      name: 'get_cwa',
      arguments: {
        loc: 'INVALID',
        format: 'xml'
      }
    });

    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    const response = await parseXmlResponse(text);
    expect(response.response.data[0].$.num_results).toBe('0');
    expect(response.response.data[0].CWA).toBeUndefined();
  });
}); 