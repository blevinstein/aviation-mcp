import { parseXmlResponse } from '../../common/test/helpers.js';
import { createChartsClient } from './helpers.js';

describe('Terminal Procedures Publication API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createChartsClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get_tpp')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('should return a 200 status code and ZIP URL for a valid region', async () => {
    const result = await client.callTool({
      name: 'get_tpp',
      arguments: {
        icao: 'KJFK'
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
    
    // Check that there are editions (at least one)
    expect(productSet.edition).toBeDefined();
    expect(productSet.edition.length).toBeGreaterThan(0);
    
    // Check chart details - the product is inside the edition array
    const product = productSet.edition[0].product[0];
    expect(product.$.productName).toBe('TPP');
    
    // Check URL format
    const url = product.$.url;
    expect(url).toMatch(/^https:\/\/aeronav\.faa\.gov\/.*\.zip$/);
  });

  it('should handle invalid airport code', async () => {
    const result = await client.callTool({
      name: 'get_tpp',
      arguments: {
        icao: 'INVALID',
        chartType: 'ALL'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const xml = result.content[0].text;
    const parsedResponse = await parseXmlResponse(xml);
    
    // For invalid airports, the API still returns a 200 status code
    // We just check that we got a valid response
    expect(parsedResponse.productSet).toBeDefined();
    expect(parsedResponse.productSet.status[0]).toBeDefined();
  });

  // TODO: State-specific TPP charts are not currently supported by the API.
  // The API returns 404 for state names despite documentation suggesting support.
  // Revisit this test when/if the API adds support for state-specific TPP charts.

  test('should handle IAP chart type', async () => {
    const result = await client.callTool({
      name: 'get_tpp',
      arguments: {
        icao: 'KJFK',
        chartType: 'IAP'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const xml = result.content[0].text;
    const parsedResponse = await parseXmlResponse(xml);
    
    // Check that we got a valid response
    expect(parsedResponse.productSet).toBeDefined();
    expect(parsedResponse.productSet.status[0]).toBeDefined();
    
    // If there are editions, check at least one product
    if (parsedResponse.productSet.edition && 
        parsedResponse.productSet.edition.length > 0 && 
        parsedResponse.productSet.edition[0].product) {
      const product = parsedResponse.productSet.edition[0].product[0];
      expect(product.$.productName).toBe('TPP');
    }
  });
}); 