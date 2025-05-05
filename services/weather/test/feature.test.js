const fetch = require('node-fetch');
const { parseXmlResponse } = require('../../common/test/helpers');

describe('Feature API', () => {
  const baseUrl = 'https://aviationweather.gov/api/data/feature';

  test('retrieves features within bounding box', async () => {
    const bbox = '40,-90,45,-85'; // Chicago area
    const response = await fetch(`${baseUrl}?format=json&bbox=${bbox}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    
    // If features are found, verify their structure
    if (data.length > 0) {
      const feature = data[0];
      expect(feature).toHaveProperty('ind');
      expect(feature).toHaveProperty('name');
      expect(feature).toHaveProperty('type');
      expect(feature).toHaveProperty('lat');
      expect(feature).toHaveProperty('lon');
      expect(feature).toHaveProperty('elev');
      expect(feature).toHaveProperty('prior');
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
}); 