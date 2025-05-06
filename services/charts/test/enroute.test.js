import { parseXmlResponse } from '../../common/test/helpers.js';
import { createChartsClient } from './helpers.js';

describe('IFR Enroute Charts API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createChartsClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get_enroute')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  test('should return a 200 status code and PDF URL for low altitude chart', async () => {
    const result = await client.callTool({
      name: 'get_enroute',
      arguments: {
        geoname: 'US',
        seriesType: 'low',
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
    expect(product.$.url).toMatch(/^https:\/\/aeronav\.faa\.gov\/enroute\/\d{2}-\d{2}-\d{4}\/delus\d+\.zip$/);
  });

  test('should return a 200 status code and PDF URL for high altitude chart', async () => {
    const result = await client.callTool({
      name: 'get_enroute',
      arguments: {
        geoname: 'US',
        seriesType: 'high',
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
    expect(product.$.url).toMatch(/^https:\/\/aeronav\.faa\.gov\/enroute\/\d{2}-\d{2}-\d{4}\/dehus\d+\.zip$/);
  });

  test('should return a 200 status code and PDF URL for area chart', async () => {
    const result = await client.callTool({
      name: 'get_enroute',
      arguments: {
        geoname: 'US',
        seriesType: 'area',
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
    expect(product.$.url).toMatch(/^https:\/\/aeronav\.faa\.gov\/enroute\/\d{2}-\d{2}-\d{4}\/darea\.zip$/);
  });

  test('should handle invalid region', async () => {
    const result = await client.callTool({
      name: 'get_enroute',
      arguments: {
        geoname: 'InvalidRegion',
        seriesType: 'low',
        format: 'pdf'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const xml = result.content[0].text;
    const parsedResponse = await parseXmlResponse(xml);
    expect(parsedResponse.productSet.status[0].$.code).toBe('404');
  });

  test('should handle invalid series type', async () => {
    const result = await client.callTool({
      name: 'get_enroute',
      arguments: {
        geoname: 'US',
        seriesType: 'invalid',
        format: 'pdf'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const xml = result.content[0].text;
    const parsedResponse = await parseXmlResponse(xml);
    expect(parsedResponse.productSet.status[0].$.code).toBe('404');
  });
}); 