const { makeRequest } = require('./helpers');

describe('Meteorological Impact Statement API', () => {
  test('should retrieve MIS data', async () => {
    const { status, text } = await makeRequest('/api/data/mis', {
      format: 'xml'
    });

    expect(status).toBe(200);
    expect(text).toContain('MIS - Meteorological Impact Statement');
    
    // Handle both cases: active or no active MIS
    if (text.includes('No MIS active')) {
      expect(text.trim()).toBe('MIS - Meteorological Impact Statement\nNo MIS active');
    } else {
      expect(text).toContain('CWSU:');
      expect(text).toContain('VALID');
    }
  });

  test('should filter MIS by location', async () => {
    const { status, text } = await makeRequest('/api/data/mis', {
      loc: 'ZOB',
      format: 'xml'
    });

    expect(status).toBe(200);
    
    // Handle both cases: active or no active MIS for the location
    if (text.includes('No MIS active')) {
      expect(text.trim()).toBe('MIS - Meteorological Impact Statement\nNo MIS active');
    } else {
      expect(text).toContain('CWSU: ZOB');
      expect(text).not.toContain('CWSU: ZOA');
    }
  });

  test('should handle invalid location', async () => {
    const { status, text } = await makeRequest('/api/data/mis', {
      loc: 'INVALID',
      format: 'xml'
    });

    expect(status).toBe(200);
    expect(text.trim()).toBe('MIS - Meteorological Impact Statement\nNo MIS active');
  });
}); 