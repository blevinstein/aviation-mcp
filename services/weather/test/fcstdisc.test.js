import { createClient } from '../../common/test/helpers.js';

describe('Forecast Discussion API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get_fcstdisc')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('should retrieve forecast discussion for a WFO', async () => {
    const result = await client.callTool({
      name: 'get_fcstdisc',
      arguments: {
        cwa: 'KOKX',
        type: 'afd',
      }
    });

    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    expect(text).toContain('National Weather Service');
  });

  test('should handle invalid WFO', async () => {
    const result = await client.callTool({
      name: 'get_fcstdisc',
      arguments: {
        cwa: 'INVALID',
        type: 'afd',
      }
    });

    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].text).toContain('No AFD available');
  });

  test('should handle full discussion request', async () => {
    const result = await client.callTool({
      name: 'get_fcstdisc',
      arguments: {
        cwa: 'KOKX',
        type: 'af',
      }
    });

    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    expect(text).toContain('National Weather Service');
  });
}); 