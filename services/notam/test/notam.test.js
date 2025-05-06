import { createNotamClient } from './helpers.js';

describe('NOTAM API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createNotamClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get-notams')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test.skip('should require client ID and client secret', async () => {
    const result = await client.callTool({
      name: 'get_notams',
      arguments: {
        icaoLocation: 'KJFK'
        // No credentials
      }
    });
    
    expect(result.isError).toBeTruthy();
    expect(result.error.message).toContain('Client ID and Client Secret are required');
  });

  test.skip('should include API parameters in error message', async () => {
    const result = await client.callTool({
      name: 'get_notams',
      arguments: {
        icaoLocation: 'KJFK',
        featureType: 'RWY',
        clientId: 'invalid-id',
        clientSecret: 'invalid-secret'
      }
    });
    
    // The API should return an error since we're using invalid credentials
    expect(result.isError).toBeTruthy();
    expect(result.error.message).toBeDefined();
  });
  
  // This test would require valid API credentials to run
  test.skip('should retrieve NOTAMs when valid credentials are provided', async () => {
    const result = await client.callTool({
      name: 'get_notams',
      arguments: {
        icaoLocation: 'KJFK',
        clientId: process.env.NOTAM_CLIENT_ID,
        clientSecret: process.env.NOTAM_CLIENT_SECRET
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