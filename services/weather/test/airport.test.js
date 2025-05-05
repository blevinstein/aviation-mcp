const fetch = require('node-fetch');
const { parseXmlResponse } = require('../../common/test/helpers');

describe('Airport API', () => {
  const baseUrl = 'https://aviationweather.gov/api/data/airport';

  test('retrieves airport info for specific airports', async () => {
    const ids = 'KJFK,KLAX';
    const response = await fetch(`${baseUrl}?format=json&ids=${ids}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
    
    // If airports are found, verify their structure
    if (data.airports && data.airports.length > 0) {
      const airport = data.airports[0];
      expect(airport).toHaveProperty('id');
      expect(airport).toHaveProperty('name');
      expect(airport).toHaveProperty('latitude');
      expect(airport).toHaveProperty('longitude');
      expect(airport).toHaveProperty('elevation');
    }
  });

  test('retrieves airports within bounding box', async () => {
    const bbox = '40,-90,45,-85'; // Chicago area
    const response = await fetch(`${baseUrl}?format=json&bbox=${bbox}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
    
    // If airports are found, verify their structure
    if (data.airports && data.airports.length > 0) {
      const airport = data.airports[0];
      expect(airport).toHaveProperty('id');
      expect(airport).toHaveProperty('name');
      expect(airport).toHaveProperty('latitude');
      expect(airport).toHaveProperty('longitude');
      expect(airport).toHaveProperty('elevation');
    }
  });

  test('handles invalid airport IDs', async () => {
    const ids = 'INVALID';
    const response = await fetch(`${baseUrl}?format=json&ids=${ids}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    // API should handle invalid IDs gracefully
    expect(data).toBeDefined();
  });
}); 