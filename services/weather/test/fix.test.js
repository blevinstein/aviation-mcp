const fetch = require('node-fetch');
const { parseXmlResponse } = require('../../common/test/helpers');

describe('Fix API', () => {
  const baseUrl = 'https://aviationweather.gov/api/data/fix';

  test('retrieves fix info for specific fixes', async () => {
    const ids = 'BARBQ,ORD';
    const response = await fetch(`${baseUrl}?format=json&ids=${ids}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
    
    // If fixes are found, verify their structure
    if (data.fixes && data.fixes.length > 0) {
      const fix = data.fixes[0];
      expect(fix).toHaveProperty('id');
      expect(fix).toHaveProperty('latitude');
      expect(fix).toHaveProperty('longitude');
    }
  });

  test('retrieves fixes within bounding box', async () => {
    const bbox = '40,-90,45,-85'; // Chicago area
    const response = await fetch(`${baseUrl}?format=json&bbox=${bbox}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
    
    // If fixes are found, verify their structure
    if (data.fixes && data.fixes.length > 0) {
      const fix = data.fixes[0];
      expect(fix).toHaveProperty('id');
      expect(fix).toHaveProperty('latitude');
      expect(fix).toHaveProperty('longitude');
    }
  });

  test('handles invalid fix IDs', async () => {
    const ids = 'INVALID';
    const response = await fetch(`${baseUrl}?format=json&ids=${ids}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    // API should handle invalid IDs gracefully
    expect(data).toBeDefined();
  });
}); 