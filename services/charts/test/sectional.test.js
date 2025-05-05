const { makeRequest } = require('./helpers');

describe('Sectional Charts API', () => {
  test('should return valid response for New York sectional chart', async () => {
    const { status, text } = await makeRequest('/vfr/sectional/chart', {
      geoname: 'New York',
      format: 'pdf'
    });

    expect(status).toBe(200);
    expect(text).toContain('<?xml');
    expect(text).toContain('SECTIONAL');
    expect(text).toContain('New_York.pdf');
  });

  test('should handle invalid city name by defaulting to US', async () => {
    const { status, text } = await makeRequest('/vfr/sectional/chart', {
      geoname: 'InvalidCity123',
      format: 'pdf'
    });

    expect(status).toBe(200);
    expect(text).toContain('<?xml');
    expect(text).toContain('geoname="US"');
    expect(text).toContain('format="ZIP"');
  });

  test('should handle invalid format by defaulting to ZIP', async () => {
    const { status, text } = await makeRequest('/vfr/sectional/chart', {
      geoname: 'New York',
      format: 'invalid'
    });

    expect(status).toBe(200);
    expect(text).toContain('<?xml');
    expect(text).toContain('format="ZIP"');
    expect(text).toContain('sectional-files/New_York.zip');
  });

  test('should handle different valid city names', async () => {
    const cities = ['Los Angeles', 'Chicago', 'Miami', 'Seattle'];
    for (const city of cities) {
      const { status, text } = await makeRequest('/vfr/sectional/chart', {
        geoname: city,
        format: 'pdf'
      });

      expect(status).toBe(200);
      expect(text).toContain('<?xml');
      expect(text).toContain('SECTIONAL');
      expect(text).toContain(`${city.replace(' ', '_')}.pdf`);
    }
  });
}); 