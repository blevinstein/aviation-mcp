import { parseXmlResponse } from '../../common/test/helpers.js';
import { createWeatherClient } from './helpers.js';

describe('MIS API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createWeatherClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get_mis')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('should retrieve MIS data', async () => {
    const result = await client.callTool({
      name: 'get_mis',
      arguments: {
        format: 'xml'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    expect(text).toContain('MIS - Meteorological Impact Statement');
    
    // Handle both cases: active or no active MIS
    if (text.includes('No MIS active')) {
      expect(text.trim()).toBe('MIS - Meteorological Impact Statement\nNo MIS active');
    } else {
      expect(text).toContain('CWSU:');
      expect(text).toContain('VALID');
    }
  });

  test('should filter MIS by location', async () => {
    const result = await client.callTool({
      name: 'get_mis',
      arguments: {
        loc: 'ZOB',
        format: 'xml'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    
    // Handle both cases: active or no active MIS for the location
    if (text.includes('No MIS active')) {
      expect(text.trim()).toBe('MIS - Meteorological Impact Statement\nNo MIS active');
    } else {
      expect(text).toContain('CWSU: ZOB');
      expect(text).not.toContain('CWSU: ZOA');
    }
  });

  test('should handle invalid location', async () => {
    const result = await client.callTool({
      name: 'get_mis',
      arguments: {
        loc: 'INVALID',
        format: 'xml'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    expect(text.trim()).toBe('MIS - Meteorological Impact Statement\nNo MIS active');
  });
}); 