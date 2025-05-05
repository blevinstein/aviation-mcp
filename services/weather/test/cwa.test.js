const { makeRequest } = require('./helpers');
const { parseXmlResponse } = require('../../common/test/helpers');

describe('Center Weather Advisory API', () => {
  test('should retrieve all CWAs', async () => {
    const { status, text } = await makeRequest('/api/data/cwa', {
      format: 'xml'
    });

    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    
    // Handle both cases: active or no active CWAs
    if (response.response.data[0].$.num_results === '0') {
      expect(response.response.data[0].CWA).toBeUndefined();
    } else {
      expect(response.response.data[0].CWA).toBeDefined();
      expect(response.response.data[0].CWA[0].cwsu).toBeDefined();
      expect(response.response.data[0].CWA[0].hazard).toBeDefined();
    }
  });

  test('should filter CWAs by location', async () => {
    const { status, text } = await makeRequest('/api/data/cwa', {
      loc: 'ZAB',
      format: 'xml'
    });

    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    
    // Handle both cases: active or no active CWAs for the location
    if (response.response.data[0].$.num_results === '0') {
      expect(response.response.data[0].CWA).toBeUndefined();
    } else {
      expect(response.response.data[0].CWA).toBeDefined();
      const cwas = response.response.data[0].CWA;
      cwas.forEach(cwa => {
        expect(cwa.cwsu[0]).toBe('ZAB');
      });
    }
  });

  test('should filter CWAs by hazard type', async () => {
    const { status, text } = await makeRequest('/api/data/cwa', {
      hazard: 'ts',
      format: 'xml'
    });

    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    
    // Handle both cases: active or no active CWAs for the hazard type
    if (response.response.data[0].$.num_results === '0') {
      expect(response.response.data[0].CWA).toBeUndefined();
    } else {
      expect(response.response.data[0].CWA).toBeDefined();
      const cwas = response.response.data[0].CWA;
      cwas.forEach(cwa => {
        expect(cwa.hazard[0].$.type).toBe('TS');
      });
    }
  });

  test('should handle no results', async () => {
    const { status, text } = await makeRequest('/api/data/cwa', {
      loc: 'INVALID',
      format: 'xml'
    });

    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    expect(response.response.data[0].$.num_results).toBe('0');
    expect(response.response.data[0].CWA).toBeUndefined();
  });
}); 