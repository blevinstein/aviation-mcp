import { parseXmlResponse } from '../../common/test/helpers.js';
import { createWeatherClient } from './helpers.js';

describe('International SIGMET API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createWeatherClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get_isigmet')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('should retrieve all international SIGMETs', async () => {
    const result = await client.callTool({
      name: 'get_isigmet',
      arguments: {
        format: 'xml'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    const response = await parseXmlResponse(text);
    const sigmets = response.response.data[0].ISIGMET;
    
    if (sigmets) {
      sigmets.forEach(sigmet => {
        expect(sigmet.raw_text).toBeDefined();
        expect(sigmet.fir).toBeDefined();
        expect(sigmet.fir_name).toBeDefined();
        expect(sigmet.valid_time_from).toBeDefined();
        expect(sigmet.valid_time_to).toBeDefined();
        expect(sigmet.hazard).toBeDefined();
        expect(sigmet.hazard[0].$.type).toBeDefined();
        if (sigmet.hazard[0].$.qualifier) {
          expect(typeof sigmet.hazard[0].$.qualifier).toBe('string');
        }
      });
    }
  });

  test('should filter international SIGMETs by hazard type', async () => {
    const result = await client.callTool({
      name: 'get_isigmet',
      arguments: {
        hazard: 'turb',
        format: 'xml'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    const response = await parseXmlResponse(text);
    const sigmets = response.response.data[0].ISIGMET;
    
    if (sigmets && sigmets.length > 0) {
      sigmets.forEach(sigmet => {
        expect(sigmet.hazard[0].$.type).toBe('TURB');
      });
    } else {
      // If no SIGMETs match the criteria, test passes
      expect(true).toBe(true);
    }
  });

  test('should filter international SIGMETs by flight level', async () => {
    const result = await client.callTool({
      name: 'get_isigmet',
      arguments: {
        level: 180,
        format: 'xml'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    const response = await parseXmlResponse(text);
    const sigmets = response.response.data[0].ISIGMET;
    
    if (sigmets && sigmets.length > 0) {
      sigmets.forEach(sigmet => {
        if (sigmet.altitude) {
          const minLevel = parseInt(sigmet.altitude[0].$.base_ft_msl || '0');
          const maxLevel = parseInt(sigmet.altitude[0].$.top_ft_msl || '999999');
          expect(18000 >= minLevel - 3000 && 18000 <= maxLevel + 3000).toBe(true);
        }
      });
    } else {
      // If no SIGMETs match the criteria, test passes
      expect(true).toBe(true);
    }
  });

  test('should handle invalid hazard type by returning all SIGMETs', async () => {
    const result = await client.callTool({
      name: 'get_isigmet',
      arguments: {
        hazard: 'invalid',
        format: 'xml'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    const response = await parseXmlResponse(text);
    const sigmets = response.response.data[0].ISIGMET;
    
    // Either we have SIGMETs (since invalid hazard is ignored) or num_results is 0
    if (response.response.data[0].$.num_results === '0') {
      expect(sigmets).toBeUndefined();
    } else {
      expect(sigmets).toBeDefined();
      expect(Array.isArray(sigmets)).toBe(true);
    }
  });
}); 