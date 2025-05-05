const { makeRequest } = require('./helpers');
const { parseXmlResponse } = require('../../common/test/helpers');

describe('TAF API', () => {
  test('should retrieve TAF data for a single station', async () => {
    const { status, text } = await makeRequest('/api/data/taf', {
      ids: 'KJFK',
      format: 'xml'
    });

    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    expect(response.response.data[0].TAF).toBeDefined();
    expect(response.response.data[0].TAF[0].station_id[0]).toBe('KJFK');
    expect(response.response.data[0].TAF[0].forecast).toBeDefined();
  });

  test('should retrieve TAF data for multiple stations', async () => {
    const { status, text } = await makeRequest('/api/data/taf', {
      ids: 'KJFK,KLAX',
      format: 'xml'
    });

    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    expect(response.response.data[0].TAF).toBeDefined();
    const stations = response.response.data[0].TAF.map(taf => taf.station_id[0]);
    expect(stations).toContain('KJFK');
    expect(stations).toContain('KLAX');
  });

  test('should handle invalid station', async () => {
    const { status, text } = await makeRequest('/api/data/taf', {
      ids: 'INVALID',
      format: 'xml'
    });

    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    expect(response.response.data[0].$).toBeDefined();
    expect(response.response.data[0].$.num_results).toBe('0');
    expect(response.response.data[0].TAF).toBeUndefined();
  });

  test('should handle historical data request', async () => {
    const { status, text } = await makeRequest('/api/data/taf', {
      ids: 'KJFK',
      format: 'xml',
      hours_before: 3
    });

    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    expect(response.response.data[0].TAF).toBeDefined();
    expect(response.response.data[0].TAF[0].station_id[0]).toBe('KJFK');
  });
}); 