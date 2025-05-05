const fetch = require('node-fetch');
const { parseXmlResponse } = require('../../common/test/helpers');

describe('Navaid API', () => {
  const baseUrl = 'https://aviationweather.gov/api/data/navaid';

  test('retrieves navaid info for specific navaids', async () => {
    const ids = 'MCI,ORD';
    const response = await fetch(`${baseUrl}?format=json&ids=${ids}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
    
    // If navaids are found, verify their structure
    if (data.navaids && data.navaids.length > 0) {
      const navaid = data.navaids[0];
      expect(navaid).toHaveProperty('id');
      expect(navaid).toHaveProperty('type');
      expect(navaid).toHaveProperty('latitude');
      expect(navaid).toHaveProperty('longitude');
      expect(navaid).toHaveProperty('elevation');
    }
  });

  test('retrieves navaids within bounding box', async () => {
    const bbox = '40,-90,45,-85'; // Chicago area
    const response = await fetch(`${baseUrl}?format=json&bbox=${bbox}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
    
    // If navaids are found, verify their structure
    if (data.navaids && data.navaids.length > 0) {
      const navaid = data.navaids[0];
      expect(navaid).toHaveProperty('id');
      expect(navaid).toHaveProperty('type');
      expect(navaid).toHaveProperty('latitude');
      expect(navaid).toHaveProperty('longitude');
      expect(navaid).toHaveProperty('elevation');
    }
  });

  test('handles invalid navaid IDs', async () => {
    const ids = 'INVALID';
    const response = await fetch(`${baseUrl}?format=json&ids=${ids}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    // API should handle invalid IDs gracefully
    expect(data).toBeDefined();
  });
}); 