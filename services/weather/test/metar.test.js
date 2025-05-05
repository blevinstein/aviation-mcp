const { makeRequest } = require('./helpers');
const { parseXmlResponse } = require('../../common/test/helpers');

describe('METAR API', () => {
  test('should return METAR data for a single station', async () => {
    const { status, text } = await makeRequest('/api/data/metar', {
      ids: 'KJFK',
      format: 'xml'
    });

    expect(status).toBe(200);
    
    const result = await parseXmlResponse(text);
    const response = result.response;
    
    // Check that we got data
    expect(response.data).toBeDefined();
    expect(response.data[0].METAR).toBeDefined();
    
    // Check station identifier
    const metar = response.data[0].METAR[0];
    expect(metar.station_id[0]).toBe('KJFK');
  });

  test('should return METAR data for multiple stations', async () => {
    const { status, text } = await makeRequest('/api/data/metar', {
      ids: 'KJFK,KLAX',
      format: 'xml'
    });

    expect(status).toBe(200);
    
    const result = await parseXmlResponse(text);
    const response = result.response;
    
    // Check that we got data for both stations
    expect(response.data).toBeDefined();
    expect(response.data[0].METAR.length).toBe(2);
    
    // Check station identifiers
    const stations = response.data[0].METAR.map(m => m.station_id[0]);
    expect(stations).toContain('KJFK');
    expect(stations).toContain('KLAX');
  });

  test('should handle invalid station', async () => {
    const { status, text } = await makeRequest('/api/data/metar', {
      ids: 'INVALID',
      format: 'xml'
    });

    expect(status).toBe(200);  // API returns 200 even for invalid stations
    
    const result = await parseXmlResponse(text);
    const response = result.response;
    
    // Should return empty data array
    expect(response.data[0].$).toBeDefined();
    expect(response.data[0].$.num_results).toBe('0');
    expect(response.data[0].METAR).toBeUndefined();
  });

  test('should handle historical data request', async () => {
    const { status, text } = await makeRequest('/api/data/metar', {
      ids: 'KJFK',
      hours: 3,
      mostRecent: false,
      format: 'xml'
    });

    expect(status).toBe(200);
    
    const result = await parseXmlResponse(text);
    const response = result.response;
    
    // Should return multiple observations
    expect(response.data[0].METAR.length).toBeGreaterThan(1);
    
    // All observations should be for the requested station
    const stations = response.data[0].METAR.map(m => m.station_id[0]);
    expect(stations.every(id => id === 'KJFK')).toBe(true);
  });
}); 