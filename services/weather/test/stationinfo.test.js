const fetch = require('node-fetch');
const { parseXmlResponse } = require('../../common/test/helpers');

describe('Station Info API', () => {
  const baseUrl = 'https://aviationweather.gov/api/data/stationinfo';

  test('retrieves station info for specific stations', async () => {
    const ids = 'KJFK,KLAX';
    const response = await fetch(`${baseUrl}?format=json&ids=${ids}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
    
    // If stations are found, verify their structure
    if (data.stations && data.stations.length > 0) {
      const station = data.stations[0];
      expect(station).toHaveProperty('id');
      expect(station).toHaveProperty('latitude');
      expect(station).toHaveProperty('longitude');
      expect(station).toHaveProperty('elevation');
    }
  });

  test('retrieves stations within bounding box', async () => {
    const bbox = '40,-90,45,-85'; // Chicago area
    const response = await fetch(`${baseUrl}?format=json&bbox=${bbox}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
    
    // If stations are found, verify their structure
    if (data.stations && data.stations.length > 0) {
      const station = data.stations[0];
      expect(station).toHaveProperty('id');
      expect(station).toHaveProperty('latitude');
      expect(station).toHaveProperty('longitude');
      expect(station).toHaveProperty('elevation');
    }
  });

  test('handles invalid station IDs', async () => {
    const ids = 'INVALID';
    const response = await fetch(`${baseUrl}?format=json&ids=${ids}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    // API should handle invalid IDs gracefully
    expect(data).toBeDefined();
  });
}); 