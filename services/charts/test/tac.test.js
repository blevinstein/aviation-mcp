const { makeRequest } = require('./helpers');

describe('Terminal Area Charts API', () => {
  test('should return valid response for Los Angeles TAC', async () => {
    const { status, text } = await makeRequest('/vfr/tac/chart', {
      geoname: 'Los Angeles',
      format: 'pdf'
    });

    expect(status).toBe(200);
    expect(text).toContain('<?xml');
    expect(text).toContain('TAC');
    expect(text).toContain('Los_Angeles_TAC.pdf');
  });

  test('should handle invalid city name', async () => {
    const { status, text } = await makeRequest('/vfr/tac/chart', {
      geoname: 'InvalidCity123',
      format: 'pdf'
    });

    expect(status).toBe(404);
    expect(text).toContain('<?xml');
  });

  test('should handle invalid format', async () => {
    const { status, text } = await makeRequest('/vfr/tac/chart', {
      geoname: 'Los Angeles',
      format: 'invalid'
    });

    expect(status).toBe(400);
    expect(text).toContain('<?xml');
  });
}); 