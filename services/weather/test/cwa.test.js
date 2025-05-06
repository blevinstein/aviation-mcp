import { createClient } from '../../common/test/helpers.js';

describe('Center Weather Advisory API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createClient();
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
      arguments: {},
    });

    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    expect(text).toContain('Center Weather Advisories');
  });

  test('should filter CWAs by location', async () => {
    const result = await client.callTool({
      name: 'get_cwa',
      arguments: {
        loc: 'ZAB',
      }
    });

    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Center Weather Advisories');
  });

  test('should filter CWAs by hazard type', async () => {
    const result = await client.callTool({
      name: 'get_cwa',
      arguments: {
        hazard: 'ts',
      }
    });

    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    expect(text).toContain('Center Weather Advisories');
  });
}); 