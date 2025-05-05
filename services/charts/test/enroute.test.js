const { makeRequest } = require('./helpers');
const { parseXmlResponse } = require('../../common/test/helpers');

describe('IFR Enroute Charts API', () => {
  test('should return a 200 status code and PDF URL for low altitude chart', async () => {
    const { status, text } = await makeRequest('/enroute/chart', {
      geoname: 'US',
      seriesType: 'low',
      format: 'pdf'
    });
    
    expect(status).toBe(200);
    
    const result = await parseXmlResponse(text);
    const productSet = result.productSet;
    
    // Check status code
    expect(productSet.status[0].$.code).toBe('200');
    
    // Check chart details
    const product = productSet.edition[0].product[0];
    expect(product.$.url).toMatch(/^https:\/\/aeronav\.faa\.gov\/enroute\/\d{2}-\d{2}-\d{4}\/delus\d+\.zip$/);
  });

  test('should return a 200 status code and PDF URL for high altitude chart', async () => {
    const { status, text } = await makeRequest('/enroute/chart', {
      geoname: 'US',
      seriesType: 'high',
      format: 'pdf'
    });
    
    expect(status).toBe(200);
    
    const result = await parseXmlResponse(text);
    const productSet = result.productSet;
    
    // Check status code
    expect(productSet.status[0].$.code).toBe('200');
    
    // Check chart details
    const product = productSet.edition[0].product[0];
    expect(product.$.url).toMatch(/^https:\/\/aeronav\.faa\.gov\/enroute\/\d{2}-\d{2}-\d{4}\/dehus\d+\.zip$/);
  });

  test('should return a 200 status code and PDF URL for area chart', async () => {
    const { status, text } = await makeRequest('/enroute/chart', {
      geoname: 'US',
      seriesType: 'area',
      format: 'pdf'
    });
    
    expect(status).toBe(200);
    
    const result = await parseXmlResponse(text);
    const productSet = result.productSet;
    
    // Check status code
    expect(productSet.status[0].$.code).toBe('200');
    
    // Check chart details
    const product = productSet.edition[0].product[0];
    expect(product.$.url).toMatch(/^https:\/\/aeronav\.faa\.gov\/enroute\/\d{2}-\d{2}-\d{4}\/darea\.zip$/);
  });

  test('should handle invalid region', async () => {
    const { status, text } = await makeRequest('/enroute/chart', {
      geoname: 'InvalidRegion',
      seriesType: 'low',
      format: 'pdf'
    });

    expect(status).toBe(404);
    const result = await parseXmlResponse(text);
    expect(result.productSet.status[0].$.code).toBe('404');
  });

  test('should handle invalid series type', async () => {
    const { status, text } = await makeRequest('/enroute/chart', {
      geoname: 'US',
      seriesType: 'invalid',
      format: 'pdf'
    });

    expect(status).toBe(404);
    const result = await parseXmlResponse(text);
    expect(result.productSet.status[0].$.code).toBe('404');
  });
}); 