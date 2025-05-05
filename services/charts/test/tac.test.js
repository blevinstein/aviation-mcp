const { makeRequest } = require('./helpers');
const { parseXmlResponse } = require('../../common/test/helpers');

describe('Terminal Area Charts API', () => {
  test('should return a 200 status code and PDF URL for a valid city name', async () => {
    const { status, text } = await makeRequest('/vfr/tac/chart', {
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
    expect(product.$.productName).toBe('TAC');
    
    // Check URL format
    const url = product.$.url;
    expect(url).toMatch(/^https:\/\/aeronav\.faa\.gov\/visual\/\d{2}-\d{2}-\d{4}\/PDFs\/[^/]+_TAC\.pdf$/);
    expect(url.toLowerCase()).toContain('new_york_tac.pdf');
  });

  test('should handle invalid city name', async () => {
    const { status, text } = await makeRequest('/vfr/tac/chart', {
      geoname: 'InvalidCity123',
      format: 'pdf'
    });

    expect(status).toBe(404);
    const result = await parseXmlResponse(text);
    expect(result.productSet.status[0].$.code).toBe('404');
  });

  test('should handle invalid format', async () => {
    const { status, text } = await makeRequest('/vfr/tac/chart', {
      geoname: 'New York',
      format: 'invalid'
    });

    expect(status).toBe(400);
    const result = await parseXmlResponse(text);
    expect(result.productSet.status[0].$.code).toBe('400');
  });

  test('should handle different valid city names', async () => {
    const cities = ['Los Angeles', 'Chicago', 'Miami', 'Seattle'];
    for (const city of cities) {
      const { status, text } = await makeRequest('/vfr/tac/chart', {
        geoname: city,
        format: 'pdf'
      });

      expect(status).toBe(200);
      const result = await parseXmlResponse(text);
      const product = result.productSet.edition[0].product[0];
      expect(product.$.productName).toBe('TAC');
      
      const url = product.$.url;
      expect(url).toMatch(/^https:\/\/aeronav\.faa\.gov\/visual\/\d{2}-\d{2}-\d{4}\/PDFs\/[^/]+_TAC\.pdf$/);
      expect(url.toLowerCase()).toContain(`${city.toLowerCase().replace(' ', '_')}_tac.pdf`);
    }
  });
}); 