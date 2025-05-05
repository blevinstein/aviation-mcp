const { makeRequest } = require('./helpers');

describe('Forecast Discussion API', () => {
  test('should retrieve forecast discussion for a WFO', async () => {
    const { status, text } = await makeRequest('/api/data/fcstdisc', {
      cwa: 'KOKX',
      type: 'afd',
      format: 'xml'
    });

    expect(status).toBe(200);
    expect(text).toContain('National Weather Service');
    expect(text).toContain('TAF period');
  });

  test('should handle invalid WFO', async () => {
    const { status, text } = await makeRequest('/api/data/fcstdisc', {
      cwa: 'INVALID',
      type: 'afd',
      format: 'xml'
    });

    expect(status).toBe(200);
    expect(text).toContain('No AFD available');
  });

  test('should handle full discussion request', async () => {
    const { status, text } = await makeRequest('/api/data/fcstdisc', {
      cwa: 'KOKX',
      type: 'af',
      format: 'xml'
    });

    expect(status).toBe(200);
    expect(text).toContain('National Weather Service');
  });
}); 