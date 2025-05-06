import { parseXmlResponse } from '../../common/test/helpers.js';
import { createWeatherClient } from './helpers.js';

describe('Graphical AIRMET API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createWeatherClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get-gairmet')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('should retrieve all G-AIRMETs', async () => {
    const result = await client.callTool({
      name: 'get-gairmet',
      arguments: {
        format: 'xml'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    const response = await parseXmlResponse(text);
    
    // Handle both cases: active or no active G-AIRMETs
    if (response.response.data[0].$.num_results === '0') {
      expect(response.response.data[0].GAIRMET).toBeUndefined();
    } else {
      expect(response.response.data[0].GAIRMET).toBeDefined();
      const gairmets = response.response.data[0].GAIRMET;
      gairmets.forEach(gairmet => {
        expect(gairmet.product).toBeDefined();
        expect(gairmet.hazard).toBeDefined();
        expect(gairmet.geometry_type).toBeDefined();
        expect(gairmet.area).toBeDefined();
      });
    }
  });

  test('should filter G-AIRMETs by type', async () => {
    const result = await client.callTool({
      name: 'get-gairmet',
      arguments: {
        type: 'tango',
        format: 'xml'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    const response = await parseXmlResponse(text);
    
    // Handle both cases: active or no active G-AIRMETs for the type
    if (response.response.data[0].$.num_results === '0') {
      expect(response.response.data[0].GAIRMET).toBeUndefined();
    } else {
      expect(response.response.data[0].GAIRMET).toBeDefined();
      const gairmets = response.response.data[0].GAIRMET;
      gairmets.forEach(gairmet => {
        expect(gairmet.product[0]).toBe('TANGO');
      });
    }
  });

  test('should filter G-AIRMETs by hazard', async () => {
    const result = await client.callTool({
      name: 'get-gairmet',
      arguments: {
        hazard: 'turb-hi',
        format: 'xml'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    const response = await parseXmlResponse(text);
    
    // Handle both cases: active or no active G-AIRMETs for the hazard
    if (response.response.data[0].$.num_results === '0') {
      expect(response.response.data[0].GAIRMET).toBeUndefined();
    } else {
      expect(response.response.data[0].GAIRMET).toBeDefined();
      const gairmets = response.response.data[0].GAIRMET;
      gairmets.forEach(gairmet => {
        expect(gairmet.hazard[0].$.type).toBe('TURB-HI');
      });
    }
  });

  test('should handle invalid type by returning all G-AIRMETs', async () => {
    const result = await client.callTool({
      name: 'get-gairmet',
      arguments: {
        type: 'invalid',
        format: 'xml'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    const response = await parseXmlResponse(text);
    
    // There might not be any active GAIRMETs
    if (response.response.data[0].$.num_results !== '0') {
      expect(response.response.data[0].GAIRMET).toBeDefined();
      // Verify that we get G-AIRMETs of different types
      const products = new Set(response.response.data[0].GAIRMET.map(gairmet => gairmet.product[0]));
      expect(products.size).toBeGreaterThan(0);
    }
  });
}); 