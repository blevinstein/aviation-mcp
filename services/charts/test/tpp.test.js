const { makeRequest } = require('./helpers');
const { parseXmlResponse } = require('../../common/test/helpers');

// Increase timeout for all tests in this suite
jest.setTimeout(30000);

describe('Terminal Procedures Publication API', () => {
  test('should return a 200 status code and ZIP URL for a valid region', async () => {
    const { status, text } = await makeRequest('/dtpp/chart', {
      geoname: 'US'
    });
    
    expect(status).toBe(200);
    
    const result = await parseXmlResponse(text);
    const productSet = result.productSet;
    
    // Check status code
    expect(productSet.status[0].$.code).toBe('200');
    
    // Check chart details
    const product = result.productSet.edition[0].product[0];
    expect(product.$.productName).toBe('TPP');
    
    // Check URL format
    const url = product.$.url;
    expect(url).toMatch(/^https:\/\/aeronav\.faa\.gov\/upload_\d{3}-d\/terminal\/DDTPPA_\d{6}\.zip$/);
  });

  it('should handle invalid region', async () => {
    const { status, text } = await makeRequest('/dtpp/chart', {
      geoname: 'INVALID',
      edition: 'current'
    });

    expect(status).toBe(400);
    const result = await parseXmlResponse(text);
    expect(result.productSet.status[0].$.code).toBe('400');
  });

  // TODO: State-specific TPP charts are not currently supported by the API.
  // The API returns 404 for state names despite documentation suggesting support.
  // Revisit this test when/if the API adds support for state-specific TPP charts.

  test('should handle changeset edition', async () => {
    const { status, text } = await makeRequest('/dtpp/chart', {
      geoname: 'US',
      edition: 'changeset'
    });

    expect(status).toBe(200);
    const result = await parseXmlResponse(text);
    const product = result.productSet.edition[0].product[0];
    expect(product.$.productName).toBe('TPP');
  });
}); 