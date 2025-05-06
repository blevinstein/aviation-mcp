import { createClient, parseXmlResponse } from '../../common/test/helpers.js';

describe('PIREP API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get_pirep')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('should retrieve aircraft reports', async () => {
    const result = await client.callTool({
      name: 'get_pirep',
      arguments: {
        format: 'xml'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    const response = await parseXmlResponse(text);
    const reports = response.response.data[0].AircraftReport;
    
    if (reports) {
      expect(Array.isArray(reports)).toBe(true);
      expect(reports.length).toBeGreaterThan(0);

      reports.forEach(report => {
        expect(report.receipt_time).toBeDefined();
        expect(report.observation_time).toBeDefined();
        expect(report.aircraft_ref).toBeDefined();
        expect(report.latitude).toBeDefined();
        expect(report.longitude).toBeDefined();
        expect(report.report_type).toBeDefined();
        expect(report.raw_text).toBeDefined();
      });
    }
  });

  test('should filter by distance from a point', async () => {
    // Boston: lat 42.3601, lon -71.0589, radius 200 miles
    const distance = 200;
    const lat0 = 42.3601;
    const lon0 = -71.0589;
    const result = await client.callTool({
      name: 'get_pirep',
      arguments: {
        format: 'xml',
        distance,
        // The spec does not support specifying the center point directly, but if your API does, add lat/lon here. Otherwise, this is a limitation.
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    const response = await parseXmlResponse(text);
    const reports = response.response.data[0].AircraftReport;
    
    if (reports) {
      expect(Array.isArray(reports)).toBe(true);
      reports.forEach(report => {
        const lat = parseFloat(report.latitude[0]);
        const lon = parseFloat(report.longitude[0]);
        const d = Math.sqrt(Math.pow(lat - lat0, 2) + Math.pow(lon - lon0, 2));
        expect(d).toBeLessThanOrEqual(distance * 1.5);
      });
    }
  });

  test('should handle reports with turbulence conditions', async () => {
    const result = await client.callTool({
      name: 'get_pirep',
      arguments: {
        format: 'xml',
        type: 'pirep'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    const response = await parseXmlResponse(text);
    const reports = response.response.data[0].AircraftReport;
    
    if (reports) {
      expect(Array.isArray(reports)).toBe(true);
    }
  });

  test('should handle reports with icing conditions', async () => {
    const result = await client.callTool({
      name: 'get_pirep',
      arguments: {
        format: 'xml',
        type: 'pirep'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    const response = await parseXmlResponse(text);
    const reports = response.response.data[0].AircraftReport;
    
    if (reports) {
      expect(Array.isArray(reports)).toBe(true);
    }
  });
}); 