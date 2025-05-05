const fetch = require('node-fetch');
const { parseXmlResponse } = require('../../common/test/helpers');

describe('Obstacle API', () => {
  const baseUrl = 'https://aviationweather.gov/api/data/obstacle';

  test('retrieves obstacles within bounding box', async () => {
    const bbox = '40,-90,45,-85'; // Chicago area
    const response = await fetch(`${baseUrl}?format=json&bbox=${bbox}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    
    // If obstacles are found, verify their structure
    if (data.length > 0) {
      const obstacle = data[0];
      expect(obstacle).toHaveProperty('ind');
      expect(obstacle).toHaveProperty('name');
      expect(obstacle).toHaveProperty('type');
      expect(obstacle).toHaveProperty('lat');
      expect(obstacle).toHaveProperty('lon');
      expect(obstacle).toHaveProperty('elev');
      expect(obstacle).toHaveProperty('height');
      expect(obstacle).toHaveProperty('prior');
    }
  });

  test('handles invalid bounding box gracefully', async () => {
    const bbox = 'invalid';
    const response = await fetch(`${baseUrl}?format=json&bbox=${bbox}`);
    
    expect(response.status).toBe(200);
    const text = await response.text();
    // API should return empty response for invalid bbox
    expect(text).toBe('');
  });

  test('returns different formats', async () => {
    const bbox = '40,-90,45,-85';
    const formats = ['json', 'geojson', 'raw'];

    for (const format of formats) {
      const response = await fetch(`${baseUrl}?format=${format}&bbox=${bbox}`);
      expect(response.status).toBe(200);
      
      if (format === 'json' || format === 'geojson') {
        const data = await response.json();
        expect(data).toBeDefined();
      } else {
        const text = await response.text();
        expect(text).toBeDefined();
      }
    }
  });

  test('verifies obstacle data types', async () => {
    const bbox = '40,-90,45,-85';
    const response = await fetch(`${baseUrl}?format=json&bbox=${bbox}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
    
    if (data.length > 0) {
      const obstacle = data[0];
      expect(typeof obstacle.ind).toBe('number');
      expect(typeof obstacle.name).toBe('string');
      expect(typeof obstacle.type).toBe('string');
      expect(typeof obstacle.lat).toBe('number');
      expect(typeof obstacle.lon).toBe('number');
      expect(typeof obstacle.elev).toBe('number');
      expect(typeof obstacle.height).toBe('number');
      expect(typeof obstacle.prior).toBe('number');
    }
  });
}); 