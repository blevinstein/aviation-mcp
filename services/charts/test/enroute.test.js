const { makeRequest } = require('./helpers');

describe('IFR Enroute Charts API', () => {
  test('should return valid response for US low altitude enroute chart', async () => {
    const { status, text } = await makeRequest('/enroute/chart', {
      geoname: 'US',
      seriesType: 'low',
      format: 'pdf'
    });

    expect(status).toBe(200);
    expect(text).toContain('<?xml');
    expect(text).toContain('geoname="US"');
    expect(text).toContain('delus1.zip');
  });

  test('should handle invalid region', async () => {
    const { status, text } = await makeRequest('/enroute/chart', {
      geoname: 'InvalidRegion123',
      seriesType: 'low',
      format: 'pdf'
    });

    expect(status).toBe(404);
    expect(text).toContain('<?xml');
  });

  test('should handle invalid series type', async () => {
    const { status, text } = await makeRequest('/enroute/chart', {
      geoname: 'US',
      seriesType: 'INVALID',
      format: 'pdf'
    });

    expect(status).toBe(404);
    expect(text).toContain('<?xml');
  });

  test('should handle different valid series types', async () => {
    const seriesTypes = ['low', 'high', 'area'];
    const prefixMap = {
      low: 'delus',
      high: 'dehus',
      area: 'darea'
    };

    for (const seriesType of seriesTypes) {
      const { status, text } = await makeRequest('/enroute/chart', {
        geoname: 'US',
        seriesType,
        format: 'pdf'
      });

      expect(status).toBe(200);
      expect(text).toContain('<?xml');
      expect(text).toContain('geoname="US"');
      expect(text).toContain(prefixMap[seriesType]);
    }
  });
}); 