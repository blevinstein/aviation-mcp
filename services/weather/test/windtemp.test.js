import { createClient } from '../../common/test/helpers.js';

describe('Wind & Temperature Aloft API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get_windtemp')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('should retrieve forecasts for all regions', async () => {
    const result = await client.callTool({
      name: 'get_windtemp',
      arguments: {
        region: 'all',
        level: 'low',
        fcst: '06',
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    expect(text).toMatch(/FD[0-9]US[0-9]/);
    expect(text).toContain('DATA BASED ON');
  });

  test('should retrieve forecasts for specific region', async () => {
    const result = await client.callTool({
      name: 'get_windtemp',
      arguments: {
        region: 'bos',
        level: 'low',
        fcst: '06',
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    expect(text).toMatch(/FD[0-9]/);
    expect(text).toContain('DATA BASED ON');
  });

  test('should retrieve high altitude forecasts', async () => {
    const result = await client.callTool({
      name: 'get_windtemp',
      arguments: {
        region: 'all',
        level: 'high',
        fcst: '06',
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    expect(text).toMatch(/FD[0-9]/);
    expect(text).toContain('DATA BASED ON');
    expect(text).toContain('45000');  // High altitude levels
  });

  test('should retrieve forecasts for different forecast times', async () => {
    const fcstPeriods = ['06', '12', '24'];
    for (const fcst of fcstPeriods) {
      const result = await client.callTool({
        name: 'get_windtemp',
        arguments: {
          region: 'all',
          level: 'low',
          fcst,
        }
      });
      
      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      
      const text = result.content[0].text;
      expect(text).toMatch(/FD[0-9]/);
      expect(text).toContain('DATA BASED ON');
    }
  });

  test('should handle Alaska region forecasts', async () => {
    const result = await client.callTool({
      name: 'get_windtemp',
      arguments: {
        region: 'alaska',
        level: 'low',
        fcst: '06',
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    expect(text).toMatch(/FD[0-9]/);
    expect(text).toContain('DATA BASED ON');
  });

  test('should handle Hawaii region forecasts', async () => {
    const result = await client.callTool({
      name: 'get_windtemp',
      arguments: {
        region: 'hawaii',
        level: 'low',
        fcst: '06',
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    expect(text).toMatch(/FD[0-9]/);
    expect(text).toContain('DATA BASED ON');
  });
}); 