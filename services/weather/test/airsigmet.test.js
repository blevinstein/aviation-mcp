const { makeRequest } = require('./helpers');
const { parseXmlResponse } = require('../../common/test/helpers');

describe('Domestic SIGMET API', () => {
  test('should retrieve all SIGMETs', async () => {
    const { status, text } = await makeRequest('/api/data/airsigmet', {
      format: 'xml'
    });

    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    
    // Handle both cases: active or no active SIGMETs
    if (response.response.data[0].$.num_results === '0') {
      expect(response.response.data[0].AIRSIGMET).toBeUndefined();
    } else {
      expect(response.response.data[0].AIRSIGMET).toBeDefined();
      const sigmets = response.response.data[0].AIRSIGMET;
      sigmets.forEach(sigmet => {
        expect(sigmet.hazard).toBeDefined();
        expect(sigmet.area).toBeDefined();
        expect(sigmet.valid_time_from).toBeDefined();
        expect(sigmet.valid_time_to).toBeDefined();
      });
    }
  });

  test('should filter SIGMETs by hazard type', async () => {
    const { status, text } = await makeRequest('/api/data/airsigmet', {
      hazard: 'conv',
      format: 'xml'
    });

    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    
    // Handle both cases: active or no active SIGMETs for the hazard
    if (response.response.data[0].$.num_results === '0') {
      expect(response.response.data[0].AIRSIGMET).toBeUndefined();
    } else {
      expect(response.response.data[0].AIRSIGMET).toBeDefined();
      const sigmets = response.response.data[0].AIRSIGMET;
      sigmets.forEach(sigmet => {
        expect(sigmet.hazard[0].$.type).toBe('CONVECTIVE');
      });
    }
  });

  test('should filter SIGMETs by flight level', async () => {
    const { status, text } = await makeRequest('/api/data/airsigmet', {
      level: 180,
      format: 'xml'
    });

    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    
    // Handle both cases: active or no active SIGMETs for the level
    if (response.response.data[0].$.num_results === '0') {
      expect(response.response.data[0].AIRSIGMET).toBeUndefined();
    } else {
      expect(response.response.data[0].AIRSIGMET).toBeDefined();
      const sigmets = response.response.data[0].AIRSIGMET;
      sigmets.forEach(sigmet => {
        // Check that the flight level is within ±3000 feet of the requested level
        const minLevel = parseInt(sigmet.altitude[0].$.min_ft_msl || '0');
        const maxLevel = parseInt(sigmet.altitude[0].$.max_ft_msl || '999999');
        expect(18000 >= minLevel - 3000 && 18000 <= maxLevel + 3000).toBe(true);
      });
    }
  });

  test('should handle invalid hazard type', async () => {
    const { status, text } = await makeRequest('/api/data/airsigmet', {
      hazard: 'invalid',
      format: 'xml'
    });

    expect(status).toBe(200);
    const response = await parseXmlResponse(text);
    expect(response.response.data[0].$.num_results).toBe('0');
    expect(response.response.data[0].AIRSIGMET).toBeUndefined();
  });
}); 