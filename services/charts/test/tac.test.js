import { parseXmlResponse } from '../../common/test/helpers.js';
import { createChartsClient } from './helpers.js';

describe('Terminal Area Charts API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createChartsClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get_tac')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('should return a 200 status code and PDF URL for a valid city name', async () => {
    const result = await client.callTool({
      name: 'get_tac',
      arguments: {
        geoname: 'New York',
        format: 'pdf'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const xml = result.content[0].text;
    const parsedResponse = await parseXmlResponse(xml);
    const productSet = parsedResponse.productSet;
    
    // Check status code
    expect(productSet.status[0].$.code).toBe('200');
    
    // Check chart details
    const product = productSet.edition[0].product[0];
    expect(product.$.productName).toBe('TAC');
    
    // Check URL format
    const url = product.$.url;
    expect(url).toMatch(/^https:\/\/aeronav\.faa\.gov\/visual\/\d{2}-\d{2}-\d{4}\/PDFs\/[^/]+_TAC\.pdf$/);
    expect(url.toLowerCase()).toContain('new_york_tac.pdf');
  });

  test('should handle invalid city name by returning an error', async () => {
    const result = await client.callTool({
      name: 'get_tac',
      arguments: {
        geoname: 'InvalidCity123',
        format: 'pdf'
      }
    });
    expect(result.isError).toBeTruthy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toMatch(/Invalid value for geoname/i);
  });

  test('should handle invalid format by returning an error', async () => {
    const result = await client.callTool({
      name: 'get_tac',
      arguments: {
        geoname: 'New York',
        format: 'invalid'
      }
    });
    expect(result.isError).toBeTruthy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toMatch(/Invalid value for format/i);
  });

  test('should handle different valid city names', async () => {
    const cities = ['Los Angeles', 'Chicago', 'Miami', 'Seattle'];
    for (const city of cities) {
      const result = await client.callTool({
        name: 'get_tac',
        arguments: {
          geoname: city,
          format: 'pdf'
        }
      });
      
      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      
      const xml = result.content[0].text;
      const parsedResponse = await parseXmlResponse(xml);
      const product = parsedResponse.productSet.edition[0].product[0];
      expect(product.$.productName).toBe('TAC');
      
      const url = product.$.url;
      expect(url).toMatch(/^https:\/\/aeronav\.faa\.gov\/visual\/\d{2}-\d{2}-\d{4}\/PDFs\/[^/]+_TAC\.pdf$/);
      expect(url.toLowerCase()).toContain(`${city.toLowerCase().replace(' ', '_')}_tac.pdf`);
    }
  });
}); 