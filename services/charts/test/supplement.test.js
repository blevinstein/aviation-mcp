import { createClient } from '../../common/test/helpers.js';

describe('Supplement Chart API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get_supplement')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('should return a 200 status code and Supplement product for a valid volume', async () => {
    const result = await client.callTool({
      name: 'get_supplement',
      arguments: {
        volume: 'NORTHWEST',
        edition: 'current'
      }
    });

    console.warn(JSON.stringify(result));
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');

    const json = JSON.parse(result.content[0].text);
    expect(json.editionDate).toBeDefined();
    expect(json.region).toBeDefined();
    expect(json.url).toBeDefined();
  }, 30_000);

  test('should handle invalid volume by returning an error', async () => {
    const result = await client.callTool({
      name: 'get_supplement',
      arguments: {
        volume: 'INVALID_VOLUME',
        edition: 'current'
      }
    });
    expect(result.isError).toBeTruthy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toMatch(/Invalid value for volume/i);
  });

  test('should handle invalid edition by returning an error', async () => {
    const result = await client.callTool({
      name: 'get_supplement',
      arguments: {
        volume: 'NORTHWEST',
        edition: 'invalid'
      }
    });
    expect(result.isError).toBeTruthy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toMatch(/Invalid value for edition/i);
  });
}); 