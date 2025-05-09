import { createClient } from '../../common/test/helpers.js';

describe('NOTAM API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get_notams')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });
  
  // This test would require valid API credentials to run
  test('should retrieve NOTAMs', async () => {
    const result = await client.callTool({
      name: 'get_notams',
      arguments: {
        icaoLocation: 'KJFK',
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    // Parse the JSON response
    const data = JSON.parse(result.content[0].text);
    
    // Check response structure
    expect(data.pageSize).toBeDefined();
    expect(data.pageNum).toBeDefined();
    expect(data.items).toBeDefined();
    expect(Array.isArray(data.items)).toBe(true);
  });
}); 