const { makeRequest } = require('./helpers');
const { parseXmlResponse } = require('../../common/test/helpers');

describe('Sectional Charts API', () => {
  test('should return a 200 status code and PDF URL for a valid city name', async () => {
    const { status, text } = await makeRequest('/vfr/sectional/chart', {
      geoname: 'New York',
      format: 'pdf'
    });
    
    expect(status).toBe(200);
    
    const result = await parseXmlResponse(text);
    const productSet = result.productSet;
    
    // Check status code
    expect(productSet.status[0].$.code).toBe('200');
    
    // Check chart details
    const product = productSet.edition[0].product[0];
    expect(product.$.productName).toBe('SECTIONAL');
    expect(product.$.chartName).toBe('Sectional.zip');
    
    // Check URL format
    expect(product.$.url).toMatch(/^https:\/\/aeronav\.faa\.gov\/visual\/\d{2}-\d{2}-\d{4}\/PDFs\/New_York\.pdf$/);
  });

  test('should handle invalid city name by defaulting to US', async () => {
    const { status, text } = await makeRequest('/vfr/sectional/chart', {
      geoname: 'InvalidCity123',
      format: 'pdf'
    });

    expect(status).toBe(200);
    const result = await parseXmlResponse(text);
    const edition = result.productSet.edition[0];
    expect(edition.$.geoname).toBe('US');
    expect(edition.$.format).toBe('ZIP');
  });

  test('should handle invalid format by defaulting to ZIP', async () => {
    const { status, text } = await makeRequest('/vfr/sectional/chart', {
      geoname: 'New York',
      format: 'invalid'
    });

    expect(status).toBe(200);
    const result = await parseXmlResponse(text);
    const edition = result.productSet.edition[0];
    expect(edition.$.format).toBe('ZIP');
    expect(edition.product[0].$.url).toContain('sectional-files/New_York.zip');
  });

  test('should handle different valid city names', async () => {
    const cities = ['Los Angeles', 'Chicago', 'Miami', 'Seattle'];
    for (const city of cities) {
      const { status, text } = await makeRequest('/vfr/sectional/chart', {
        geoname: city,
        format: 'pdf'
      });

      expect(status).toBe(200);
      const result = await parseXmlResponse(text);
      const product = result.productSet.edition[0].product[0];
      expect(product.$.productName).toBe('SECTIONAL');
      expect(product.$.url).toContain(`${city.replace(' ', '_')}.pdf`);
    }
  });
}); 