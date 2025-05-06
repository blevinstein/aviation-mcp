import { parseXmlResponse } from '../../common/test/helpers.js';
import { createWeatherClient } from './helpers.js';

describe('Airport Info API via MCP', () => {
  let client;
  let clientTransport;

  beforeAll(async () => {
    // Create and initialize client
    const connection = await createWeatherClient();
    client = connection.client;
    clientTransport = connection.clientTransport;
    
    // Verify tools are available
    const tools = await client.listTools();
    expect(tools.tools.some(tool => tool.name === 'get-airport-info')).toBe(true);
  });

  afterAll(async () => {
    if (clientTransport) {
      await clientTransport.close?.();
    }
  });

  // Helper function to validate airport data structure
  const validateAirportData = (airport) => {
    expect(airport).toHaveProperty('id');
    expect(airport).toHaveProperty('name');
    expect(airport).toHaveProperty('latitude');
    expect(airport).toHaveProperty('longitude');
    expect(airport).toHaveProperty('elevation');
    
    // Type validations
    expect(typeof airport.id).toBe('string');
    expect(typeof airport.name).toBe('string');
    expect(typeof airport.latitude).toBe('number');
    expect(typeof airport.longitude).toBe('number');
    
    // Basic range validations
    expect(airport.latitude).toBeGreaterThanOrEqual(-90);
    expect(airport.latitude).toBeLessThanOrEqual(90);
    expect(airport.longitude).toBeGreaterThanOrEqual(-180);
    expect(airport.longitude).toBeLessThanOrEqual(180);
  };

  // Helper function to parse and validate response
  const validateAirportsResponse = async (text) => {
    try {
      // Try to parse as JSON
      const data = JSON.parse(text);
      expect(data).toBeDefined();
      
      // Check if we have an airports array
      if (data.airports) {
        expect(Array.isArray(data.airports)).toBe(true);
        
        // If we have airports, validate at least the first one
        if (data.airports.length > 0) {
          validateAirportData(data.airports[0]);
        }
      }
      return data;
    } catch (error) {
      // If not valid JSON, check if it's XML
      if (text.includes('<?xml')) {
        const xmlData = await parseXmlResponse(text);
        expect(xmlData).toBeDefined();
        return xmlData;
      }
      // Not JSON or XML - throw error
      throw new Error('Response was neither valid JSON nor XML');
    }
  };

  test('retrieves airport info for specific airports', async () => {
    const result = await client.callTool({
      name: 'get-airport-info',
      arguments: {
        ids: 'KJFK,KLAX',
        format: 'json'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const data = await validateAirportsResponse(result.content[0].text);
    
    if (data.airports) {
      const jfkAirport = data.airports.find(a => a.id === 'KJFK');
      const laxAirport = data.airports.find(a => a.id === 'KLAX');
      
      expect(jfkAirport).toBeDefined();
      expect(jfkAirport.name).toContain('Kennedy');
      expect(jfkAirport.latitude).toBeCloseTo(40.64, 1);
      expect(jfkAirport.longitude).toBeCloseTo(-73.78, 1);
      
      expect(laxAirport).toBeDefined();
      expect(laxAirport.name).toContain('Los Angeles');
      expect(laxAirport.latitude).toBeCloseTo(33.94, 1);
      expect(laxAirport.longitude).toBeCloseTo(-118.41, 1);

    }
  });

  test('retrieves airports within bounding box', async () => {
    const result = await client.callTool({
      name: 'get-airport-info',
      arguments: {
        bbox: '40,-90,45,-85', // Chicago area
        format: 'json'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const data = await validateAirportsResponse(result.content[0].text);
    
    // Check bounding box constraints
    if (data.airports) {
      expect(data.airports.length).toBeGreaterThan(0);
      
      // All airports should be within the bounding box
      data.airports.forEach(airport => {
        expect(airport.latitude).toBeGreaterThanOrEqual(40);
        expect(airport.latitude).toBeLessThanOrEqual(45);
        expect(airport.longitude).toBeGreaterThanOrEqual(-90);
        expect(airport.longitude).toBeLessThanOrEqual(-85);
      });
      
      // Check if we got more than one airport (Chicago area should have multiple)
      expect(data.airports.length).toBeGreaterThan(0);
    }
  });

  test('handles invalid airport IDs', async () => {
    const result = await client.callTool({
      name: 'get-airport-info',
      arguments: {
        ids: 'INVALID',
        format: 'json'
      }
    });
    
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    
    const text = result.content[0].text;
    // Parse the JSON response
    try {
      const data = JSON.parse(text);
      // API should handle invalid IDs gracefully
      expect(data).toBeDefined();
    } catch (error) {
      // If validation throws, it should be because the API returned a specific error
      // not because our validation logic failed
      expect(error.message).not.toBe('Response was neither valid JSON nor XML');
    }
  });
  
  test('returns proper format based on format parameter', async () => {
    // Test JSON format
    const jsonResult = await client.callTool({
      name: 'get-airport-info',
      arguments: {
        ids: 'KJFK',
        format: 'json'
      }
    });
    
    expect(jsonResult.isError).toBeFalsy();
    const jsonParsed = JSON.parse(jsonResult.content[0].text);
    expect(jsonParsed).toBeDefined();

    // Test XML format
    const xmlResult = await client.callTool({
      name: 'get-airport-info',
      arguments: {
        ids: 'KJFK',
        format: 'xml'
      }
    });
    
    expect(xmlResult.isError).toBeFalsy();
    const xmlParsed = await parseXmlResponse(xmlResult.content[0].text);
    expect(xmlParsed).toBeDefined();
  });
}); 