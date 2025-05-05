const { makeRequest } = require('./helpers');
const { parseXmlResponse } = require('../../common/test/helpers');

describe('Graphical AIRMET API', () => {
  test('should retrieve all G-AIRMETs', async () => {
    const { status, text } = await makeRequest('/api/data/gairmet', {
      format: 'xml'
    });

    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    
    // Handle both cases: active or no active G-AIRMETs
    if (response.response.data[0].$.num_results === '0') {
      expect(response.response.data[0].GAIRMET).toBeUndefined();
    } else {
      expect(response.response.data[0].GAIRMET).toBeDefined();
      const gairmets = response.response.data[0].GAIRMET;
      gairmets.forEach(gairmet => {
        expect(gairmet.product).toBeDefined();
        expect(gairmet.hazard).toBeDefined();
        expect(gairmet.geometry_type).toBeDefined();
        expect(gairmet.area).toBeDefined();
      });
    }
  });

  test('should filter G-AIRMETs by type', async () => {
    const { status, text } = await makeRequest('/api/data/gairmet', {
      type: 'tango',
      format: 'xml'
    });

    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    
    // Handle both cases: active or no active G-AIRMETs for the type
    if (response.response.data[0].$.num_results === '0') {
      expect(response.response.data[0].GAIRMET).toBeUndefined();
    } else {
      expect(response.response.data[0].GAIRMET).toBeDefined();
      const gairmets = response.response.data[0].GAIRMET;
      gairmets.forEach(gairmet => {
        expect(gairmet.product[0]).toBe('TANGO');
      });
    }
  });

  test('should filter G-AIRMETs by hazard', async () => {
    const { status, text } = await makeRequest('/api/data/gairmet', {
      hazard: 'turb-hi',
      format: 'xml'
    });

    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    
    // Handle both cases: active or no active G-AIRMETs for the hazard
    if (response.response.data[0].$.num_results === '0') {
      expect(response.response.data[0].GAIRMET).toBeUndefined();
    } else {
      expect(response.response.data[0].GAIRMET).toBeDefined();
      const gairmets = response.response.data[0].GAIRMET;
      gairmets.forEach(gairmet => {
        expect(gairmet.hazard[0].$.type).toBe('TURB-HI');
      });
    }
  });

  test('should handle invalid type by returning all G-AIRMETs', async () => {
    const { status, text } = await makeRequest('/api/data/gairmet', {
      type: 'invalid',
      format: 'xml'
    });

    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    expect(response.response.data[0].GAIRMET).toBeDefined();
    // Verify that we get G-AIRMETs of different types
    const products = new Set(response.response.data[0].GAIRMET.map(gairmet => gairmet.product[0]));
    expect(products.size).toBeGreaterThan(1);
  });
}); 