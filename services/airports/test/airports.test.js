import { createAirportsClient } from './helpers.js';

describe.skip('ADIP Airport API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    const connection = await createAirportsClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get_airport_details')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('should get airport details for a valid locId', async () => {
    const result = await client.callTool({
      name: 'get_airport_details',
      arguments: { locId: 'SFO' }
    });
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('id');
  });

  test('should return error for missing locId', async () => {
    const result = await client.callTool({
      name: 'get_airport_details',
      arguments: {}
    });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toMatch(/locId/);
  });

  test('should list airports in a radius', async () => {
    const result = await client.callTool({
      name: 'list_airports_radius',
      arguments: { lat: 37.6188056, lon: -122.3754167, radius: 50 }
    });
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    const data = JSON.parse(result.content[0].text);
    expect(data).toBeDefined();
  });

  test('should return error for missing lat/lon/radius in radius search', async () => {
    const result = await client.callTool({
      name: 'list_airports_radius',
      arguments: { lat: 37.6 }
    });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toMatch(/lat|lon|radius/);
  });

  test('should list airports in a radius for a locId', async () => {
    const result = await client.callTool({
      name: 'list_airports_radius_for_loc',
      arguments: { locId: 'SFO', radius: 50 }
    });
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    const data = JSON.parse(result.content[0].text);
    expect(data).toBeDefined();
  });

  test('should return error for missing locId in radius for locId', async () => {
    const result = await client.callTool({
      name: 'list_airports_radius_for_loc',
      arguments: { radius: 50 }
    });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toMatch(/locId/);
  });

  test('should list airports in a bbox', async () => {
    const result = await client.callTool({
      name: 'list_airports_bbox',
      arguments: { lat: 37.6, lon: -122.3, bbox: '[0.5,0.5]' }
    });
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    const data = JSON.parse(result.content[0].text);
    expect(data).toBeDefined();
  });

  test('should return error for missing bbox in bbox search', async () => {
    const result = await client.callTool({
      name: 'list_airports_bbox',
      arguments: { lat: 37.6, lon: -122.3 }
    });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toMatch(/bbox/);
  });

  test('should list airports in a bbox for a locId', async () => {
    const result = await client.callTool({
      name: 'list_airports_bbox_for_loc',
      arguments: { locId: 'SFO', bbox: '[0.5,0.5]' }
    });
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    const data = JSON.parse(result.content[0].text);
    expect(data).toBeDefined();
  });

  test('should return error for missing locId in bbox for locId', async () => {
    const result = await client.callTool({
      name: 'list_airports_bbox_for_loc',
      arguments: { bbox: '[0.5,0.5]' }
    });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toMatch(/locId/);
  });

  test('should search for airports', async () => {
    const result = await client.callTool({
      name: 'airport_search',
      arguments: { search: { name: 'San Francisco' } }
    });
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    const data = JSON.parse(result.content[0].text);
    expect(data).toBeDefined();
  });

  test('should return error for missing search object in airport_search', async () => {
    const result = await client.callTool({
      name: 'airport_search',
      arguments: {}
    });
    expect(result.isError).toBeTruthy();
    expect(result.content[0].text).toMatch(/search/);
  });
}); 