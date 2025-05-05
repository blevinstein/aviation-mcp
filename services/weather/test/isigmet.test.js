const { makeRequest } = require('./helpers');
const { parseXmlResponse } = require('../../common/test/helpers');

describe('International SIGMET API', () => {
  test('should retrieve all international SIGMETs', async () => {
    const { status, text } = await makeRequest('/api/data/isigmet', {
      format: 'xml'
    });
    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    const sigmets = response.response.data[0].ISIGMET;
    
    if (sigmets) {
      sigmets.forEach(sigmet => {
        expect(sigmet.raw_text).toBeDefined();
        expect(sigmet.fir).toBeDefined();
        expect(sigmet.fir_name).toBeDefined();
        expect(sigmet.valid_time_from).toBeDefined();
        expect(sigmet.valid_time_to).toBeDefined();
        expect(sigmet.hazard).toBeDefined();
        expect(sigmet.hazard[0].$.type).toBeDefined();
        if (sigmet.hazard[0].$.qualifier) {
          expect(typeof sigmet.hazard[0].$.qualifier).toBe('string');
        }
      });
    }
  });

  test('should filter international SIGMETs by hazard type', async () => {
    const { status, text } = await makeRequest('/api/data/isigmet', {
      hazard: 'turb',
      format: 'xml'
    });
    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    const sigmets = response.response.data[0].ISIGMET;
    
    if (sigmets) {
      sigmets.forEach(sigmet => {
        expect(sigmet.hazard[0].$.type).toBe('TURB');
      });
    }
  });

  test('should filter international SIGMETs by flight level', async () => {
    const { status, text } = await makeRequest('/api/data/isigmet', {
      level: 180,
      format: 'xml'
    });
    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    const sigmets = response.response.data[0].ISIGMET;
    
    if (sigmets) {
      sigmets.forEach(sigmet => {
        if (sigmet.altitude) {
          const minLevel = parseInt(sigmet.altitude[0].$.base_ft_msl || '0');
          const maxLevel = parseInt(sigmet.altitude[0].$.top_ft_msl || '999999');
          expect(18000 >= minLevel - 3000 && 18000 <= maxLevel + 3000).toBe(true);
        }
      });
    }
  });

  test('should handle invalid hazard type by returning all SIGMETs', async () => {
    const { status, text } = await makeRequest('/api/data/isigmet', {
      hazard: 'invalid',
      format: 'xml'
    });
    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    const sigmets = response.response.data[0].ISIGMET;
    
    expect(sigmets).toBeDefined();
    if (sigmets) {
      expect(Array.isArray(sigmets)).toBe(true);
      expect(sigmets.length).toBeGreaterThan(0);
    }
  });
}); 